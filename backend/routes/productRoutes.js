const express = require('express');
const router = express.Router();
const {
    getProduct,
    getSuggestions,
    getCategories,
    getProductById,
    compareProducts,
    getRelatedProducts,
    deleteProduct,
    updateProduct,
    createProduct,
    toggleProductStock,
    createProductReview,
    getAllReviews,
    deleteProductReview,
} = require('../controllers/productController');

const { protect, hasPermission } = require('../middleware/authMiddleware');

// Public catalog routes
router.route('/').get(getProduct).post(protect, hasPermission('manage_products'), createProduct);
router.get('/suggestions', getSuggestions);
router.get('/categories', getCategories);
router.post('/compare', compareProducts);

// Admin review moderation routes
router.get('/reviews/all', protect, hasPermission('manage_products'), getAllReviews);
router.delete('/:productId/reviews/:reviewId', protect, hasPermission('manage_products'), deleteProductReview);

// Specific product routes
router
    .route('/:id')
    .get(getProductById)
    .delete(protect, hasPermission('manage_products'), deleteProduct)
    .put(protect, hasPermission('manage_products'), updateProduct);

// Related and bundle recommendations
router.get('/:id/related', getRelatedProducts);

// Stock quick toggle
router.patch('/:id/stock', protect, hasPermission('manage_products'), toggleProductStock);

// Review submission
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;
