const StoreSettings = require('../models/storeSettingsModel');

// @desc    Get store configuration and appearance settings
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

// @desc    Update store configuration and appearance settings
// @route   PUT /api/settings
// @access  Private / Admin or Staff with manage_appearance / manage_settings
const updateSettings = async (req, res) => {
    try {
        let settings = await StoreSettings.findOne().sort({ updatedAt: -1 });
        if (!settings) {
            settings = new StoreSettings();
        }

        const fields = [
            'storeName',
            'tagline',
            'logoUrl',
            'faviconUrl',
            'themeColor',
            'announcement',
            'bannerActive',
            'heroTitle',
            'heroSubtitle',
            'heroBadge',
            'banners',
            'seo',
            'shipping',
            'tax',
            'paymentMethods',
            'contact',
            'socialLinks',
            'maintenanceMode'
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
                    settings[field] = {
                        ...(settings[field]?.toObject ? settings[field].toObject() : settings[field]),
                        ...req.body[field]
                    };
                } else {
                    settings[field] = req.body[field];
                }
            }
        });

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
