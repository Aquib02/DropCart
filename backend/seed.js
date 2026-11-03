const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');
const Product = require('./models/productModel');
const StoreSettings = require('./models/storeSettingsModel');

dotenv.config();

const sampleProducts = [
    {
        name: 'Wireless Noise Canceling Headphones',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        description: 'Immersive sound with industry-leading active noise canceling and 30-hour battery life.',
        category: 'Electronics',
        price: 2999,
        countInStock: 25,
        rating: 4.8,
        numReviews: 12,
    },
    {
        name: 'Smart Fitness Tracker Watch',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        description: 'Track your heart rate, sleep metrics, daily workouts, and receive instant phone notifications.',
        category: 'Electronics',
        price: 1899,
        countInStock: 15,
        rating: 4.6,
        numReviews: 8,
    },
    {
        name: 'Premium Leather Everyday Backpack',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
        description: 'Handcrafted durable leather with dedicated padded 15-inch laptop compartment and weather resistance.',
        category: 'Fashion',
        price: 1499,
        countInStock: 10,
        rating: 4.9,
        numReviews: 15,
    },
    {
        name: 'RGB Mechanical Gaming Keyboard',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
        description: 'Tactile mechanical switches, customizable per-key RGB backlighting, and aluminum frame.',
        category: 'Electronics',
        price: 2199,
        countInStock: 8,
        rating: 4.7,
        numReviews: 9,
    },
    {
        name: 'Classic Minimalist Chrono Watch',
        image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
        description: 'Ultra-thin Japanese quartz movement with sapphire crystal glass and genuine leather strap.',
        category: 'Fashion',
        price: 3499,
        countInStock: 12,
        rating: 5.0,
        numReviews: 6,
    },
    {
        name: 'Ergonomic Memory Foam Travel Pillow',
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
        description: 'High-density memory foam providing 360-degree neck support for long travels and desk comfort.',
        category: 'Home & Living',
        price: 799,
        countInStock: 30,
        rating: 4.5,
        numReviews: 14,
    },
];

const seedData = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dropcart';
        console.log(`Connecting to MongoDB at: ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB.');

        // 1. Create or ensure Default Admin
        const adminEmail = 'admin@dropcart.com';
        const adminPassword = 'adminpassword123';

        let adminUser = await User.findOne({ email: adminEmail });
        if (!adminUser) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            adminUser = await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isAdmin: true,
                permissions: ['manage_products', 'manage_orders', 'manage_appearance', 'manage_staff'],
            });
            console.log(`\n👑 Admin Account Created:`);
            console.log(`   Email:    ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        } else {
            console.log(`\n👑 Admin Account already exists:`);
            console.log(`   Email:    ${adminEmail}`);
        }

        // 2. Insert sample products if empty
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(sampleProducts);
            console.log(`📦 Seeded ${sampleProducts.length} sample products into catalog.`);
        } else {
            console.log(`📦 Catalog already contains ${count} products.`);
        }

        // 3. Ensure store appearance settings exist
        const settingsCount = await StoreSettings.countDocuments();
        if (settingsCount === 0) {
            await StoreSettings.create({});
            console.log(`🎨 Default storefront settings initialized.`);
        }

        console.log('\n✅ Database seeding completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedData();
