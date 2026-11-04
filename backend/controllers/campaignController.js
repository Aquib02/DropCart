const Campaign = require('../models/campaignModel');

// Seed default starter banners if catalog is completely clean
const seedDefaultCampaigns = async () => {
    const count = await Campaign.countDocuments({});
    if (count > 0) return;

    const defaults = [
        {
            title: 'Core Ultra AI Performance Laptops',
            subtitle: 'Intel Core Ultra 7 • 16GB LPDDR5X • 1TB PCIe Gen4 SSD',
            badge: 'NEW GENERATION',
            type: 'hero_slider',
            desktopImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80',
            mobileImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
            priceText: 'From ₹54,999',
            offerText: 'Instant ₹4,000 Bank Rebate + Free Next-Day Delivery',
            ctaText: 'Shop Laptops',
            ctaLink: '/shop?category=Electronics',
            bgGradient: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e293b 100%)',
            order: 0,
            priority: 9,
            isActive: true,
            analytics: { impressions: 120, clicks: 18 },
        },
        {
            title: 'Samsung Galaxy S24 Series 5G',
            subtitle: 'Galaxy AI Features • 50MP Pro-Grade OIS • 120Hz Dynamic AMOLED',
            badge: 'FLAGSHIP LAUNCH',
            type: 'hero_slider',
            desktopImage: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200&q=80',
            mobileImage: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
            priceText: 'Starting at ₹49,999',
            offerText: 'Up to ₹8,000 Exchange Bonus on Your Old Phone',
            ctaText: 'Explore Galaxy',
            ctaLink: '/shop?category=Mobiles',
            bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
            order: 1,
            priority: 8,
            isActive: true,
            analytics: { impressions: 95, clicks: 14 },
        },
        {
            title: 'Premium Winter & Streetwear Trends',
            subtitle: 'Monte Carlo, Puma, Bomber Jackets & Artisan Leather Accessories',
            badge: 'SEASON SPECIAL',
            type: 'hero_slider',
            desktopImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=80',
            mobileImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
            priceText: 'Flat 50% Off',
            offerText: 'Extra 10% Off with Code WELCOME100 at Checkout',
            ctaText: 'Shop Fashion',
            ctaLink: '/shop?category=Fashion',
            bgGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)',
            order: 2,
            priority: 7,
            isActive: true,
            analytics: { impressions: 80, clicks: 9 },
        },
        {
            title: 'Exclusive Member Welcome Offer',
            subtitle: 'Get Flat ₹500 Off On Your First Order Above ₹1,999',
            badge: 'LIMITED TIME POPUP',
            type: 'popup',
            desktopImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
            priceText: 'Save ₹500',
            offerText: 'Use Code FIRST500 at checkout',
            ctaText: 'Claim Discount',
            ctaLink: '/shop',
            order: 0,
            priority: 10,
            isActive: true,
            popupConfig: { frequency: 'once_per_session', delaySeconds: 2 },
            analytics: { impressions: 64, clicks: 11 },
        },
    ];

    await Campaign.insertMany(defaults);
};

// @desc    Get Active Campaigns (Public / Storefront)
// @route   GET /api/campaigns
// @access  Public
const getActiveCampaigns = async (req, res) => {
    try {
        await seedDefaultCampaigns();

        const { type, category, device } = req.query;
        const now = new Date();

        const query = {
            isActive: true,
            $and: [
                {
                    $or: [{ startDate: null }, { startDate: { $lte: now } }],
                },
                {
                    $or: [{ endDate: null }, { endDate: { $gte: now } }],
                },
            ],
        };

        if (type) query.type = type;
        if (category) query.category = category;
        if (device && device !== 'all') {
            query.targetDevice = { $in: ['all', device] };
        }

        const campaigns = await Campaign.find(query).sort({ order: 1, priority: -1, createdAt: -1 });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Campaigns (Admin / Staff)
// @route   GET /api/campaigns/admin
// @access  Private / Admin or Staff with manage_appearance
const getAllCampaignsAdmin = async (req, res) => {
    try {
        await seedDefaultCampaigns();
        const campaigns = await Campaign.find({}).sort({ type: 1, order: 1, createdAt: -1 });

        // Calculate CTR for each campaign
        const enriched = campaigns.map((c) => {
            const impressions = c.analytics?.impressions || 0;
            const clicks = c.analytics?.clicks || 0;
            const ctr = impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0;

            let variantBCtr = 0;
            if (c.abTest?.isEnabled) {
                const bImp = c.abTest?.variantB?.impressions || 0;
                const bClick = c.abTest?.variantB?.clicks || 0;
                variantBCtr = bImp > 0 ? Math.round((bClick / bImp) * 1000) / 10 : 0;
            }

            return {
                ...c.toObject(),
                ctr,
                variantBCtr,
            };
        });

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Advertisement / Campaign
// @route   POST /api/campaigns
// @access  Private / Admin
const createCampaign = async (req, res) => {
    try {
        const body = req.body;

        // Auto determine next order if not set
        if (body.order === undefined || body.order === null) {
            const highestOrder = await Campaign.findOne({ type: body.type || 'hero_slider' })
                .sort({ order: -1 })
                .select('order');
            body.order = highestOrder ? (highestOrder.order || 0) + 1 : 0;
        }

        const campaign = new Campaign(body);
        const created = await campaign.save();

        // Real-time broadcast
        const io = req.app.get('io');
        if (io) io.emit('campaignsUpdated', { action: 'create', campaign: created });

        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update Advertisement / Campaign
// @route   PUT /api/campaigns/:id
// @access  Private / Admin
const updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        Object.assign(campaign, req.body);
        const updated = await campaign.save();

        const io = req.app.get('io');
        if (io) io.emit('campaignsUpdated', { action: 'update', campaign: updated });

        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete Advertisement / Campaign
// @route   DELETE /api/campaigns/:id
// @access  Private / Admin
const deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        await campaign.deleteOne();

        const io = req.app.get('io');
        if (io) io.emit('campaignsUpdated', { action: 'delete', id: req.params.id });

        res.json({ message: 'Campaign deleted successfully', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Drag-and-Drop Batch Reorder Banners
// @route   PATCH /api/campaigns/reorder
// @access  Private / Admin
const reorderCampaigns = async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, order }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Invalid reorder items array' });
        }

        const bulkOps = items.map((item) => ({
            updateOne: {
                filter: { _id: item.id },
                update: { $set: { order: item.order } },
            },
        }));

        await Campaign.bulkWrite(bulkOps);

        // Fetch refreshed ordering to return
        const updated = await Campaign.find({ _id: { $in: items.map((i) => i.id) } }).sort({ order: 1 });

        const io = req.app.get('io');
        if (io) io.emit('campaignsUpdated', { action: 'reorder', items });

        res.json({ message: 'Banner order saved successfully in MongoDB', items: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle Campaign Active Status
// @route   PATCH /api/campaigns/:id/toggle
// @access  Private / Admin
const toggleCampaignStatus = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        campaign.isActive = !campaign.isActive;
        const updated = await campaign.save();

        const io = req.app.get('io');
        if (io) io.emit('campaignsUpdated', { action: 'toggle', campaign: updated });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record Campaign Impression
// @route   POST /api/campaigns/:id/impression
// @access  Public
const recordImpression = async (req, res) => {
    try {
        const { variant = 'A' } = req.body;
        const updateField = variant === 'B' ? 'abTest.variantB.impressions' : 'analytics.impressions';

        await Campaign.findByIdAndUpdate(req.params.id, { $inc: { [updateField]: 1 } });
        res.json({ success: true });
    } catch {
        res.status(200).json({ success: false });
    }
};

// @desc    Record Campaign Click
// @route   POST /api/campaigns/:id/click
// @access  Public
const recordClick = async (req, res) => {
    try {
        const { variant = 'A' } = req.body;
        const updateField = variant === 'B' ? 'abTest.variantB.clicks' : 'analytics.clicks';

        await Campaign.findByIdAndUpdate(req.params.id, { $inc: { [updateField]: 1 } });
        res.json({ success: true });
    } catch {
        res.status(200).json({ success: false });
    }
};

module.exports = {
    getActiveCampaigns,
    getAllCampaignsAdmin,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    reorderCampaigns,
    toggleCampaignStatus,
    recordImpression,
    recordClick,
};