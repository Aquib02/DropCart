const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        brand: {
            type: String,
            default: 'DropCart',
        },
        image: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        // Selling Price
        price: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        // Original MRP (for strikethrough & % discount)
        originalPrice: {
            type: Number,
            default: 0,
        },
        discountPercent: {
            type: Number,
            default: 0,
        },
        countInStock: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        isOutOfStock: {
            type: Boolean,
            default: false,
        },
        rating: {
            type: Number,
            default: 4.5,
        },
        numReviews: {
            type: Number,
            default: 0,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        tag: {
            type: String,
            default: '', // e.g. "Top Deal", "Bestseller", "Trending"
        },
        reviews: [reviewSchema],
    },
    { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
