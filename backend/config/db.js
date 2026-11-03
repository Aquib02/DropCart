const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dropcart';

    try {
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error(`💡 Tip: If using local MongoDB, ensure MongoDB is running (e.g. 'mongod' or MongoDB Compass).`);
        console.error(`💡 Tip: If using MongoDB Atlas (cloud), verify your MONGO_URI in 'backend/.env'.`);
        process.exit(1);
    }
};

module.exports = connectDB;
