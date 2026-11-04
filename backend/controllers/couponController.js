const Coupon = require('../models/couponModel');
const Order = require('../models/orderModel');

// 1. POST /api/coupons/apply
// Backend secure calculation supporting percentage, fixed, bogo, first_order, category_specific, and flash_sale
const applyCoupon = async (req, res) => {
    try {
        const { code, cartTotal, cartItems = [], userEmail } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ message: 'Please provide a valid coupon code.' });
        }

        const normalizedCode = code.trim().toUpperCase();
        const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or inactive promotional coupon code.' });
        }

        // Expiry check
        if (new Date() > new Date(coupon.expiryDate)) {
            return res.status(400).json({ message: 'This coupon promotion has expired.' });
        }

        // Usage limit check
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'This promotional coupon has reached its maximum redemption limit.' });
        }

        // Customer-specific check
        if (coupon.applicableUserEmail && coupon.applicableUserEmail.trim() !== '') {
            const emailToCheck = (userEmail || req.user?.email || '').toLowerCase().trim();
            if (emailToCheck !== coupon.applicableUserEmail.toLowerCase().trim()) {
                return res.status(403).json({
                    message: `This coupon is exclusively assigned to another customer account.`
                });
            }
        }

        // First-order coupon check
        if (coupon.discountType === 'first_order') {
            if (req.user) {
                const pastOrders = await Order.countDocuments({ user: req.user._id, isPaid: true });
                if (pastOrders > 0) {
                    return res.status(400).json({
                        message: 'This coupon is exclusively valid for first-time shoppers.'
                    });
                }
            }
        }

        const total = Number(cartTotal) || 0;

        // Minimum purchase threshold check
        if (coupon.minPurchase > 0 && total < coupon.minPurchase) {
            return res.status(400).json({
                message: `Minimum order cart value of ₹${coupon.minPurchase.toLocaleString('en-IN')} required for coupon ${coupon.code}.`,
            });
        }

        let discount = 0;

        // Discount Type Calculations
        if (coupon.discountType === 'percentage' || coupon.discountType === 'first_order' || coupon.discountType === 'flash_sale') {
            discount = Math.round((total * coupon.discountAmount) / 100);
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else if (coupon.discountType === 'fixed') {
            discount = Math.min(coupon.discountAmount, total);
        } else if (coupon.discountType === 'category_specific') {
            // Find total price of items belonging to the target category
            const targetCat = (coupon.applicableCategory || '').toLowerCase();
            const eligibleTotal = cartItems
                .filter(item => (item.category || '').toLowerCase() === targetCat)
                .reduce((acc, item) => acc + (Number(item.price) * (Number(item.qty) || 1)), 0);

            if (eligibleTotal === 0) {
                return res.status(400).json({
                    message: `This coupon is only applicable to products in the "${coupon.applicableCategory}" category.`
                });
            }
            discount = Math.round((eligibleTotal * coupon.discountAmount) / 100);
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else if (coupon.discountType === 'bogo') {
            // Buy One Get One: discount cheapest item price
            if (cartItems.length < 2) {
                return res.status(400).json({
                    message: 'Buy One Get One (BOGO) offer requires at least 2 items in your cart.'
                });
            }
            const itemPrices = cartItems.map(i => Number(i.price) || 0).sort((a, b) => a - b);
            discount = itemPrices[0] || 0;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        }

        const finalTotal = Math.max(0, total - discount);

        res.json({
            success: true,
            message: `Coupon '${coupon.code}' applied successfully! Saved ₹${discount.toLocaleString('en-IN')}`,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountAmount: coupon.discountAmount,
                applicableCategory: coupon.applicableCategory,
                discount,
                finalTotal,
            },
        });
    } catch (error) {
        console.error('Error in applyCoupon:', error);
        res.status(500).json({ message: error.message });
    }
};

// 2. GET /api/coupons/active
const getActiveCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gt: new Date() },
            $or: [
                { applicableUserEmail: { $exists: false } },
                { applicableUserEmail: '' }
            ]
        })
            .select('code description discountType discountAmount minPurchase maxDiscount expiryDate isFlashSale')
            .sort({ discountAmount: -1 });

        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. GET /api/coupons (Admin list with metrics)
const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. POST /api/coupons (Admin create)
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountAmount,
            applicableCategory,
            applicableUserEmail,
            minPurchase,
            maxDiscount,
            expiryDate,
            usageLimit,
            isFlashSale
        } = req.body;

        const exists = await Coupon.findOne({ code: code.trim().toUpperCase() });
        if (exists) {
            return res.status(400).json({ message: 'A promotional coupon with this code already exists.' });
        }

        const coupon = await Coupon.create({
            code: code.trim().toUpperCase(),
            description: description || '',
            discountType: discountType || 'percentage',
            discountAmount: Number(discountAmount),
            applicableCategory: applicableCategory || 'All',
            applicableUserEmail: applicableUserEmail ? applicableUserEmail.trim().toLowerCase() : '',
            minPurchase: Number(minPurchase) || 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : null,
            expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 86400000),
            usageLimit: usageLimit ? Number(usageLimit) : 500,
            isFlashSale: Boolean(isFlashSale),
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. PATCH /api/coupons/:id/toggle
const toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.json({
            success: true,
            message: `Coupon '${coupon.code}' is now ${coupon.isActive ? 'Active' : 'Paused'}.`,
            coupon
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. DELETE /api/coupons/:id
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }
        await coupon.deleteOne();
        res.json({ message: 'Coupon removed successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    applyCoupon,
    getActiveCoupons,
    getAllCoupons,
    createCoupon,
    toggleCouponStatus,
    deleteCoupon,
};
