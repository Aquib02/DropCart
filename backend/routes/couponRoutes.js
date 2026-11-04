const express = require('express');
const router = express.Router();
const {
    applyCoupon,
    getActiveCoupons,
    getAllCoupons,
    createCoupon,
    toggleCouponStatus,
    deleteCoupon,
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/apply', applyCoupon);
router.get('/active', getActiveCoupons);

router.route('/')
    .get(protect, admin, getAllCoupons)
    .post(protect, admin, createCoupon);

router.patch('/:id/toggle', protect, admin, toggleCouponStatus);

router.route('/:id')
    .delete(protect, admin, deleteCoupon);

module.exports = router;
