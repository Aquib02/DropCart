const Ticket = require('../models/ticketModel');
const EngagementNotification = require('../models/engagementNotificationModel');
const PriceAlert = require('../models/priceAlertModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

/**
 * Seed initial realistic support tickets if none exist
 */
async function ensureInitialTickets() {
    try {
        const count = await Ticket.countDocuments();
        if (count === 0) {
            await Ticket.create([
                {
                    ticketNumber: 'TKT-10821',
                    customerName: 'Aarav Sharma',
                    customerEmail: 'aarav.sharma@example.com',
                    customerPhone: '+91 98201 12345',
                    subject: 'Courier delay on BlueDart Express shipment',
                    category: 'Order & Delivery',
                    priority: 'High',
                    status: 'In Progress',
                    assignedToName: 'Lead Support Specialist',
                    messages: [
                        {
                            sender: 'customer',
                            senderName: 'Aarav Sharma',
                            message: 'Hi, tracking shows package arrived at regional hub 2 days ago but out for delivery has not been updated. Order #ORD-8921.',
                            timestamp: new Date(Date.now() - 24 * 3600 * 1000)
                        },
                        {
                            sender: 'agent',
                            senderName: 'DropCart Support',
                            message: 'Hello Aarav, we have escalated with BlueDart dispatch desk. Delivery is scheduled for today by 5 PM.',
                            timestamp: new Date(Date.now() - 12 * 3600 * 1000)
                        }
                    ]
                },
                {
                    ticketNumber: 'TKT-10822',
                    customerName: 'Priya Patel',
                    customerEmail: 'priya.patel@example.com',
                    customerPhone: '+91 97112 54321',
                    subject: 'Instant UPI refund confirmation request',
                    category: 'Payment & Refund',
                    priority: 'Medium',
                    status: 'Open',
                    messages: [
                        {
                            sender: 'customer',
                            senderName: 'Priya Patel',
                            message: 'I returned the formal leather derby shoes yesterday. Could you please confirm if the refund of ₹3,499 has been credited back to my UPI?',
                            timestamp: new Date(Date.now() - 6 * 3600 * 1000)
                        }
                    ]
                },
                {
                    ticketNumber: 'TKT-10823',
                    customerName: 'Rahul Verma',
                    customerEmail: 'rahul.verma@example.com',
                    customerPhone: '+91 99887 66554',
                    subject: 'Query about 1-year manufacturer warranty registration',
                    category: 'Product Inquiry',
                    priority: 'Low',
                    status: 'Resolved',
                    assignedToName: 'Customer Support Agent',
                    messages: [
                        {
                            sender: 'customer',
                            senderName: 'Rahul Verma',
                            message: 'How do I register the 1-year Sony manufacturer warranty for WH-1000XM5 headphones?',
                            timestamp: new Date(Date.now() - 48 * 3600 * 1000)
                        },
                        {
                            sender: 'agent',
                            senderName: 'DropCart Support',
                            message: 'Your official GST invoice attached with your order serves as valid proof of warranty at any Sony service center across India.',
                            timestamp: new Date(Date.now() - 36 * 3600 * 1000)
                        }
                    ],
                    resolutionNotes: 'Customer satisfied with invoice warranty documentation instructions.',
                    resolvedAt: new Date(Date.now() - 36 * 3600 * 1000)
                }
            ]);
        }
    } catch (e) {
        console.warn('Initial tickets seed warning:', e.message);
    }
}

// 1. Get Support Tickets with Filtering
exports.getSupportTickets = async (req, res) => {
    try {
        await ensureInitialTickets();
        const { status, priority, category, search } = req.query;

        const query = {};
        if (status && status !== 'All') query.status = status;
        if (priority && priority !== 'All') query.priority = priority;
        if (category && category !== 'All') query.category = category;
        if (search) {
            query.$or = [
                { ticketNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }

        const tickets = await Ticket.find(query).sort({ createdAt: -1 });

        // Aggregate counts
        const all = await Ticket.find({}).lean();
        const counts = {
            total: all.length,
            open: all.filter(t => t.status === 'Open').length,
            inProgress: all.filter(t => t.status === 'In Progress').length,
            resolved: all.filter(t => t.status === 'Resolved' || t.status === 'Closed').length
        };

        res.json({
            success: true,
            counts,
            tickets
        });
    } catch (error) {
        console.error('Error in getSupportTickets:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Create Support Ticket
exports.createSupportTicket = async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, subject, category, priority, message } = req.body;

        const ticketNumber = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;

        const newTicket = await Ticket.create({
            ticketNumber,
            user: req.user?._id || null,
            customerName: customerName || req.user?.name || 'Customer',
            customerEmail: customerEmail || req.user?.email,
            customerPhone: customerPhone || '',
            subject,
            category: category || 'Order & Delivery',
            priority: priority || 'Medium',
            messages: [
                {
                    sender: 'customer',
                    senderName: customerName || req.user?.name || 'Customer',
                    message,
                    timestamp: new Date()
                }
            ]
        });

        // Notify admins in real-time
        const io = req.app.get('io');
        if (io) {
            io.to('admin_channel').emit('newSupportTicket', newTicket);
        }

        res.status(201).json({ success: true, ticket: newTicket });
    } catch (error) {
        console.error('Error in createSupportTicket:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Update Ticket (Add Agent Message / Change Status)
exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, replyMessage, assignedToName, resolutionNotes } = req.body;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (status) ticket.status = status;
        if (assignedToName) ticket.assignedToName = assignedToName;
        if (resolutionNotes !== undefined) ticket.resolutionNotes = resolutionNotes;

        if (replyMessage && replyMessage.trim()) {
            ticket.messages.push({
                sender: 'agent',
                senderName: req.user?.name || 'Support Agent',
                message: replyMessage.trim(),
                timestamp: new Date()
            });
        }

        if (status === 'Resolved' && !ticket.resolvedAt) {
            ticket.resolvedAt = new Date();
        }

        const updated = await ticket.save();

        // Real-time notification to customer channel if registered user
        const io = req.app.get('io');
        if (io && ticket.user) {
            io.to(`user_${ticket.user.toString()}`).emit('ticketReply', {
                ticketNumber: ticket.ticketNumber,
                status: ticket.status,
                latestMessage: replyMessage
            });
        }

        res.json({ success: true, ticket: updated });
    } catch (error) {
        console.error('Error in updateTicket:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Get Abandoned Carts / Inactive Shoppers
exports.getAbandonedCarts = async (req, res) => {
    try {
        // Users who have products in wishlist or created account > 3 days ago with 0 orders
        const users = await User.find({
            role: { $ne: 'admin' },
            $or: [
                { 'wishlist.0': { $exists: true } },
                { ordersCount: 0 }
            ]
        })
            .populate('wishlist', 'name price image category')
            .limit(30)
            .lean();

        const targets = users.map(u => {
            const wishlistItems = u.wishlist || [];
            const estimatedValue = wishlistItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

            return {
                userId: u._id,
                name: u.name,
                email: u.email,
                phone: u.phone || 'N/A',
                itemsCount: wishlistItems.length,
                estimatedCartValue: estimatedValue > 0 ? estimatedValue : 2499,
                sampleItem: wishlistItems[0]?.name || 'Popular Storefront Collection',
                sampleImage: wishlistItems[0]?.image || '',
                daysInactive: Math.floor((Date.now() - new Date(u.updatedAt || u.createdAt).getTime()) / (1000 * 3600 * 24)),
                status: u.ordersCount === 0 ? 'First-Time Prospect' : 'Abandoned Cart Lead'
            };
        });

        res.json({
            success: true,
            totalLeads: targets.length,
            totalPotentialRecoveryValue: targets.reduce((sum, t) => sum + t.estimatedCartValue, 0),
            targets
        });
    } catch (error) {
        console.error('Error in getAbandonedCarts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Send Recovery Coupon Offer
exports.sendRecoveryOffer = async (req, res) => {
    try {
        const { userId, couponCode = 'COMEBACK15', discountPercent = 15 } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Add SuperCoins reward incentive
        user.coins = (user.coins || 0) + 50;
        if (!user.customerDiscounts.includes(couponCode)) {
            user.customerDiscounts.push(couponCode);
        }
        await user.save();

        // Emit Socket.IO alert to customer
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${userId}`).emit('promotionalOffer', {
                title: `Special ${discountPercent}% Off Waiting For You!`,
                message: `We noticed you left items behind. Use coupon code ${couponCode} for extra ${discountPercent}% off + 50 Free SuperCoins!`,
                couponCode
            });
        }

        res.json({
            success: true,
            message: `Recovery offer ${couponCode} and 50 bonus SuperCoins dispatched to ${user.email}.`
        });
    } catch (error) {
        console.error('Error in sendRecoveryOffer:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Promotional Broadcasts & Store Announcements
exports.getBroadcasts = async (req, res) => {
    try {
        const broadcasts = await EngagementNotification.find({}).sort({ createdAt: -1 }).limit(20);
        res.json({ success: true, broadcasts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.sendBroadcastNotification = async (req, res) => {
    try {
        const { title, message, targetAudience = 'All', channel = 'In-App Push', link = '/shop', badge = 'Flash Sale' } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }

        const totalShoppers = await User.countDocuments({ role: { $ne: 'admin' } });

        const broadcast = await EngagementNotification.create({
            title,
            message,
            targetAudience,
            channel,
            link,
            badge,
            reachCount: totalShoppers || 120,
            sentBy: req.user._id,
            sentByName: req.user.name
        });

        // Broadcast to all active customer connections
        const io = req.app.get('io');
        if (io) {
            io.emit('storeBroadcast', {
                title,
                message,
                badge,
                link
            });
        }

        res.status(201).json({
            success: true,
            message: `Broadcast successfully pushed to ${totalShoppers} registered customers.`,
            broadcast
        });
    } catch (error) {
        console.error('Error in sendBroadcastNotification:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Get Price-Drop Alerts
exports.getPriceDropAlerts = async (req, res) => {
    try {
        const alerts = await PriceAlert.find({})
            .populate('product', 'name price image category countInStock')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
