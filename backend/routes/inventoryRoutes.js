const express = require('express');
const router = express.Router();
const {
    getInventoryDashboard,
    adjustStock,
    bulkStockUpdate,
    getInventoryLogs,
    reserveStock
} = require('../controllers/inventoryController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

// Inventory Dashboard & SKUs
router.get('/dashboard', protect, hasPermission('manage_products'), getInventoryDashboard);

// Stock Adjustments
router.post('/adjust', protect, hasPermission('manage_products'), adjustStock);
router.patch('/bulk-stock', protect, hasPermission('manage_products'), bulkStockUpdate);

// Audit Trail & Logs
router.get('/logs', protect, hasPermission('manage_products'), getInventoryLogs);

// Stock Reservation (Safe atomic operations)
router.post('/reserve', reserveStock);

module.exports = router;
