const Coupon = require('../models/couponModel');

// @desc    Validate and apply a coupon to the current cart
// @route   POST /api/coupons/apply
// @access  Public
const applyCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ message: 'Please provide a valid coupon code.' });
        }

        const normalizedCode = code.trim().toUpperCase();
        const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or inactive coupon code.' });
        }

        // Check expiry date
        if (new Date() > new Date(coupon.expiryDate)) {
            return res.status(400).json({ message: 'This coupon code has expired.' });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'This coupon has reached its maximum usage limit.' });
        }

        const total = Number(cartTotal) || 0;

        // Check minimum purchase
        if (coupon.minPurchase > 0 && total < coupon.minPurchase) {
            return res.status(400).json({
                message: `Minimum order amount of ₹${coupon.minPurchase.toLocaleString('en-IN')} required for this coupon.`,
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = Math.round((total * coupon.discountAmount) / 100);
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            // Fixed discount
            discount = Math.min(coupon.discountAmount, total);
        }

        const finalTotal = Math.max(0, total - discount);

        res.json({
            success: true,
            message: `Coupon '${coupon.code}' applied successfully! Saved ₹${discount.toLocaleString('en-IN')}`,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountAmount: coupon.discountAmount,
                discount,
                finalTotal,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all active public coupons for customer promos
// @route   GET /api/coupons/active
// @access  Public
const getActiveCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gt: new Date() },
        })
            .select('code description discountType discountAmount minPurchase maxDiscount expiryDate')
            .sort({ discountAmount: -1 });

        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountAmount,
            minPurchase,
            maxDiscount,
            expiryDate,
            usageLimit,
        } = req.body;

        const exists = await Coupon.findOne({ code: code.trim().toUpperCase() });
        if (exists) {
            return res.status(400).json({ message: 'A coupon with this code already exists.' });
        }

        const coupon = await Coupon.create({
            code: code.trim().toUpperCase(),
            description: description || '',
            discountType: discountType || 'percentage',
            discountAmount: Number(discountAmount),
            minPurchase: Number(minPurchase) || 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : null,
            expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 86400000),
            usageLimit: usageLimit ? Number(usageLimit) : 500,
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete or deactivate coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
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
    deleteCoupon,
};
