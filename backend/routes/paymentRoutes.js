const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, paymentController.createRazorpayOrder);
router.post('/verify', protect, paymentController.verifyPaymentSignature);

module.exports = router;
