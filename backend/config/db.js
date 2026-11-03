const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://Aquib:Aquib0786@cluster0.t2qut1m.mongodb.net/Ecommerce?appName=Cluster0';

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
