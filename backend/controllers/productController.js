const Product = require('../models/productModel');

// @desc    Fetch all products with Search, Category Filter, and Sorting
// @route   GET /api/products
// @access  Public
const getProduct = async (req, res) => {
    try {
        const { keyword, category, sort, inStockOnly } = req.query;

        // Search query
        let query = {};
        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { category: { $regex: keyword, $options: 'i' } },
            ];
        }

        // Category filter
        if (category && category !== 'All') {
            query.category = { $regex: new RegExp(`^${category}$`, 'i') };
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
        } else if (sort === 'name') {
            sortOption = { name: 1 };
        }

        const products = await Product.find(query).sort(sortOption);
        res.json(products);
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

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
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
        const { name, price, description, image, category, countInStock, isOutOfStock } = req.body;

        const stock = Number(countInStock) || 0;
        const product = new Product({
            name,
            price: Number(price) || 0,
            image,
            category,
            countInStock: stock,
            isOutOfStock: isOutOfStock !== undefined ? isOutOfStock : stock === 0,
            description,
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
        const { name, price, description, image, category, countInStock, isOutOfStock } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.price = price !== undefined ? Number(price) : product.price;
            product.description = description || product.description;
            product.image = image || product.image;
            product.category = category || product.category;

            if (countInStock !== undefined) {
                product.countInStock = Number(countInStock);
                if (product.countInStock === 0) {
                    product.isOutOfStock = true;
                }
            }

            if (isOutOfStock !== undefined) {
                product.isOutOfStock = isOutOfStock;
            }

            const updatedProduct = await product.save();
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

        if (countInStock !== undefined) {
            product.countInStock = Number(countInStock);
            product.isOutOfStock = product.countInStock === 0;
        } else if (isOutOfStock !== undefined) {
            product.isOutOfStock = isOutOfStock;
            if (isOutOfStock && product.countInStock > 0) {
                // If manually marked out of stock
                product.countInStock = 0;
            } else if (!isOutOfStock && product.countInStock === 0) {
                // Restock default
                product.countInStock = 10;
            }
        }

        const updated = await product.save();
        res.json(updated);
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

module.exports = {
    getProduct,
    getCategories,
    getProductById,
    deleteProduct,
    updateProduct,
    createProduct,
    toggleProductStock,
    createProductReview,
};
