const PriceAlert = require('../models/priceAlertModel');
const Product = require('../models/productModel');

// @desc    Create price drop alert
// @route   POST /api/alerts/price-drop
// @access  Public (or protected if logged in)
const createPriceAlert = async (req, res) => {
    try {
        const { productId, email, targetPrice } = req.body;

        if (!productId || !email || !targetPrice) {
            return res.status(400).json({ message: 'Product, email, and target price are required.' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const numericTarget = Number(targetPrice);
        if (numericTarget >= product.price) {
            return res.status(400).json({
                message: `Target price must be lower than the current price of ₹${product.price.toLocaleString('en-IN')}.`,
            });
        }

        // Check for existing active alert for this email and product
        const existingAlert = await PriceAlert.findOne({
            product: productId,
            email: email.trim().toLowerCase(),
            isActive: true,
            isTriggered: false,
        });

        if (existingAlert) {
            existingAlert.targetPrice = numericTarget;
            await existingAlert.save();
            return res.json({
                success: true,
                message: `Price drop alert updated! We'll email ${email} as soon as this item drops to ₹${numericTarget.toLocaleString('en-IN')}.`,
            });
        }

        await PriceAlert.create({
            user: req.user ? req.user._id : null,
            email: email.trim().toLowerCase(),
            product: productId,
            targetPrice: numericTarget,
            currentPriceAtCreation: product.price,
        });

        res.status(201).json({
            success: true,
            message: `Price drop alert created! We'll email ${email} when the price drops to ₹${numericTarget.toLocaleString('en-IN')}.`,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPriceAlert,
};
