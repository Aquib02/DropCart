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

const specificationItemSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },
        value: { type: String, required: true },
    },
    { _id: false }
);

const specificationGroupSchema = new mongoose.Schema(
    {
        groupName: { type: String, default: 'General' },
        items: [specificationItemSchema],
    },
    { _id: false }
);

const variantSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // e.g. "Color" or "Storage" or "Size"
        options: [{ type: String, required: true }], // e.g. ["128 GB", "256 GB"]
        priceDelta: { type: Number, default: 0 }, // price modifier
        sku: { type: String, default: '' },
        stock: { type: Number, default: 0 },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        sku: {
            type: String,
            trim: true,
            default: '',
            index: true,
        },
        barcode: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: ['active', 'draft', 'archived'],
            default: 'active',
            index: true,
        },
        approvalStatus: {
            type: String,
            enum: ['approved', 'pending_approval', 'rejected'],
            default: 'approved',
            index: true,
        },
        approvalNotes: {
            type: String,
            default: '',
        },
        scheduledPublishDate: {
            type: Date,
        },
        brand: {
            type: String,
            default: 'DropCart',
            trim: true,
        },
        // Primary cover image
        image: {
            type: String,
            required: true,
        },
        // Multi-image gallery for zoom and thumbnail switcher
        images: {
            type: [String],
            default: [],
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
        // Wholesale / Cost Price (for profit margin & business analytics)
        costPrice: {
            type: Number,
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
        isBestSeller: {
            type: Boolean,
            default: false,
        },
        lowStockThreshold: {
            type: Number,
            default: 5,
        },
        reservedStock: {
            type: Number,
            default: 0,
            min: 0,
        },
        supplier: {
            name: { type: String, default: '' },
            contact: { type: String, default: '' },
            leadTimeDays: { type: Number, default: 3 },
        },
        totalSalesCount: {
            type: Number,
            default: 0,
        },
        totalRevenueGenerated: {
            type: Number,
            default: 0,
        },
        tag: {
            type: String,
            default: '', // e.g. "Top Deal", "Bestseller", "Trending"
        },
        views: {
            type: Number,
            default: 0,
        },
        // Product variants (storage, color, size)
        variants: [variantSchema],
        // Categorized specifications table
        specifications: [specificationGroupSchema],
        reviews: [reviewSchema],
    },
    { timestamps: true }
);

// Search & performance indexes
productSchema.index({ name: 'text', brand: 'text', category: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
