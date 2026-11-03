const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        targetPrice: {
            type: Number,
            required: true,
        },
        currentPriceAtCreation: {
            type: Number,
            required: true,
        },
        isTriggered: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

priceAlertSchema.index({ product: 1, email: 1 });

const PriceAlert = mongoose.model('PriceAlert', priceAlertSchema);
module.exports = PriceAlert;
