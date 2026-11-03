const express = require('express');
const router = express.Router();
const {
    getProduct,
    getCategories,
    getProductById,
    deleteProduct,
    updateProduct,
    createProduct,
    toggleProductStock,
    createProductReview,
} = require('../controllers/productController');

const { protect, hasPermission } = require('../middleware/authMiddleware');

// Public catalog routes
router.route('/').get(getProduct).post(protect, hasPermission('manage_products'), createProduct);
router.get('/categories', getCategories);

// Specific product routes
router
    .route('/:id')
    .get(getProductById)
    .delete(protect, hasPermission('manage_products'), deleteProduct)
    .put(protect, hasPermission('manage_products'), updateProduct);

// Stock quick toggle
router.patch('/:id/stock', protect, hasPermission('manage_products'), toggleProductStock);

// Review submission
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;
