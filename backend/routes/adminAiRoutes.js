const express = require('express');
const router = express.Router();
const {
    askAdminAssistant,
    generateProductCopy,
    generateCampaignBannerCopy,
    predictInventoryDemand,
    detectSuspiciousOrders,
    suggestProductPromotions
} = require('../controllers/adminAiController');
const { protect, admin } = require('../middleware/authMiddleware');

// All Admin AI endpoints require authenticated Administrator privileges
router.use(protect);
router.use(admin);

// 1. Natural Language Executive Assistant
router.post('/ask', askAdminAssistant);

// 2. Product Copy & SEO Generator Studio
router.post('/product-copy', generateProductCopy);

// 3. Campaign Banner & Promotional Headlines
router.post('/campaign-copy', generateCampaignBannerCopy);

// 4. Predictive Inventory Demand & Stockout Forecaster
router.get('/demand-forecast', predictInventoryDemand);

// 5. Fraud Sentinel & Suspicious Orders
router.get('/suspicious-orders', detectSuspiciousOrders);

// 6. Smart Product Promotion Suggestions
router.get('/promotions-suggest', suggestProductPromotions);

module.exports = router;
