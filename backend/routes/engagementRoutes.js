const express = require('express');
const router = express.Router();
const {
    getSupportTickets,
    createSupportTicket,
    updateTicket,
    getAbandonedCarts,
    sendRecoveryOffer,
    getBroadcasts,
    sendBroadcastNotification,
    getPriceDropAlerts
} = require('../controllers/engagementController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

// Customer Ticket Creation (Protected user or public inquiry)
router.post('/tickets', protect, createSupportTicket);

// Admin / Staff Support Operations
router.get('/tickets', protect, hasPermission('manage_customers'), getSupportTickets);
router.patch('/tickets/:id', protect, hasPermission('manage_customers'), updateTicket);

// Abandoned Cart Recovery
router.get('/abandoned-carts', protect, hasPermission('manage_customers'), getAbandonedCarts);
router.post('/abandoned-carts/recovery-offer', protect, hasPermission('manage_customers'), sendRecoveryOffer);

// Broadcast Announcements
router.get('/broadcasts', protect, hasPermission('manage_campaigns'), getBroadcasts);
router.post('/broadcasts', protect, hasPermission('manage_campaigns'), sendBroadcastNotification);

// Price Drop Alerts
router.get('/price-alerts', protect, hasPermission('manage_products'), getPriceDropAlerts);

module.exports = router;
