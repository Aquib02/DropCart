const express = require('express');
const router = express.Router();

const {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getOrders,
    updateOrderStatus,
    getOrderStats,
    bulkUpdateOrderStatus,
    updateDeliveryTracking,
    handleReturnRequest,
    processRefund,
    getOrderInvoice,
    getOrderShippingLabel,
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

// Bulk Status Updates
router.patch('/bulk-status', protect, hasPermission('manage_orders'), bulkUpdateOrderStatus);

// Order by ID
router.route('/:id').get(protect, getOrderById);

// Update status
router.route('/:id/status').put(protect, hasPermission('manage_orders'), updateOrderStatus);

// Delivery Tracking & Courier
router.patch('/:id/tracking', protect, hasPermission('manage_orders'), updateDeliveryTracking);

// Returns & Refunds
router.post('/:id/return', protect, handleReturnRequest);
router.post('/:id/refund', protect, hasPermission('manage_orders'), processRefund);

// Invoices & Shipping Labels
router.get('/:id/invoice', protect, getOrderInvoice);
router.get('/:id/shipping-label', protect, hasPermission('manage_orders'), getOrderShippingLabel);

module.exports = router;
