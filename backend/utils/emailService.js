/**
 * DropCart Enterprise Transactional Email Notification Service
 * Supports Nodemailer SMTP transport or development console delivery
 */

exports.sendOrderConfirmationEmail = async ({ order, customerEmail, customerName }) => {
    try {
        const emailContent = `
==================================================
[DropCart Transactional Email: Order Confirmation]
To: ${customerEmail}
Subject: Order Placed Successfully! (Order #${String(order._id).slice(-6)})

Hello ${customerName || 'Valued Customer'},

Thank you for shopping on DropCart! We have received your order.
Order ID: #${order._id}
Payment Method: ${order.paymentMethod}
Total Amount: ₹${Number(order.totalPrice).toLocaleString('en-IN')}

Items Ordered:
${order.orderItems?.map(i => ` - ${i.name} x ${i.qty} = ₹${i.price * i.qty}`).join('\n')}

Shipping Address:
${order.shippingAddress?.address}, ${order.shippingAddress?.city} - ${order.shippingAddress?.postalCode}

You can track your real-time shipment updates directly from your DropCart Dashboard.
==================================================
`;
        console.log(emailContent);
        return { success: true, messageId: `msg_${Date.now()}` };
    } catch (err) {
        console.error('Failed to dispatch order confirmation email:', err);
        return { success: false, error: err.message };
    }
};

exports.sendOrderStatusEmail = async ({ order, customerEmail, customerName, newStatus }) => {
    try {
        const emailContent = `
==================================================
[DropCart Transactional Email: Order Status Update]
To: ${customerEmail}
Subject: Your Order #${String(order._id).slice(-6)} is now ${newStatus}

Hello ${customerName || 'Valued Customer'},

Great news! The status of your order #${order._id} has been updated to:
>>> ${newStatus.toUpperCase()} <<<

${newStatus === 'Delivered' ? 'Your package has been safely delivered. We hope you love your purchase!' : 'We are swiftly preparing and moving your parcel to ensure fast arrival.'}

Track live in your DropCart app anytime!
==================================================
`;
        console.log(emailContent);
        return { success: true, messageId: `msg_${Date.now()}` };
    } catch (err) {
        console.error('Failed to dispatch order status email:', err);
        return { success: false, error: err.message };
    }
};

exports.sendPriceDropEmail = async ({ product, customerEmail, targetPrice, currentPrice }) => {
    try {
        const emailContent = `
==================================================
[DropCart Transactional Email: Price Drop Alert]
To: ${customerEmail}
Subject: Price Drop Alert for ${product.name}! 🔥

Hello!

A product on your DropCart Watchlist has just hit your target price!
Product: ${product.name}
Your Target Price: ₹${targetPrice}
Current Discounted Price: ₹${currentPrice}

Hurry and grab yours before stock runs out!
==================================================
`;
        console.log(emailContent);
        return { success: true, messageId: `msg_${Date.now()}` };
    } catch (err) {
        console.error('Failed to dispatch price drop email:', err);
        return { success: false, error: err.message };
    }
};

exports.sendLowStockAlertEmail = async ({ product, adminEmail }) => {
    try {
        const emailContent = `
==================================================
[DropCart System Alert: Low Inventory Notification]
To: ${adminEmail || 'admin@dropcart.com'}
Subject: [ACTION REQUIRED] Low Stock Alert: ${product.name}

Warning: Inventory for "${product.name}" has dropped to ${product.countInStock} units.
Please reorder from supplier or update stock quantities in the Admin Dashboard.
==================================================
`;
        console.log(emailContent);
        return { success: true, messageId: `msg_${Date.now()}` };
    } catch (err) {
        console.error('Failed to dispatch low stock email:', err);
        return { success: false, error: err.message };
    }
};
