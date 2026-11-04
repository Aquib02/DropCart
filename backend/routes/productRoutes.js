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
    bulkUploadProducts,
    bulkPriceUpdate,
    bulkDiscountUpdate,
    duplicateProduct,
    updateApprovalStatus,
    toggleFeatured,
    toggleBestSeller,
    updateVisibility,
} = require('../controllers/productController');

const { protect, hasPermission } = require('../middleware/authMiddleware');

// Public catalog routes
router.route('/').get(getProduct).post(protect, hasPermission('manage_products'), createProduct);
router.get('/suggestions', getSuggestions);
router.get('/categories', getCategories);
router.post('/compare', compareProducts);

// Bulk Operations
router.post('/bulk-upload', protect, hasPermission('manage_products'), bulkUploadProducts);
router.patch('/bulk-price-update', protect, hasPermission('manage_products'), bulkPriceUpdate);
router.patch('/bulk-discount-update', protect, hasPermission('manage_products'), bulkDiscountUpdate);

// Admin review moderation routes
router.get('/reviews/all', protect, hasPermission('manage_products'), getAllReviews);
router.delete('/:productId/reviews/:reviewId', protect, hasPermission('manage_products'), deleteProductReview);

// Specific product routes
router
    .route('/:id')
    .get(getProductById)
    .delete(protect, hasPermission('manage_products'), deleteProduct)
    .put(protect, hasPermission('manage_products'), updateProduct);

// Product duplication & workflows
router.post('/:id/duplicate', protect, hasPermission('manage_products'), duplicateProduct);
router.patch('/:id/approval', protect, hasPermission('manage_products'), updateApprovalStatus);
router.patch('/:id/featured', protect, hasPermission('manage_products'), toggleFeatured);
router.patch('/:id/bestseller', protect, hasPermission('manage_products'), toggleBestSeller);
router.patch('/:id/visibility', protect, hasPermission('manage_products'), updateVisibility);

// Related and bundle recommendations
router.get('/:id/related', getRelatedProducts);

// Stock quick toggle
router.patch('/:id/stock', protect, hasPermission('manage_products'), toggleProductStock);

// Review submission
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;
