const Product = require('../models/productModel');

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
                }
                if (updatedProduct.price < oldPrice) {
                    io.emit('priceDropAlert', {
                        productId: updatedProduct._id,
                        name: updatedProduct.name,
                        newPrice: updatedProduct.price,
                        oldPrice: oldPrice,
                        discountPercent: updatedProduct.discountPercent
                    });
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
};
