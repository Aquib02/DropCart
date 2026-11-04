const path = require('path');
const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

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
const aiRoutes = require('./routes/aiRoutes.js');
const paymentRoutes = require('./routes/paymentRoutes.js');
const campaignRoutes = require('./routes/campaignRoutes.js');
const homepageLayoutRoutes = require('./routes/homepageLayoutRoutes.js');
const inventoryRoutes = require('./routes/inventoryRoutes.js');
const customerRoutes = require('./routes/customerRoutes.js');
const adminAiRoutes = require('./routes/adminAiRoutes.js');
const swaggerDoc = require('./docs/swaggerDoc.js');

connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO for Real-Time Order Tracking & Alerts
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

// Attach io instance to express app
app.set('io', io);

io.on('connection', (socket) => {
    // Client connects
    socket.on('join_user', (userId) => {
        if (userId) socket.join(`user_${userId}`);
    });

    socket.on('join_admin', () => {
        socket.join('admin_channel');
    });

    socket.on('disconnect', () => {
        // Disconnected cleanly
    });
});

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// General API Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per 15 min window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Mount API routes
app.use('/api/users', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/alerts', priceAlertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/homepage-layout', homepageLayoutRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin-ai', adminAiRoutes);
app.use('/api/docs', swaggerDoc);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'active',
        message: 'DropCart Enterprise AI E-Commerce API is running...',
        version: '2.0.0',
        docs: '/api/docs',
        realtime: 'Socket.IO active'
    });
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

server.listen(PORT, () => {
    console.log(`DropCart Enterprise Server is running at: ${PORT}`);
});
