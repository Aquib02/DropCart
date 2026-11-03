const StoreSettings = require('../models/storeSettingsModel');

// @desc    Get store appearance settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
    try {
        let settings = await StoreSettings.findOne().sort({ updatedAt: -1 });
        if (!settings) {
            settings = await StoreSettings.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update store appearance settings
// @route   PUT /api/settings
// @access  Private / Admin or Staff
const updateSettings = async (req, res) => {
    try {
        const {
            announcement,
            bannerActive,
            heroTitle,
            heroSubtitle,
            heroBadge,
            themeColor,
            featuredTag,
        } = req.body;

        let settings = await StoreSettings.findOne().sort({ updatedAt: -1 });
        if (!settings) {
            settings = new StoreSettings();
        }

        if (announcement !== undefined) settings.announcement = announcement;
        if (bannerActive !== undefined) settings.bannerActive = bannerActive;
        if (heroTitle !== undefined) settings.heroTitle = heroTitle;
        if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle;
        if (heroBadge !== undefined) settings.heroBadge = heroBadge;
        if (themeColor !== undefined) settings.themeColor = themeColor;
        if (featuredTag !== undefined) settings.featuredTag = featuredTag;

        const updated = await settings.save();

        // Real-Time Notification: Emit appearance & theme changes to all storefront clients
        const io = req.app.get('io');
        if (io) {
            io.emit('settingsUpdated', updated);
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSettings, updateSettings };
