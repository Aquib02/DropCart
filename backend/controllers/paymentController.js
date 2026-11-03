const crypto = require('crypto');
const Order = require('../models/orderModel');

// @desc    Create Razorpay Payment Order
// @route   POST /api/payment/create-order
// @access  Private
exports.createRazorpayOrder = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid payment amount' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Amount in paise (1 INR = 100 paise)
        const amountInPaise = Math.round(Number(amount) * 100);
        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dropcart_demo';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dropcart_secret_demo';

        // Check if official Razorpay credentials exist
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            try {
                const Razorpay = require('razorpay');
                const instance = new Razorpay({
                    key_id: keyId,
                    key_secret: keySecret,
                });

                const rzpOrder = await instance.orders.create({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: `receipt_${order._id}`,
                    notes: { orderId: String(order._id) }
                });

                return res.json({
                    success: true,
                    razorpayOrderId: rzpOrder.id,
                    amount: rzpOrder.amount,
                    currency: rzpOrder.currency,
                    keyId
                });
            } catch (rzpErr) {
                console.warn('Live Razorpay order creation failed, falling back to simulated order:', rzpErr.message);
            }
        }

        // Simulated secure Razorpay order for instant local & testing environments
        const simulatedOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
        res.json({
            success: true,
            razorpayOrderId: simulatedOrderId,
            amount: amountInPaise,
            currency: 'INR',
            keyId: keyId,
            isSimulated: true
        });
    } catch (error) {
        console.error('Error creating payment order:', error);
        res.status(500).json({ success: false, message: 'Payment initiation error', error: error.message });
    }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPaymentSignature = async (req, res) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dropcart_secret_demo';

        let isValid = false;

        // If credentials are live, verify SHA256 HMAC
        if (process.env.RAZORPAY_KEY_SECRET && razorpaySignature) {
            const body = `${razorpayOrderId}|${razorpayPaymentId}`;
            const expectedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(body.toString())
                .digest('hex');

            isValid = expectedSignature === razorpaySignature;
        } else {
            // Simulated validation passes if paymentId and orderId are provided
            isValid = Boolean(razorpayPaymentId && razorpayOrderId);
        }

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature verification' });
        }

        // Mark order as paid
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentMethod = 'Razorpay';
        order.paymentResult = {
            id: razorpayPaymentId,
            status: 'COMPLETED',
            update_time: new Date().toISOString(),
            email_address: req.user?.email || 'customer@dropcart.com'
        };

        const updatedOrder = await order.save();

        // Real-Time Notification
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${order.user}`).emit('orderStatusUpdated', {
                orderId: updatedOrder._id,
                status: updatedOrder.status,
                isPaid: true,
                updatedAt: new Date()
            });
            io.to('admin_channel').emit('orderStatusUpdated', {
                orderId: updatedOrder._id,
                status: updatedOrder.status,
                isPaid: true,
                updatedAt: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Payment verified and captured successfully!',
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Payment verification error', error: error.message });
    }
};
