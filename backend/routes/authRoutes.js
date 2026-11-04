const express = require('express');
const router = express.Router();
const {
    registerUser,
    authUser,
    getUserProfile,
    updateUserProfile,
    toggleWishlist,
    getAllStaff,
    createStaffUser,
    updateStaffPermissions,
    deleteStaffUser,
    getAuditLogs,
    toggleTwoFactor,
    getAllUsers,
} = require('../controllers/authController');

const { protect, admin, hasPermission } = require('../middleware/authMiddleware');

// Public Auth routes
router.post('/register', registerUser);
router.post('/login', authUser);

// Private User & Profile routes
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

// Wishlist toggle route
router.post('/wishlist/:productId', protect, toggleWishlist);

// Admin & Staff Management (RBAC) routes
router
    .route('/staff')
    .get(protect, hasPermission('manage_staff'), getAllStaff)
    .post(protect, admin, createStaffUser);

router
    .route('/staff/:id')
    .put(protect, admin, updateStaffPermissions)
    .delete(protect, admin, deleteStaffUser);

// Audit Logs & Security 2FA
router.get('/audit-logs', protect, admin, getAuditLogs);
router.post('/toggle-2fa', protect, toggleTwoFactor);

router.get('/', protect, admin, getAllUsers);

module.exports = router;
