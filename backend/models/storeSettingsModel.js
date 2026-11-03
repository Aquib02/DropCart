const mongoose = require('mongoose');

const bannerSlideSchema = new mongoose.Schema({
    badge: { type: String, default: 'Festive Mega Sale' },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    priceText: { type: String, default: '' },
    bankOffer: { type: String, default: '10% Instant Discount on All Major Bank Cards' },
    image: { type: String, required: true },
    bgGradient: { type: String, default: 'from-amber-600 via-orange-600 to-red-600' },
    link: { type: String, default: '/shop' },
});

const storeSettingsSchema = new mongoose.Schema(
    {
        announcement: {
            type: String,
            default: '🔥 BIG BANG SALE LIVE: Up to 70% Off + Extra 10% Bank Discount on Credit/Debit Cards!',
        },
        bannerActive: {
            type: Boolean,
            default: true,
        },
        heroTitle: {
            type: String,
            default: 'India’s Favorite Online Shopping Destination',
        },
        heroSubtitle: {
            type: String,
            default: 'Mobiles, Fashion, Electronics, Home Appliances, and Lifestyle at Unmatched Deals.',
        },
        heroBadge: {
            type: String,
            default: 'Mega Festive Deals 2026',
        },
        themeColor: {
            type: String,
            default: 'orange',
        },
        banners: [bannerSlideSchema],
    },
    { timestamps: true }
);

const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);
module.exports = StoreSettings;
