const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables reliably from backend directory & current working dir
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const connectDB = require('./config/db.js');
const authRoutes = require('./routes/authRoutes.js');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes.js');
const settingsRoutes = require('./routes/settingsRoutes.js');
const couponRoutes = require('./routes/couponRoutes.js');
const priceAlertRoutes = require('./routes/priceAlertRoutes.js');

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// Mount API routes
app.use('/api/users', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/alerts', priceAlertRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'DropCart Enterprise API is running...' });
});

// 404 Route Handler
app.use((req, res, next) => {
    res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running at: ${PORT}`);
});
