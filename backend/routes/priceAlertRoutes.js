const express = require('express');
const router = express.Router();
const { createPriceAlert } = require('../controllers/priceAlertController');

router.post('/price-drop', createPriceAlert);

module.exports = router;
