const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const emailService = require('../utils/emailService');

// @desc    Create new order & decrement stock
// @route   POST /api/orders
// @access  Private / Customers
const addOrderItems = async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        // 1. Stock Validation Check
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.name}` });
            }

            if (product.isOutOfStock || product.countInStock < item.qty) {
                return res.status(400).json({
                    message: `Cannot order ${product.name}: only ${product.countInStock} available in stock`,
                });
            }
        }

        // 2. Decrement product stock in database
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            product.countInStock = Math.max(0, product.countInStock - item.qty);
            if (product.countInStock === 0) {
                product.isOutOfStock = true;
            }
            await product.save();
        }

        // 3. Create the Order
        const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod: paymentMethod || 'COD',
            totalPrice: Number(totalPrice) || 0,
            isPaid: paymentMethod === 'Online' || paymentMethod === 'Card',
            paidAt: paymentMethod === 'Online' || paymentMethod === 'Card' ? Date.now() : null,
            status: 'Pending',
        });

        const createdOrder = await order.save();

        // Real-Time Notification: Emit new order to admin channel
        const io = req.app.get('io');
        if (io) {
            io.to('admin_channel').emit('newOrderPlaced', {
                orderId: createdOrder._id,
                totalPrice: createdOrder.totalPrice,
                customer: req.user.name,
                createdAt: createdOrder.createdAt
            });
        }

        // Email Notification: Send order confirmation
        emailService.sendOrderConfirmationEmail({
            order: createdOrder,
            customerEmail: req.user.email,
            customerName: req.user.name
        });

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email phone');

        if (order) {
            // Check if current user is owner or admin/staff
            const isOwner = order.user._id.toString() === req.user._id.toString();
            const isStaffOrAdmin =
                req.user.isAdmin ||
                req.user.role === 'admin' ||
                (req.user.role === 'staff' && req.user.permissions?.includes('manage_orders'));

            if (isOwner || isStaffOrAdmin) {
                res.json(order);
            } else {
                res.status(403).json({ message: 'Not authorized to view this order' });
            }
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders (Admin / Staff)
// @route   GET /api/orders
// @access  Private / Admin or Staff with manage_orders
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'id name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status (Pending -> Processing -> Shipped -> Delivered -> Cancelled / Returned)
// @route   PUT /api/orders/:id/status
// @access  Private / Admin or Staff with manage_orders
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const { status, isPaid } = req.body;

        if (status) {
            // If cancelling or returning, restock items back into inventory
            if (
                (status === 'Cancelled' || status === 'Returned') &&
                order.status !== 'Cancelled' &&
                order.status !== 'Returned'
            ) {
                for (const item of order.orderItems) {
                    const prod = await Product.findById(item.product);
                    if (prod) {
                        prod.countInStock += item.qty;
                        if (prod.countInStock > 0) {
                            prod.isOutOfStock = false;
                        }
                        await prod.save();
                    }
                }
            }

            order.status = status;
            if (status === 'Delivered') {
                order.deliveredAt = Date.now();
                order.isPaid = true;
                order.paidAt = order.paidAt || Date.now();
            }
        }

        if (isPaid !== undefined) {
            order.isPaid = Boolean(isPaid);
            if (order.isPaid && !order.paidAt) {
                order.paidAt = Date.now();
            }
        }

        const updatedOrder = await order.save();

        // Real-Time Notification: Emit order status update to user & admin
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${order.user}`).emit('orderStatusUpdated', {
                orderId: updatedOrder._id,
                status: updatedOrder.status,
                isPaid: updatedOrder.isPaid,
                updatedAt: new Date()
            });
            io.to('admin_channel').emit('orderStatusUpdated', {
                orderId: updatedOrder._id,
                status: updatedOrder.status,
                isPaid: updatedOrder.isPaid,
                updatedAt: new Date()
            });
        }

        // Email Notification: Send order status change update
        const orderCustomer = await User.findById(updatedOrder.user);
        if (orderCustomer && orderCustomer.email) {
            emailService.sendOrderStatusEmail({
                order: updatedOrder,
                customerEmail: orderCustomer.email,
                customerName: orderCustomer.name,
                newStatus: updatedOrder.status
            });
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Comprehensive Dashboard Statistics & Charts
// @route   GET /api/orders/stats
// @access  Private / Admin or Staff
const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments({});
        const pendingOrders = await Order.countDocuments({ status: 'Pending' });
        const processingOrders = await Order.countDocuments({ status: 'Processing' });
        const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
        const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
        const cancelledOrders = await Order.countDocuments({ status: { $in: ['Cancelled', 'Returned'] } });

        const nonCancelledOrders = await Order.find({ status: { $nin: ['Cancelled', 'Returned'] } });
        const totalRevenue = nonCancelledOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

        const totalProducts = await Product.countDocuments({});
        const lowStockProducts = await Product.find({ countInStock: { $lte: 5 } }).select('name image price countInStock isOutOfStock category brand');
        const outOfStockProducts = await Product.countDocuments({
            $or: [{ countInStock: 0 }, { isOutOfStock: true }],
        });

        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalStaff = await User.countDocuments({ role: { $in: ['staff', 'admin'] } });

        const recentOrders = await Order.find({})
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(8);

        // 1. Weekly Sales Trend (Last 7 days)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklySales = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const nextD = new Date(d);
            nextD.setDate(nextD.getDate() + 1);

            const dayOrders = nonCancelledOrders.filter((o) => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= d && orderDate < nextD;
            });

            const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            weeklySales.push({
                day: dayNames[d.getDay()],
                date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                revenue: dayRevenue,
                orders: dayOrders.length,
            });
        }

        // 2. Monthly Trend (Last 6 months)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlySales = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth();
            const y = d.getFullYear();

            const monthOrders = nonCancelledOrders.filter((o) => {
                const od = new Date(o.createdAt);
                return od.getMonth() === m && od.getFullYear() === y;
            });

            const mRevenue = monthOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            monthlySales.push({
                month: monthNames[m],
                year: y,
                revenue: mRevenue,
                orders: monthOrders.length,
            });
        }

        // 3. Category Sales Distribution
        const categoryMap = {};
        nonCancelledOrders.forEach((order) => {
            order.orderItems.forEach((item) => {
                const cat = item.category || 'General';
                categoryMap[cat] = (categoryMap[cat] || 0) + (item.price * item.qty);
            });
        });

        // 4. Top Selling Products
        const productSalesMap = {};
        nonCancelledOrders.forEach((order) => {
            order.orderItems.forEach((item) => {
                const pId = item.product ? item.product.toString() : item.name;
                if (!productSalesMap[pId]) {
                    productSalesMap[pId] = {
                        name: item.name,
                        image: item.image,
                        price: item.price,
                        unitsSold: 0,
                        revenue: 0,
                    };
                }
                productSalesMap[pId].unitsSold += item.qty;
                productSalesMap[pId].revenue += item.price * item.qty;
            });
        });

        const topProducts = Object.values(productSalesMap)
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 5);

        res.json({
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalOrders,
            pendingOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            totalProducts,
            lowStockCount: lowStockProducts.length,
            lowStockProducts,
            outOfStockProducts,
            totalUsers,
            totalStaff,
            recentOrders,
            weeklySales,
            monthlySales,
            categorySales: categoryMap,
            topProducts,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getOrders,
    updateOrderStatus,
    getOrderStats,
};
