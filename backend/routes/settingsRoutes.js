const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

// Allow full Admin or Staff with access to the Admin Dashboard
const allowAdminOrStaff = (req, res, next) => {
    if (req.user && (req.user.isAdmin || req.user.role === 'admin' || req.user.role === 'staff')) {
        return next();
    }
    return res.status(403).json({ message: 'Access denied: Admin or Staff privileges required' });
};

router
    .route('/')
    .get(getSettings)
    .put(protect, allowAdminOrStaff, updateSettings);

module.exports = router;
