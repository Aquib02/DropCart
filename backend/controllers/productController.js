const Product = require('../models/productModel');
const PriceAlert = require('../models/priceAlertModel');
const emailService = require('../utils/emailService');

// @desc    Fetch all products with Search, Category Filter, and Sorting
// @route   GET /api/products
// @access  Public
const getProduct = async (req, res) => {
    try {
        const { keyword, category, sort, inStockOnly, brand, minPrice, maxPrice, minRating } = req.query;

        let query = {};

        // Search query across name, brand, category, description
        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { category: { $regex: keyword, $options: 'i' } },
                { brand: { $regex: keyword, $options: 'i' } },
            ];
        }

        // Category filter
        if (category && category !== 'All') {
            query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        // Brand filter
        if (brand && brand !== 'All') {
            query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Rating filter
        if (minRating) {
            query.rating = { $gte: Number(minRating) };
        }

        // In-stock only filter
        if (inStockOnly === 'true') {
            query.countInStock = { $gt: 0 };
            query.isOutOfStock = false;
        }

        // Sorting
        let sortOption = { createdAt: -1 }; // default: newest
        if (sort === 'price-asc') {
            sortOption = { price: 1 };
        } else if (sort === 'price-desc') {
            sortOption = { price: -1 };
        } else if (sort === 'rating') {
            sortOption = { rating: -1 };
        } else if (sort === 'popular') {
            sortOption = { views: -1, rating: -1 };
        } else if (sort === 'discount') {
            sortOption = { discountPercent: -1 };
        } else if (sort === 'name') {
            sortOption = { name: 1 };
        }

        const products = await Product.find(query).sort(sortOption);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fast search suggestions for navbar autocomplete
// @route   GET /api/products/suggestions
// @access  Public
const getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.json({ products: [], categories: [] });
        }
        const regex = new RegExp(q.trim(), 'i');

        const [products, matchingCategories] = await Promise.all([
            Product.find({
                $or: [{ name: regex }, { brand: regex }, { category: regex }],
            })
                .select('_id name price originalPrice discountPercent image category brand rating')
                .limit(6),
            Product.distinct('category', { category: regex }),
        ]);

        res.json({ products, categories: matchingCategories.slice(0, 4) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch distinct product categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product by ID (increments views)
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch products for comparison (up to 4 products)
// @route   POST /api/products/compare
// @access  Public
const compareProducts = async (req, res) => {
    try {
        const { productIds } = req.body;
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of product IDs.' });
        }

        const validIds = productIds.slice(0, 4);
        const products = await Product.find({ _id: { $in: validIds } });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch related / similar products and frequently bought together items
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Similar products in same category
        const similar = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
        })
            .limit(6)
            .sort({ rating: -1 });

        // Complementary bundle items (different category or accessories)
        const frequentlyBoughtTogether = await Product.find({
            _id: { $ne: product._id },
            category: { $ne: product.category },
        })
            .limit(2)
            .sort({ rating: -1 });

        res.json({
            similar,
            frequentlyBoughtTogether,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private / Admin or Staff with manage_products
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private / Admin or Staff with manage_products
const createProduct = async (req, res) => {
    try {
        const {
            name,
            brand,
            price,
            originalPrice,
            discountPercent,
            description,
            image,
            images,
            category,
            countInStock,
            isOutOfStock,
            tag,
            variants,
            specifications,
        } = req.body;

        const stock = Number(countInStock) || 0;
        const finalPrice = Number(price) || 0;
        const mrp = originalPrice ? Number(originalPrice) : finalPrice;
        const discount =
            discountPercent !== undefined
                ? Number(discountPercent)
                : mrp > finalPrice
                ? Math.round(((mrp - finalPrice) / mrp) * 100)
                : 0;

        const product = new Product({
            name,
            brand: brand || 'DropCart',
            price: finalPrice,
            originalPrice: mrp,
            discountPercent: discount,
            image,
            images: Array.isArray(images) && images.length > 0 ? images : [image],
            category,
            countInStock: stock,
            isOutOfStock: isOutOfStock !== undefined ? isOutOfStock : stock === 0,
            description,
            tag: tag || '',
            variants: Array.isArray(variants) ? variants : [],
            specifications: Array.isArray(specifications) ? specifications : [],
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private / Admin or Staff with manage_products
const updateProduct = async (req, res) => {
    try {
        const {
            name,
            brand,
            price,
            originalPrice,
            discountPercent,
            description,
            image,
            images,
            category,
            countInStock,
            isOutOfStock,
            tag,
            variants,
            specifications,
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.brand = brand || product.brand;
            product.description = description || product.description;
            product.image = image || product.image;
            if (Array.isArray(images)) {
                product.images = images;
            }
            product.category = category || product.category;
            product.tag = tag !== undefined ? tag : product.tag;

            if (price !== undefined) {
                product.price = Number(price);
            }
            if (originalPrice !== undefined) {
                product.originalPrice = Number(originalPrice);
            }
            if (discountPercent !== undefined) {
                product.discountPercent = Number(discountPercent);
            } else if (product.originalPrice > product.price) {
                product.discountPercent = Math.round(
                    ((product.originalPrice - product.price) / product.originalPrice) * 100
                );
            }

            if (countInStock !== undefined) {
                product.countInStock = Number(countInStock);
                if (product.countInStock === 0) {
                    product.isOutOfStock = true;
                }
            }

            if (isOutOfStock !== undefined) {
                product.isOutOfStock = isOutOfStock;
            }

            if (Array.isArray(variants)) {
                product.variants = variants;
            }
            if (Array.isArray(specifications)) {
                product.specifications = specifications;
            }

            const oldPrice = product.price;
            const updatedProduct = await product.save();

            // Real-Time Notification: Check for low-stock and price drop
            const io = req.app.get('io');
            if (io) {
                if (updatedProduct.countInStock <= 5) {
                    io.to('admin_channel').emit('lowStockAlert', {
                        productId: updatedProduct._id,
                        name: updatedProduct.name,
                        stock: updatedProduct.countInStock,
                        image: updatedProduct.image,
                        time: new Date()
                    });
                    emailService.sendLowStockAlertEmail({ product: updatedProduct });
                }
                if (updatedProduct.price < oldPrice) {
                    io.emit('priceDropAlert', {
                        productId: updatedProduct._id,
                        name: updatedProduct.name,
                        newPrice: updatedProduct.price,
                        oldPrice: oldPrice,
                        discountPercent: updatedProduct.discountPercent
                    });

                    // Trigger target price drop email alerts to subscribers
                    PriceAlert.find({
                        product: updatedProduct._id,
                        targetPrice: { $gte: updatedProduct.price },
                        isActive: true
                    }).then(alerts => {
                        alerts.forEach(alert => {
                            emailService.sendPriceDropEmail({
                                product: updatedProduct,
                                customerEmail: alert.email,
                                targetPrice: alert.targetPrice,
                                currentPrice: updatedProduct.price
                            });
                        });
                    }).catch(err => console.warn('Price alert check error:', err.message));
                }
            }

            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle product out-of-stock status or quick adjust stock
// @route   PATCH /api/products/:id/stock
// @access  Private / Admin or Staff with manage_products
const toggleProductStock = async (req, res) => {
    try {
        const { isOutOfStock, countInStock } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (isOutOfStock !== undefined) {
            product.isOutOfStock = isOutOfStock;
            if (isOutOfStock) {
                product.countInStock = 0;
            }
        }

        if (countInStock !== undefined) {
            product.countInStock = Number(countInStock);
            if (product.countInStock > 0 && product.isOutOfStock) {
                product.isOutOfStock = false;
            } else if (product.countInStock === 0) {
                product.isOutOfStock = true;
            }
        }

        const updated = await product.save();
        res.json({
            message: 'Stock status updated successfully',
            product: updated,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new review for a product
// @route   POST /api/products/:id/reviews
// @access  Private / Customers
const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if customer already reviewed this product
        const alreadyReviewed = product.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;

        await product.save();
        res.status(201).json({ message: 'Review submitted successfully', product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all product reviews across catalog (Admin Moderation)
// @route   GET /api/products/reviews/all
// @access  Private / Admin
const getAllReviews = async (req, res) => {
    try {
        const products = await Product.find({ 'reviews.0': { $exists: true } }).select(
            '_id name image category reviews'
        );
        const reviews = [];
        products.forEach((p) => {
            p.reviews.forEach((r) => {
                reviews.push({
                    _id: r._id,
                    productId: p._id,
                    productName: p.name,
                    productImage: p.image,
                    category: p.category,
                    user: r.user,
                    name: r.name,
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.createdAt,
                });
            });
        });
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a customer review (Admin Moderation)
// @route   DELETE /api/products/:productId/reviews/:reviewId
// @access  Private / Admin
const deleteProductReview = async (req, res) => {
    try {
        const { productId, reviewId } = req.params;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.reviews = product.reviews.filter((r) => r._id.toString() !== reviewId);
        product.numReviews = product.reviews.length;
        product.rating =
            product.reviews.length > 0
                ? product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
                : 0;

        await product.save();
        res.json({ message: 'Review removed successfully', product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 14. Bulk Product Upload (CSV / Excel rows / JSON)
const bulkUploadProducts = async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Products array is required' });
        }

        const validProducts = products.map((p, idx) => {
            const price = Number(p.price) || 0;
            const originalPrice = p.originalPrice ? Number(p.originalPrice) : price;
            const countInStock = Number(p.countInStock) || 0;
            const sku = p.sku && p.sku.trim() !== ''
                ? p.sku.trim()
                : `SKU-${(p.category || 'GEN').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}${idx}`;

            return {
                name: p.name || 'Untitled Product',
                sku,
                barcode: p.barcode || '',
                brand: p.brand || 'DropCart',
                category: p.category || 'General',
                price,
                costPrice: Number(p.costPrice) || Math.round(price * 0.7),
                originalPrice,
                discountPercent: p.discountPercent !== undefined ? Number(p.discountPercent) : (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0),
                countInStock,
                isOutOfStock: countInStock === 0,
                description: p.description || 'Quality authentic product from DropCart verified catalog.',
                image: p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
                images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80'],
                status: p.status || 'active',
                approvalStatus: 'approved',
                isFeatured: Boolean(p.isFeatured),
                isBestSeller: Boolean(p.isBestSeller),
                tag: p.tag || '',
            };
        });

        const created = await Product.insertMany(validProducts);
        res.status(201).json({
            success: true,
            message: `Successfully imported ${created.length} products into catalog.`,
            count: created.length,
            products: created
        });
    } catch (error) {
        console.error('Error in bulkUploadProducts:', error);
        res.status(500).json({ message: 'Bulk upload failed', error: error.message });
    }
};

// 15. Bulk Price Updates
const bulkPriceUpdate = async (req, res) => {
    try {
        const { productIds, category, changeType, value } = req.body;
        const val = Number(value);
        if (isNaN(val)) {
            return res.status(400).json({ message: 'Valid adjustment value is required' });
        }

        let query = {};
        if (Array.isArray(productIds) && productIds.length > 0) {
            query._id = { $in: productIds };
        } else if (category && category !== 'All') {
            query.category = category;
        } else {
            return res.status(400).json({ message: 'Select product IDs or a category to apply bulk price update' });
        }

        const products = await Product.find(query);
        let updatedCount = 0;

        for (const p of products) {
            let newPrice = p.price;
            if (changeType === 'percentage_increase') {
                newPrice = Math.round(p.price * (1 + val / 100));
            } else if (changeType === 'percentage_decrease') {
                newPrice = Math.max(1, Math.round(p.price * (1 - val / 100)));
            } else if (changeType === 'fixed_increase') {
                newPrice = p.price + val;
            } else if (changeType === 'fixed_decrease') {
                newPrice = Math.max(1, p.price - val);
            } else if (changeType === 'set_fixed') {
                newPrice = Math.max(1, val);
            }

            p.price = newPrice;
            if (p.originalPrice > newPrice) {
                p.discountPercent = Math.round(((p.originalPrice - newPrice) / p.originalPrice) * 100);
            }
            await p.save();
            updatedCount++;
        }

        res.json({
            success: true,
            message: `Successfully updated prices for ${updatedCount} product(s).`,
            count: updatedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Bulk price update failed', error: error.message });
    }
};

// 16. Bulk Discount Management
const bulkDiscountUpdate = async (req, res) => {
    try {
        const { productIds, category, discountPercent } = req.body;
        const discount = Math.min(99, Math.max(0, Number(discountPercent)));

        let query = {};
        if (Array.isArray(productIds) && productIds.length > 0) {
            query._id = { $in: productIds };
        } else if (category && category !== 'All') {
            query.category = category;
        } else {
            return res.status(400).json({ message: 'Select product IDs or a category' });
        }

        const products = await Product.find(query);
        let updatedCount = 0;

        for (const p of products) {
            const basePrice = p.originalPrice && p.originalPrice > 0 ? p.originalPrice : p.price;
            p.originalPrice = basePrice;
            p.discountPercent = discount;
            p.price = Math.round(basePrice * (1 - discount / 100));
            await p.save();
            updatedCount++;
        }

        res.json({
            success: true,
            message: `Successfully updated ${discount}% discount across ${updatedCount} products.`,
            count: updatedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Bulk discount update failed', error: error.message });
    }
};

// 17. Duplicate Product
const duplicateProduct = async (req, res) => {
    try {
        const original = await Product.findById(req.params.id);
        if (!original) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const cloneObj = original.toObject();
        delete cloneObj._id;
        delete cloneObj.createdAt;
        delete cloneObj.updatedAt;

        cloneObj.name = `${original.name} (Copy)`;
        cloneObj.sku = original.sku ? `${original.sku}-COPY` : `SKU-COPY-${Date.now().toString().slice(-4)}`;
        cloneObj.status = 'draft';

        const duplicate = await Product.create(cloneObj);
        res.status(201).json({
            success: true,
            message: `Product "${original.name}" duplicated as draft.`,
            product: duplicate
        });
    } catch (error) {
        res.status(500).json({ message: 'Product duplication failed', error: error.message });
    }
};

// 18. Product Approval Workflow
const updateApprovalStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.approvalStatus = status || product.approvalStatus;
        if (notes !== undefined) product.approvalNotes = notes;
        if (status === 'approved' && product.status === 'draft') {
            product.status = 'active';
        }
        await product.save();

        res.json({
            success: true,
            message: `Product approval status updated to ${status}.`,
            product
        });
    } catch (error) {
        res.status(500).json({ message: 'Approval status update failed', error: error.message });
    }
};

// 19. Toggle Featured & Best Seller
const toggleFeatured = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        product.isFeatured = !product.isFeatured;
        await product.save();
        res.json({ success: true, isFeatured: product.isFeatured, product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const toggleBestSeller = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        product.isBestSeller = !product.isBestSeller;
        await product.save();
        res.json({ success: true, isBestSeller: product.isBestSeller, product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 20. Update Product Visibility
const updateVisibility = async (req, res) => {
    try {
        const { status } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        product.status = status;
        await product.save();
        res.json({ success: true, status: product.status, product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
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
};
