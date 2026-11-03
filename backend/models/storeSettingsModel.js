const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema(
    {
        announcement: {
            type: String,
            default: '🔥 Special Launch Offer: Free Express Delivery on orders above ₹499! Use code: DROPCART',
        },
        bannerActive: {
            type: Boolean,
            default: true,
        },
        heroTitle: {
            type: String,
            default: 'Everything You Love. In One Place.',
        },
        heroSubtitle: {
            type: String,
            default: 'Discover high quality products at great prices. From everyday essentials to trending collections.',
        },
        heroBadge: {
            type: String,
            default: 'Exclusive New Arrivals 2026',
        },
        themeColor: {
            type: String,
            enum: ['orange', 'indigo', 'emerald', 'rose', 'blue'],
            default: 'orange',
        },
        featuredTag: {
            type: String,
            default: 'Trending Now',
        },
    },
    { timestamps: true }
);

const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);
module.exports = StoreSettings;
