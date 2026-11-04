const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        orderItems: [
            {
                name: { type: String, required: true },
                qty: { type: Number, required: true },
                image: { type: String, required: true },
                price: { type: Number, required: true },
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: 'Product',
                },
            },
        ],
        shippingAddress: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        paymentMethod: {
            type: String,
            required: true,
            default: 'COD',
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        status: {
            type: String,
            required: true,
            enum: [
                'Pending',
                'Processing',
                'Shipped',
                'Out For Delivery',
                'Delivered',
                'Cancelled',
                'Return_Requested',
                'Returned',
                'Refunded',
            ],
            default: 'Pending',
        },
        deliveredAt: {
            type: Date,
        },
        trackingNumber: {
            type: String,
            default: '',
        },
        courierPartner: {
            type: String,
            default: 'BlueDart Express',
        },
        estimatedDeliveryDate: {
            type: Date,
        },
        shippingLabel: {
            labelNumber: { type: String, default: '' },
            generatedAt: { type: Date },
            weightKg: { type: Number, default: 0.8 },
            dimensions: { type: String, default: '25x20x10 cm' },
        },
        invoice: {
            invoiceNumber: { type: String, default: '' },
            invoiceDate: { type: Date },
            taxAmount: { type: Number, default: 0 },
            subtotal: { type: Number, default: 0 },
            discountAmount: { type: Number, default: 0 },
            couponCode: { type: String, default: '' },
        },
        returnRequest: {
            reason: { type: String, default: '' },
            status: {
                type: String,
                enum: ['None', 'Requested', 'Approved', 'Rejected', 'Completed'],
                default: 'None',
            },
            requestedAt: { type: Date },
            resolvedAt: { type: Date },
            refundAmount: { type: Number, default: 0 },
            adminNotes: { type: String, default: '' },
        },
        timeline: [
            {
                status: { type: String, required: true },
                title: { type: String, required: true },
                description: { type: String, default: '' },
                timestamp: { type: Date, default: Date.now },
                performedBy: { type: String, default: 'System' },
            },
        ],
    },
    { timestamps: true }
);

// High performance query indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ isPaid: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
