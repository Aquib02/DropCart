const mongoose = require('mongoose');

const engagementNotificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        targetAudience: {
            type: String,
            enum: ['All', 'VIP Customers', 'New Customers', 'At Risk Customers'],
            default: 'All',
        },
        channel: {
            type: String,
            enum: ['In-App Push', 'Email Broadcast', 'Announcement Marquee', 'SMS Alert'],
            default: 'In-App Push',
        },
        link: {
            type: String,
            default: '/shop',
        },
        badge: {
            type: String,
            default: 'Special Announcement',
        },
        reachCount: {
            type: Number,
            default: 0,
        },
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        sentByName: {
            type: String,
            default: 'System Administrator',
        },
    },
    { timestamps: true }
);

engagementNotificationSchema.index({ createdAt: -1 });

const EngagementNotification = mongoose.model('EngagementNotification', engagementNotificationSchema);
module.exports = EngagementNotification;
