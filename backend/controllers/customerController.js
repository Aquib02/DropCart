const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');

// 1. GET /api/customers
// Advanced Customer Directory with aggregate spend, orders, segmentation, and filters
exports.getCustomerDirectory = async (req, res) => {
    try {
        const { search, segment, status, page = 1, limit = 25 } = req.query;

        let userFilter = { role: { $in: ['customer', 'user'] } };

        if (search) {
            userFilter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        if (status === 'blocked') {
            userFilter.isBlocked = true;
        } else if (status === 'active') {
            userFilter.isBlocked = false;
        }

        const users = await User.find(userFilter)
            .select('name email phone city deliveryCity postalCode coins isBlocked blockReason customerDiscounts wishlist createdAt')
            .lean();

        // Fetch order stats for each customer
        const userIds = users.map(u => u._id);
        const orderAggregates = await Order.aggregate([
            { $match: { user: { $in: userIds }, isPaid: true } },
            {
                $group: {
                    _id: '$user',
                    ordersCount: { $sum: 1 },
                    totalSpent: { $sum: '$totalPrice' },
                    lastOrderDate: { $max: '$createdAt' }
                }
            }
        ]);

        const orderStatsMap = new Map();
        orderAggregates.forEach(o => {
            orderStatsMap.set(o._id.toString(), o);
        });

        const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

        let totalLtv = 0;
        let vipCount = 0;
        let newCount = 0;
        let blockedCount = 0;

        const enrichedUsers = users.map(u => {
            const stats = orderStatsMap.get(u._id.toString()) || { ordersCount: 0, totalSpent: 0, lastOrderDate: null };
            const ordersCount = stats.ordersCount || 0;
            const totalSpent = Math.round(stats.totalSpent || 0);
            totalLtv += totalSpent;

            if (u.isBlocked) blockedCount++;

            // Dynamic Segmentation
            let computedSegment = 'New';
            if (totalSpent >= 25000 || ordersCount >= 4) {
                computedSegment = 'VIP';
                vipCount++;
            } else if (stats.lastOrderDate && new Date(stats.lastOrderDate) < sixtyDaysAgo) {
                computedSegment = 'At Risk';
            } else if (ordersCount >= 2) {
                computedSegment = 'Regular';
            } else {
                computedSegment = 'New';
                if (new Date(u.createdAt) >= thirtyDaysAgo) newCount++;
            }

            return {
                ...u,
                ordersCount,
                totalSpent,
                aov: ordersCount > 0 ? Math.round(totalSpent / ordersCount) : 0,
                lastOrderDate: stats.lastOrderDate,
                segment: computedSegment,
                wishlistCount: Array.isArray(u.wishlist) ? u.wishlist.length : 0
            };
        });

        // Apply segment filter if provided
        let filtered = enrichedUsers;
        if (segment && segment !== 'All') {
            filtered = enrichedUsers.filter(u => u.segment.toLowerCase() === segment.toLowerCase());
        }

        const skip = (Number(page) - 1) * Number(limit);
        const paginated = filtered.slice(skip, skip + Number(limit));

        res.json({
            success: true,
            kpis: {
                totalCustomers: users.length,
                totalLtv,
                vipCount,
                newCount,
                blockedCount,
                repeatPurchaseRate: users.length > 0 ? Math.round((enrichedUsers.filter(u => u.ordersCount > 1).length / users.length) * 100) : 0
            },
            customers: paginated,
            total: filtered.length,
            page: Number(page),
            pages: Math.ceil(filtered.length / Number(limit))
        });
    } catch (error) {
        console.error('Error in getCustomerDirectory:', error);
        res.status(500).json({ message: 'Error fetching customer directory', error: error.message });
    }
};

// 2. GET /api/customers/:id
// Detailed customer profile with order history and wishlisted items
exports.getCustomerDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('wishlist', 'name price image category countInStock')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const orders = await Order.find({ user: user._id })
            .sort({ createdAt: -1 })
            .lean();

        // Customer exclusive coupons
        const exclusiveCoupons = await Coupon.find({
            applicableUserEmail: user.email.toLowerCase(),
            isActive: true
        }).lean();

        const totalSpent = orders.filter(o => o.isPaid).reduce((acc, o) => acc + (o.totalPrice || 0), 0);

        res.json({
            success: true,
            customer: {
                ...user,
                totalSpent: Math.round(totalSpent),
                ordersCount: orders.length,
            },
            orders,
            exclusiveCoupons
        });
    } catch (error) {
        console.error('Error in getCustomerDetails:', error);
        res.status(500).json({ message: 'Error fetching customer details', error: error.message });
    }
};

// 3. PATCH /api/customers/:id/block
// Block or unblock customer account
exports.toggleBlockCustomer = async (req, res) => {
    try {
        const { isBlocked, blockReason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        user.isBlocked = isBlocked !== undefined ? isBlocked : !user.isBlocked;
        if (blockReason !== undefined) user.blockReason = blockReason;
        await user.save();

        res.json({
            success: true,
            message: `Customer ${user.name} is now ${user.isBlocked ? 'Blocked' : 'Unblocked'}.`,
            customer: user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating customer block status', error: error.message });
    }
};

// 4. POST /api/customers/:id/coins
// Adjust SuperCoins balance
exports.adjustLoyaltyCoins = async (req, res) => {
    try {
        const { coinsDelta, reason } = req.body;
        const delta = Number(coinsDelta);
        if (isNaN(delta)) {
            return res.status(400).json({ message: 'Valid coins delta is required' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        user.coins = Math.max(0, (user.coins || 0) + delta);
        await user.save();

        res.json({
            success: true,
            message: `Adjusted ${delta > 0 ? `+${delta}` : delta} SuperCoins for ${user.name}. New Balance: ${user.coins}`,
            newBalance: user.coins
        });
    } catch (error) {
        res.status(500).json({ message: 'Error adjusting coins', error: error.message });
    }
};

// 5. POST /api/customers/:id/discount
// Generate & assign exclusive discount voucher for specific customer
exports.assignExclusiveDiscount = async (req, res) => {
    try {
        const { discountAmount, discountType = 'percentage', minPurchase = 0, expiryDays = 14 } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const code = `VIP-${user.name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const coupon = await Coupon.create({
            code,
            description: `Exclusive discount granted for ${user.name}`,
            discountType,
            discountAmount: Number(discountAmount),
            applicableUserEmail: user.email.toLowerCase(),
            minPurchase: Number(minPurchase),
            expiryDate: new Date(Date.now() + Number(expiryDays) * 86400000),
            usageLimit: 1,
            isActive: true
        });

        user.customerDiscounts = user.customerDiscounts || [];
        user.customerDiscounts.push(code);
        await user.save();

        res.status(201).json({
            success: true,
            message: `Exclusive voucher "${code}" generated and assigned to ${user.email}.`,
            coupon
        });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning exclusive discount', error: error.message });
    }
};
