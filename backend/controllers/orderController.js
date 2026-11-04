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
            trackingNumber: `DC-TRK-${Date.now().toString().slice(-6)}`,
            courierPartner: 'BlueDart Express',
            invoice: {
                invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
                invoiceDate: new Date(),
                subtotal: Number(totalPrice) || 0,
                taxAmount: Math.round((Number(totalPrice) || 0) * 0.18),
                discountAmount: 0,
            },
            timeline: [
                {
                    status: 'Pending',
                    title: 'Order Placed',
                    description: `Order successfully placed via ${paymentMethod || 'COD'}.`,
                    timestamp: new Date(),
                    performedBy: req.user?.name || 'Customer',
                },
            ],
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

            order.timeline = order.timeline || [];
            order.timeline.push({
                status,
                title: `Status: ${status}`,
                description: `Order status updated to ${status}.`,
                timestamp: new Date(),
                performedBy: req.user?.name || 'Administrator',
            });
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

// @desc    Get Comprehensive Enterprise Dashboard Statistics & Charts
// @route   GET /api/orders/stats
// @access  Private / Admin or Staff
const getOrderStats = async (req, res) => {
    try {
        const now = new Date();
        let filterStartDate = null;
        let filterEndDate = new Date();
        let prevFilterStartDate = null;
        let prevFilterEndDate = null;

        const range = req.query.range ? req.query.range.toLowerCase() : 'all';

        if (req.query.startDate && req.query.endDate) {
            filterStartDate = new Date(req.query.startDate);
            filterEndDate = new Date(req.query.endDate);
            const duration = filterEndDate.getTime() - filterStartDate.getTime();
            prevFilterEndDate = new Date(filterStartDate.getTime());
            prevFilterStartDate = new Date(filterStartDate.getTime() - duration);
        } else if (range === 'today') {
            filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            prevFilterStartDate = new Date(filterStartDate.getTime() - 24 * 60 * 60 * 1000);
            prevFilterEndDate = new Date(filterStartDate.getTime());
        } else if (range === '7d') {
            filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            prevFilterStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            prevFilterEndDate = new Date(filterStartDate.getTime());
        } else if (range === '30d') {
            filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            prevFilterStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            prevFilterEndDate = new Date(filterStartDate.getTime());
        } else if (range === '90d') {
            filterStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            prevFilterStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            prevFilterEndDate = new Date(filterStartDate.getTime());
        } else if (range === '1y') {
            filterStartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            prevFilterStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
            prevFilterEndDate = new Date(filterStartDate.getTime());
        }

        // Date query object for orders
        const dateMatch = filterStartDate ? { createdAt: { $gte: filterStartDate, $lte: filterEndDate } } : {};

        // 1. Total Orders & Status counts within range
        const totalOrders = await Order.countDocuments(dateMatch);
        const pendingOrders = await Order.countDocuments({ ...dateMatch, status: 'Pending' });
        const processingOrders = await Order.countDocuments({ ...dateMatch, status: 'Processing' });
        const shippedOrders = await Order.countDocuments({ ...dateMatch, status: 'Shipped' });
        const deliveredOrders = await Order.countDocuments({ ...dateMatch, status: 'Delivered' });
        const cancelledOrders = await Order.countDocuments({ ...dateMatch, status: { $in: ['Cancelled', 'Returned'] } });

        // Non-cancelled orders for revenue & profit calculation
        const nonCancelledOrders = await Order.find({
            ...dateMatch,
            status: { $nin: ['Cancelled', 'Returned'] },
        });

        const totalRevenue = nonCancelledOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

        // Fetch products mapping to compute actual profit
        const productIds = [];
        nonCancelledOrders.forEach((o) => {
            if (Array.isArray(o.orderItems)) {
                o.orderItems.forEach((i) => {
                    if (i.product) productIds.push(i.product);
                });
            }
        });

        const productsFound = await Product.find({ _id: { $in: productIds } }).select('costPrice price');
        const productCostMap = {};
        productsFound.forEach((p) => {
            productCostMap[p._id.toString()] = p.costPrice > 0 ? p.costPrice : Math.round((p.price || 0) * 0.65);
        });

        // Compute total profit
        let totalProfit = 0;
        nonCancelledOrders.forEach((order) => {
            if (Array.isArray(order.orderItems)) {
                order.orderItems.forEach((item) => {
                    const unitCost =
                        item.product && productCostMap[item.product.toString()] !== undefined
                            ? productCostMap[item.product.toString()]
                            : Math.round((item.price || 0) * 0.65);
                    const itemMargin = ((item.price || 0) - unitCost) * (item.qty || 1);
                    totalProfit += itemMargin;
                });
            }
        });

        // Average Order Value
        const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

        // Global Catalog & Customer Counts
        const totalProducts = await Product.countDocuments({});
        const lowStockProducts = await Product.find({ countInStock: { $lte: 5 } }).select(
            'name image price countInStock isOutOfStock category brand updatedAt'
        );
        const outOfStockProducts = await Product.countDocuments({
            $or: [{ countInStock: 0 }, { isOutOfStock: true }],
        });

        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalStaff = await User.countDocuments({ role: { $in: ['staff', 'admin'] } });

        // Conversion Rate (Orders / Total Registered Customers ratio * 100)
        const conversionRate = totalUsers > 0 ? Math.min(100, Math.round(((totalOrders / totalUsers) * 100) * 10) / 10) : 0;

        // Previous Period Performance for Growth Indicators
        let revenueGrowthPercent = 0;
        let orderGrowthPercent = 0;
        if (prevFilterStartDate && prevFilterEndDate) {
            const prevOrdersList = await Order.find({
                createdAt: { $gte: prevFilterStartDate, $lte: prevFilterEndDate },
                status: { $nin: ['Cancelled', 'Returned'] },
            });
            const prevRevenue = prevOrdersList.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
            const prevOrdersCount = await Order.countDocuments({
                createdAt: { $gte: prevFilterStartDate, $lte: prevFilterEndDate },
            });

            if (prevRevenue > 0) {
                revenueGrowthPercent = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10;
            } else if (totalRevenue > 0) {
                revenueGrowthPercent = 100;
            }

            if (prevOrdersCount > 0) {
                orderGrowthPercent = Math.round(((totalOrders - prevOrdersCount) / prevOrdersCount) * 1000) / 10;
            } else if (totalOrders > 0) {
                orderGrowthPercent = 100;
            }
        }

        // 2. TIME SERIES: Daily Revenue Comparison (Last 14 days)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyComparison = [];
        const allNonCancelledOrders = await Order.find({
            status: { $nin: ['Cancelled', 'Returned'] },
        }).sort({ createdAt: -1 });

        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const nextD = new Date(d);
            nextD.setDate(nextD.getDate() + 1);

            const dayOrders = allNonCancelledOrders.filter((o) => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= d && orderDate < nextD;
            });

            const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            const dayProfit = Math.round(dayRevenue * 0.35);

            dailyComparison.push({
                day: dayNames[d.getDay()],
                date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                revenue: dayRevenue,
                orders: dayOrders.length,
                profit: dayProfit,
            });
        }

        // 3. TIME SERIES: Weekly Revenue Comparison (Last 8 weeks)
        const weeklyComparison = [];
        for (let w = 7; w >= 0; w--) {
            const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
            const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

            const weekOrders = allNonCancelledOrders.filter((o) => {
                const od = new Date(o.createdAt);
                return od >= weekStart && od < weekEnd;
            });

            const weekRev = weekOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            weeklyComparison.push({
                week: `Wk ${8 - w}`,
                label: `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
                revenue: weekRev,
                orders: weekOrders.length,
                profit: Math.round(weekRev * 0.35),
            });
        }

        // 4. TIME SERIES: Monthly Trend (Last 12 months)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyComparison = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth();
            const y = d.getFullYear();

            const monthOrders = allNonCancelledOrders.filter((o) => {
                const od = new Date(o.createdAt);
                return od.getMonth() === m && od.getFullYear() === y;
            });

            const mRevenue = monthOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            monthlyComparison.push({
                month: monthNames[m],
                year: y,
                label: `${monthNames[m]} ${y}`,
                revenue: mRevenue,
                orders: monthOrders.length,
                profit: Math.round(mRevenue * 0.35),
            });
        }

        // 5. TIME SERIES: Yearly Comparison (Last 4 years)
        const yearlyComparison = [];
        const currentYear = now.getFullYear();
        for (let y = currentYear - 3; y <= currentYear; y++) {
            const yOrders = allNonCancelledOrders.filter((o) => {
                const od = new Date(o.createdAt);
                return od.getFullYear() === y;
            });
            const yRev = yOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            yearlyComparison.push({
                year: y.toString(),
                revenue: yRev,
                orders: yOrders.length,
                profit: Math.round(yRev * 0.35),
            });
        }

        // 6. Category Revenue Distribution
        const categoryMap = {};
        nonCancelledOrders.forEach((order) => {
            if (Array.isArray(order.orderItems)) {
                order.orderItems.forEach((item) => {
                    const cat = item.category || 'General';
                    categoryMap[cat] = (categoryMap[cat] || 0) + (item.price * item.qty);
                });
            }
        });

        // 7. Top Selling Products
        const productSalesMap = {};
        nonCancelledOrders.forEach((order) => {
            if (Array.isArray(order.orderItems)) {
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
            }
        });

        const topProducts = Object.values(productSalesMap)
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 5);

        // 8. Recent Activities Feed (Merged Real-Time Stream)
        const recentOrders = await Order.find({})
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(6);

        const recentUsers = await User.find({ role: 'customer' })
            .select('name email createdAt')
            .sort({ createdAt: -1 })
            .limit(4);

        const activities = [];
        recentOrders.forEach((o) => {
            activities.push({
                id: `order-${o._id}`,
                type: 'order',
                title: `Order #${o._id.toString().slice(-6).toUpperCase()}`,
                desc: `${o.user?.name || 'Customer'} placed an order of ₹${(o.totalPrice || 0).toLocaleString('en-IN')}`,
                status: o.status,
                timestamp: o.createdAt,
            });
        });

        recentUsers.forEach((u) => {
            activities.push({
                id: `user-${u._id}`,
                type: 'user',
                title: 'New Customer Registered',
                desc: `${u.name} (${u.email}) joined DropCart`,
                timestamp: u.createdAt,
            });
        });

        lowStockProducts.slice(0, 4).forEach((p) => {
            activities.push({
                id: `stock-${p._id}`,
                type: 'stock',
                title: 'Low Stock Alert',
                desc: `${p.name} has only ${p.countInStock} items remaining`,
                severity: p.countInStock === 0 ? 'critical' : 'warning',
                timestamp: p.updatedAt || new Date(),
            });
        });

        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            range,
            filterStartDate,
            filterEndDate,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalProfit: Math.round(totalProfit * 100) / 100,
            averageOrderValue,
            conversionRate,
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
            revenueGrowthPercent,
            orderGrowthPercent,
            dailyComparison,
            weeklyComparison,
            monthlyComparison,
            yearlyComparison,
            weeklySales: dailyComparison.slice(-7), // Backward compatibility
            monthlySales: monthlyComparison.slice(-6), // Backward compatibility
            categorySales: categoryMap,
            topProducts,
            recentOrders,
            recentActivities: activities.slice(0, 10),
        });
    } catch (error) {
        console.error('Stats aggregation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Bulk Order Status Updates
const bulkUpdateOrderStatus = async (req, res) => {
    try {
        const { orderIds, status, isPaid } = req.body;
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ message: 'Order IDs array is required' });
        }

        let updatedCount = 0;
        const io = req.app.get('io');

        for (const id of orderIds) {
            const order = await Order.findById(id);
            if (order) {
                // If cancelling, restock items
                if (status === 'Cancelled' && order.status !== 'Cancelled') {
                    for (const item of order.orderItems) {
                        const prod = await Product.findById(item.product);
                        if (prod) {
                            prod.countInStock += item.qty;
                            prod.isOutOfStock = false;
                            await prod.save();
                        }
                    }
                }

                order.status = status || order.status;
                if (status === 'Delivered') {
                    order.deliveredAt = Date.now();
                    order.isPaid = true;
                    order.paidAt = order.paidAt || Date.now();
                }
                if (isPaid !== undefined) {
                    order.isPaid = Boolean(isPaid);
                    if (order.isPaid && !order.paidAt) order.paidAt = Date.now();
                }

                order.timeline = order.timeline || [];
                order.timeline.push({
                    status: order.status,
                    title: `Batch Status: ${order.status}`,
                    description: `Status updated via bulk batch processing.`,
                    timestamp: new Date(),
                    performedBy: req.user?.name || 'Administrator'
                });

                await order.save();
                updatedCount++;

                if (io) {
                    io.to(`user_${order.user}`).emit('orderStatusUpdated', {
                        orderId: order._id,
                        status: order.status,
                        isPaid: order.isPaid
                    });
                }
            }
        }

        if (io) {
            io.to('admin_channel').emit('ordersBulkUpdated', { updatedCount, status });
        }

        res.json({
            success: true,
            message: `Batch updated status to '${status}' for ${updatedCount} order(s).`,
            count: updatedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Bulk status update failed', error: error.message });
    }
};

// Update Delivery Tracking & Courier
const updateDeliveryTracking = async (req, res) => {
    try {
        const { courierPartner, trackingNumber, estimatedDeliveryDate, notes } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.courierPartner = courierPartner || order.courierPartner;
        order.trackingNumber = trackingNumber || order.trackingNumber;
        if (estimatedDeliveryDate) order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);

        order.timeline = order.timeline || [];
        order.timeline.push({
            status: order.status,
            title: `Dispatch Update: ${courierPartner || 'Courier'}`,
            description: `AWB / Tracking ID: ${trackingNumber}. ${notes || 'Handed over to carrier.'}`,
            timestamp: new Date(),
            performedBy: req.user?.name || 'Logistics Admin'
        });

        const updated = await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${order.user}`).emit('orderTrackingUpdated', {
                orderId: order._id,
                trackingNumber: order.trackingNumber,
                courierPartner: order.courierPartner,
                estimatedDeliveryDate: order.estimatedDeliveryDate
            });
        }

        res.json({
            success: true,
            message: 'Delivery tracking information saved successfully.',
            order: updated
        });
    } catch (error) {
        res.status(500).json({ message: 'Tracking update failed', error: error.message });
    }
};

// Handle Return Request (Customer / Admin)
const handleReturnRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = 'Return_Requested';
        order.returnRequest = {
            reason: reason || 'Item return requested',
            status: 'Requested',
            requestedAt: new Date(),
            refundAmount: order.totalPrice,
            adminNotes: ''
        };

        order.timeline = order.timeline || [];
        order.timeline.push({
            status: 'Return_Requested',
            title: 'Return Request Filed',
            description: `Customer submitted return request: "${reason}"`,
            timestamp: new Date(),
            performedBy: req.user?.name || 'Customer'
        });

        const updated = await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to('admin_channel').emit('returnRequestFiled', {
                orderId: order._id,
                customer: req.user?.name,
                reason
            });
        }

        res.json({
            success: true,
            message: 'Return request submitted successfully. Our team will review and approve refund.',
            order: updated
        });
    } catch (error) {
        res.status(500).json({ message: 'Return request failed', error: error.message });
    }
};

// Process Refund & Return Approval
const processRefund = async (req, res) => {
    try {
        const { action, refundAmount, adminNotes } = req.body; // action: 'approve' | 'reject'
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (action === 'approve') {
            // Restock items back into inventory
            for (const item of order.orderItems) {
                const prod = await Product.findById(item.product);
                if (prod) {
                    prod.countInStock += item.qty;
                    prod.isOutOfStock = false;
                    await prod.save();
                }
            }

            order.status = 'Refunded';
            order.returnRequest = {
                ...order.returnRequest,
                status: 'Completed',
                resolvedAt: new Date(),
                refundAmount: Number(refundAmount) || order.totalPrice,
                adminNotes: adminNotes || 'Refund approved and issued'
            };

            order.timeline = order.timeline || [];
            order.timeline.push({
                status: 'Refunded',
                title: 'Refund Approved & Dispatched',
                description: `Refund of ₹${order.returnRequest.refundAmount} approved. Stock restored.`,
                timestamp: new Date(),
                performedBy: req.user?.name || 'Administrator'
            });
        } else {
            order.returnRequest = {
                ...order.returnRequest,
                status: 'Rejected',
                resolvedAt: new Date(),
                adminNotes: adminNotes || 'Return request rejected'
            };

            order.timeline = order.timeline || [];
            order.timeline.push({
                status: order.status,
                title: 'Return Request Rejected',
                description: adminNotes || 'Return request did not meet return policy criteria.',
                timestamp: new Date(),
                performedBy: req.user?.name || 'Administrator'
            });
        }

        const updated = await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${order.user}`).emit('refundProcessed', {
                orderId: order._id,
                action,
                status: order.status
            });
        }

        res.json({
            success: true,
            message: action === 'approve' ? 'Refund approved and inventory restocked.' : 'Return request rejected.',
            order: updated
        });
    } catch (error) {
        res.status(500).json({ message: 'Refund processing failed', error: error.message });
    }
};

// Generate Tax Invoice Breakdown
const getOrderInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email phone');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const subtotal = order.orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const taxRate = 0.18; // 18% GST standard
        const taxAmount = Math.round(subtotal * taxRate);
        const discountAmount = Math.max(0, subtotal + taxAmount - order.totalPrice);

        const invoiceData = {
            invoiceNumber: order.invoice?.invoiceNumber || `INV-${new Date(order.createdAt).getFullYear()}-${order._id.toString().slice(-6)}`,
            invoiceDate: order.invoice?.invoiceDate || order.createdAt,
            orderId: order._id,
            orderDate: order.createdAt,
            customer: {
                name: order.user?.name || 'Customer',
                email: order.user?.email || 'N/A',
                phone: order.user?.phone || 'N/A',
            },
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.isPaid ? 'PAID' : 'PENDING',
            items: order.orderItems.map(item => ({
                name: item.name,
                qty: item.qty,
                unitPrice: item.price,
                total: item.price * item.qty
            })),
            subtotal,
            taxRate: '18% GST',
            taxAmount,
            discountAmount,
            totalPrice: order.totalPrice,
            company: {
                name: 'DropCart Enterprise Technologies Pvt. Ltd.',
                gstin: '07AAAAA0000A1Z5',
                address: 'Connaught Place, Central Delhi, New Delhi 110001, India',
                supportEmail: 'support@dropcart.in',
            }
        };

        res.json(invoiceData);
    } catch (error) {
        res.status(500).json({ message: 'Error generating invoice', error: error.message });
    }
};

// Generate Shipping Label
const getOrderShippingLabel = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email phone');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const labelData = {
            trackingNumber: order.trackingNumber || `DC-TRK-${order._id.toString().slice(-6)}`,
            orderId: order._id,
            courierPartner: order.courierPartner || 'BlueDart Express',
            shippingType: 'EXPRESS AIR CARGO',
            paymentMethod: order.paymentMethod,
            collectibleAmount: order.isPaid ? 0 : order.totalPrice,
            customer: {
                name: order.user?.name || 'Customer',
                phone: order.user?.phone || '9876543210',
            },
            shippingAddress: order.shippingAddress,
            itemCount: order.orderItems.reduce((acc, item) => acc + item.qty, 0),
            weightKg: order.shippingLabel?.weightKg || 0.85,
            dimensions: order.shippingLabel?.dimensions || '25x20x10 cm',
            dispatchedFrom: {
                name: 'DropCart Central Fulfillment Hub #4',
                city: 'Gurugram',
                pincode: '122002',
                country: 'India'
            }
        };

        res.json(labelData);
    } catch (error) {
        res.status(500).json({ message: 'Error generating shipping label', error: error.message });
    }
};

module.exports = {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getOrders,
    updateOrderStatus,
    getOrderStats,
    bulkUpdateOrderStatus,
    updateDeliveryTracking,
    handleReturnRequest,
    processRefund,
    getOrderInvoice,
    getOrderShippingLabel,
};
