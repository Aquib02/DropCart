const express = require('express');
const router = express.Router();
const {
    getCustomerDirectory,
    getCustomerDetails,
    toggleBlockCustomer,
    adjustLoyaltyCoins,
    assignExclusiveDiscount
} = require('../controllers/customerController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getCustomerDirectory);
router.get('/:id', protect, admin, getCustomerDetails);
router.patch('/:id/block', protect, admin, toggleBlockCustomer);
router.post('/:id/coins', protect, admin, adjustLoyaltyCoins);
router.post('/:id/discount', protect, admin, assignExclusiveDiscount);

module.exports = router;
