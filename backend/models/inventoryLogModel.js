const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        productName: {
            type: String,
            required: true,
        },
        sku: {
            type: String,
            default: '',
            index: true,
        },
        type: {
            type: String,
            enum: [
                'manual_adjustment',
                'order_deduction',
                'order_restock',
                'bulk_import',
                'stock_reservation',
                'supplier_received',
                'damaged_write_off',
            ],
            required: true,
            index: true,
        },
        quantityDelta: {
            type: Number,
            required: true,
        },
        previousStock: {
            type: Number,
            required: true,
        },
        newStock: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            default: 'Routine stock management',
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        performedByName: {
            type: String,
            default: 'System',
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
    },
    { timestamps: true }
);

inventoryLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
