const express = require('express');
const router = express.Router();

const {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getOrders,
    updateOrderStatus,
    getOrderStats,
} = require('../controllers/orderController');

const { protect, hasPermission } = require('../middleware/authMiddleware');

// Order creation and listing
router
    .route('/')
    .post(protect, addOrderItems)
    .get(protect, hasPermission('manage_orders'), getOrders);

// Statistics for Dashboard
router.get('/stats', protect, hasPermission('manage_orders'), getOrderStats);

// Customer personal orders
router.get('/myorders', protect, getMyOrders);

// Order by ID
router.route('/:id').get(protect, getOrderById);

// Update status
router.route('/:id/status').put(protect, hasPermission('manage_orders'), updateOrderStatus);

module.exports = router;
