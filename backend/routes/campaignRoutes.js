const express = require('express');
const router = express.Router();
const {
    getActiveCampaigns,
    getAllCampaignsAdmin,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    reorderCampaigns,
    toggleCampaignStatus,
    recordImpression,
    recordClick,
} = require('../controllers/campaignController');

const { protect, hasPermission } = require('../middleware/authMiddleware');

// Public storefront routes
router.get('/', getActiveCampaigns);
router.post('/:id/impression', recordImpression);
router.post('/:id/click', recordClick);

// Protected Admin / Staff routes
router.get('/admin', protect, hasPermission('manage_appearance'), getAllCampaignsAdmin);
router.post('/', protect, hasPermission('manage_appearance'), createCampaign);
router.patch('/reorder', protect, hasPermission('manage_appearance'), reorderCampaigns);
router.put('/:id', protect, hasPermission('manage_appearance'), updateCampaign);
router.patch('/:id/toggle', protect, hasPermission('manage_appearance'), toggleCampaignStatus);
router.delete('/:id', protect, hasPermission('manage_appearance'), deleteCampaign);

module.exports = router;