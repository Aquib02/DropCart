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
        // Store Identity & Branding
        storeName: { type: String, default: 'DropCart' },
        tagline: { type: String, default: 'India’s Favorite Online Shopping Destination' },
        logoUrl: { type: String, default: '' },
        faviconUrl: { type: String, default: '' },
        themeColor: { type: String, default: 'orange' },

        // Announcement Bar & Hero
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
        banners: [bannerSlideSchema],

        // SEO Configuration
        seo: {
            metaTitle: { type: String, default: 'DropCart - Online Shopping for Electronics, Fashion, Mobiles & More' },
            metaDescription: { type: String, default: 'Shop genuine electronics, mobile phones, fashion, and appliances at India’s premier e-commerce store with express shipping and secure payments.' },
            ogImage: { type: String, default: '' },
            googleAnalyticsId: { type: String, default: 'G-DROPCART2026' }
        },

        // Shipping & Logistics Rules
        shipping: {
            standardShippingFee: { type: Number, default: 49 },
            freeShippingThreshold: { type: Number, default: 499 },
            expressShippingFee: { type: Number, default: 99 },
            estimatedStandardDays: { type: String, default: '2 - 4 Business Days' },
            estimatedExpressDays: { type: String, default: '24 - 48 Hours Express' }
        },

        // Tax & Invoicing (GST)
        tax: {
            taxRatePercent: { type: Number, default: 18 },
            pricesIncludeTax: { type: Boolean, default: true },
            gstinNumber: { type: String, default: '29AABCT1332L1ZV' },
            legalBusinessName: { type: String, default: 'DropCart Retail Technologies Pvt Ltd' }
        },

        // Payment Gateways
        paymentMethods: {
            razorpayEnabled: { type: Boolean, default: true },
            codEnabled: { type: Boolean, default: true },
            upiEnabled: { type: Boolean, default: true },
            stripeEnabled: { type: Boolean, default: false },
            codFee: { type: Number, default: 0 }
        },

        // Contact & Support Information
        contact: {
            supportEmail: { type: String, default: 'support@dropcart.in' },
            supportPhone: { type: String, default: '+91 1800-202-9898' },
            whatsappNumber: { type: String, default: '+91 98765 43210' },
            physicalAddress: { type: String, default: 'DropCart Towers, 4th Block, Koramangala, Bangalore - 560034, India' }
        },

        // Social Media Handles
        socialLinks: {
            instagram: { type: String, default: 'https://instagram.com/dropcart' },
            facebook: { type: String, default: 'https://facebook.com/dropcart' },
            twitter: { type: String, default: 'https://x.com/dropcart' },
            youtube: { type: String, default: 'https://youtube.com/dropcart' },
            linkedin: { type: String, default: 'https://linkedin.com/company/dropcart' }
        },

        // Maintenance Mode Toggle
        maintenanceMode: {
            enabled: { type: Boolean, default: false },
            message: { type: String, default: 'We are performing scheduled improvements to bring you a faster shopping experience. DropCart will return shortly!' },
            allowedAdminIps: { type: [String], default: [] }
        }
    },
    { timestamps: true }
);

const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);
module.exports = StoreSettings;
