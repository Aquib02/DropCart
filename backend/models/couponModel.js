const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Coupon code is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage',
        },
        discountAmount: {
            type: Number,
            required: [true, 'Discount amount is required'],
            min: 1,
        },
        minPurchase: {
            type: Number,
            default: 0,
        },
        maxDiscount: {
            type: Number,
            default: null, // e.g. Max ₹1,000 off on percentage coupons
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        usageLimit: {
            type: Number,
            default: 500,
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

couponSchema.index({ isActive: 1, expiryDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
