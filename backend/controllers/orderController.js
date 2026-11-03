const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

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

// @desc    Update order status (Pending -> Processing -> Shipped -> Delivered)
// @route   PUT /api/orders/:id/status
// @access  Private / Admin or Staff with manage_orders
const updateOrderStatus = async (req, res) => {
    try {
        // Fixed: Use req.params.id (not req.params._id)
        const order = await Order.findById(req.params.id);

        if (order) {
            const { status, isPaid } = req.body;
            if (status) {
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
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Dashboard Statistics (Sales, Orders, Products, Low Stock)
// @route   GET /api/orders/stats
// @access  Private / Admin or Staff
const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments({});
        const pendingOrders = await Order.countDocuments({ status: 'Pending' });
        const orders = await Order.find({ status: { $ne: 'Cancelled' } });
        const totalRevenue = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

        const totalProducts = await Product.countDocuments({});
        const lowStockProducts = await Product.countDocuments({ countInStock: { $lte: 5 } });
        const outOfStockProducts = await Product.countDocuments({
            $or: [{ countInStock: 0 }, { isOutOfStock: true }],
        });

        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalStaff = await User.countDocuments({ role: { $in: ['staff', 'admin'] } });

        const recentOrders = await Order.find({})
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalOrders,
            pendingOrders,
            totalProducts,
            lowStockProducts,
            outOfStockProducts,
            totalUsers,
            totalStaff,
            recentOrders,
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
