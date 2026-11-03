const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router
    .route('/')
    .get(getSettings)
    .put(protect, hasPermission('manage_appearance'), updateSettings);

module.exports = router;
