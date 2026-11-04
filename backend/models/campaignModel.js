const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        subtitle: {
            type: String,
            default: '',
            trim: true,
        },
        badge: {
            type: String,
            default: 'SPECIAL OFFER',
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                'hero_slider',
                'secondary_banner',
                'category_banner',
                'product_banner',
                'popup',
                'announcement_bar',
            ],
            default: 'hero_slider',
        },
        desktopImage: {
            type: String,
            required: true,
            trim: true,
        },
        mobileImage: {
            type: String,
            default: '',
            trim: true,
        },
        priceText: {
            type: String,
            default: '',
            trim: true,
        },
        offerText: {
            type: String,
            default: '',
            trim: true,
        },
        ctaText: {
            type: String,
            default: 'Shop Now',
            trim: true,
        },
        ctaLink: {
            type: String,
            default: '/shop',
            trim: true,
        },
        bgGradient: {
            type: String,
            default: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e293b 100%)',
        },
        category: {
            type: String,
            default: '',
            trim: true,
        },
        position: {
            type: String,
            default: 'homepage_hero',
        },
        order: {
            type: Number,
            default: 0,
        },
        targetAudience: {
            type: String,
            enum: ['all', 'new_customers', 'returning_customers', 'vip'],
            default: 'all',
        },
        targetDevice: {
            type: String,
            enum: ['all', 'desktop', 'mobile'],
            default: 'all',
        },
        priority: {
            type: Number,
            default: 5,
            min: 1,
            max: 10,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
        // Campaign Performance Analytics
        analytics: {
            impressions: { type: Number, default: 0 },
            clicks: { type: Number, default: 0 },
        },
        // A/B Testing Configuration
        abTest: {
            isEnabled: { type: Boolean, default: false },
            variantB: {
                title: { type: String, default: '' },
                desktopImage: { type: String, default: '' },
                ctaText: { type: String, default: '' },
                ctaLink: { type: String, default: '' },
                impressions: { type: Number, default: 0 },
                clicks: { type: Number, default: 0 },
            },
        },
        // Popup & Announcement Settings
        popupConfig: {
            frequency: {
                type: String,
                enum: ['once_per_session', 'always', 'once_per_day'],
                default: 'once_per_session',
            },
            delaySeconds: {
                type: Number,
                default: 2,
            },
        },
    },
    { timestamps: true }
);

// High-performance query indexes
campaignSchema.index({ type: 1, isActive: 1, order: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);
module.exports = Campaign;