const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema(
    {
        sender: {
            type: String,
            enum: ['customer', 'agent'],
            required: true,
        },
        senderName: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const ticketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            unique: true,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        customerEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        customerPhone: {
            type: String,
            default: '',
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: [
                'Order & Delivery',
                'Payment & Refund',
                'Product Inquiry',
                'Account & Security',
                'General Feedback',
            ],
            default: 'Order & Delivery',
        },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Urgent'],
            default: 'Medium',
        },
        status: {
            type: String,
            enum: ['Open', 'In Progress', 'Waiting Customer', 'Resolved', 'Closed'],
            default: 'Open',
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        assignedToName: {
            type: String,
            default: 'Unassigned',
        },
        messages: [ticketMessageSchema],
        resolutionNotes: {
            type: String,
            default: '',
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ customerEmail: 1 });
ticketSchema.index({ ticketNumber: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
