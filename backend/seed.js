const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const User = require('./models/userModel');
const Product = require('./models/productModel');
const Order = require('./models/orderModel');
const StoreSettings = require('./models/storeSettingsModel');
const Coupon = require('./models/couponModel');

dotenv.config();

// 24 Detailed Flipkart-style Products
const dummyProducts = [
    // --- MOBILES ---
    {
        name: 'SAMSUNG Galaxy F70e 5G (Starlight Blue, 128 GB)',
        brand: 'Samsung',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        description: '6.7 inch Super AMOLED Display, 50MP OIS Dual Camera, 6000mAh Battery with 25W Fast Charging.',
        category: 'Mobiles',
        price: 15999,
        originalPrice: 21999,
        discountPercent: 27,
        countInStock: 25,
        rating: 4.4,
        numReviews: 2450,
        isFeatured: true,
        tag: 'Big Bang Deal',
    },
    {
        name: 'Apple iPhone 15 (Black, 128 GB)',
        brand: 'Apple',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
        description: 'Dynamic Island, 48MP Main Camera with 2x Telephoto, All-day battery life, and Durable color-infused glass.',
        category: 'Mobiles',
        price: 65999,
        originalPrice: 79900,
        discountPercent: 17,
        countInStock: 18,
        rating: 4.8,
        numReviews: 8900,
        isFeatured: true,
        tag: 'Bestseller',
    },
    {
        name: 'Mivi One 5G Smartphone (Glacier Mint, 128 GB)',
        brand: 'Mivi',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
        description: 'Next-gen 5G connectivity, 120Hz Ultra Smooth Display, 50MP AI Portrait Camera, and sleek frosted finish.',
        category: 'Mobiles',
        price: 11999,
        originalPrice: 16999,
        discountPercent: 29,
        countInStock: 35,
        rating: 4.2,
        numReviews: 1120,
        isFeatured: true,
        tag: 'Trending Now',
    },
    {
        name: 'OnePlus Nord CE 4 5G (Dark Chrome, 256 GB)',
        brand: 'OnePlus',
        image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
        description: 'Snapdragon 7 Gen 3, 100W SUPERVOOC Fast Charging, 5500 mAh battery, and Sony LYT-600 Camera sensor.',
        category: 'Mobiles',
        price: 24999,
        originalPrice: 28999,
        discountPercent: 13,
        countInStock: 14,
        rating: 4.5,
        numReviews: 3410,
        isFeatured: true,
        tag: 'Top Rated',
    },

    // --- ELECTRONICS & LAPTOPS ---
    {
        name: 'Acer Swift Neo AI Intel Core Ultra 5 Thin & Light Laptop',
        brand: 'Acer',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
        description: 'Intel Core Ultra 5 AI processor, 16GB LPDDR5X RAM, 512GB SSD, 14 inch 2.8K OLED Display with Intel Arc graphics.',
        category: 'Electronics',
        price: 47990,
        originalPrice: 68990,
        discountPercent: 30,
        countInStock: 12,
        rating: 4.6,
        numReviews: 412,
        isFeatured: true,
        tag: 'AI Powered',
    },
    {
        name: 'Sony WH-1000XM5 Wireless Active Noise Canceling Headphones',
        brand: 'Sony',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        description: 'Industry-leading noise cancellation with two processors and 8 microphones, 30 hours battery, ultra-clear hands-free calls.',
        category: 'Electronics',
        price: 26990,
        originalPrice: 34990,
        discountPercent: 22,
        countInStock: 20,
        rating: 4.9,
        numReviews: 1850,
        isFeatured: true,
        tag: 'Premium Audio',
    },
    {
        name: 'boAt Airdopes 141 Bluetooth TWS Earbuds with 42H Playtime',
        brand: 'boAt',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
        description: 'ENx environmental noise cancellation technology, ASAP fast charge, IPX4 sweat resistance, Beast mode for gaming.',
        category: 'Electronics',
        price: 1299,
        originalPrice: 4490,
        discountPercent: 71,
        countInStock: 50,
        rating: 4.3,
        numReviews: 14200,
        isFeatured: false,
        tag: 'Mega Deal',
    },
    {
        name: 'Fire-Boltt Smart Fitness Watch with Bluetooth Calling & SpO2',
        brand: 'Fire-Boltt',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        description: '1.83 inch HD full touch display, 120+ sports modes, voice assistant support, and comprehensive sleep/heart monitoring.',
        category: 'Electronics',
        price: 1899,
        originalPrice: 5999,
        discountPercent: 68,
        countInStock: 30,
        rating: 4.4,
        numReviews: 5310,
        isFeatured: true,
        tag: 'Top Pick',
    },

    // --- HOME & LIVING ---
    {
        name: 'Monte Carlo Soft Warm Microfiber Double Bed Blanket (Floral Navy)',
        brand: 'Monte Carlo',
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
        description: 'Heavy winter reversible mink blanket with ultra-soft plush feel, hypo-allergenic microfiber, and winter durability.',
        category: 'Home',
        price: 1699,
        originalPrice: 4299,
        discountPercent: 60,
        countInStock: 22,
        rating: 4.7,
        numReviews: 3120,
        isFeatured: true,
        tag: 'Up to 60% Off',
    },
    {
        name: 'Signature Geometric Embossed Queen Quilt Comforter',
        brand: 'Signature',
        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
        description: 'Lightweight microfiber quilt designed for AC and mild winters, machine washable, breathability certified.',
        category: 'Home',
        price: 1299,
        originalPrice: 2999,
        discountPercent: 56,
        countInStock: 19,
        rating: 4.5,
        numReviews: 980,
        isFeatured: false,
        tag: 'Winter Special',
    },
    {
        name: 'Solimo 100% Pure Cotton 144 TC Double Bed Sheet with 2 Pillow Covers',
        brand: 'Solimo',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
        description: 'Breathable, fade-resistant color fastness, soft cotton fabric that provides year-round comfortable sleep.',
        category: 'Home',
        price: 699,
        originalPrice: 1499,
        discountPercent: 53,
        countInStock: 40,
        rating: 4.3,
        numReviews: 4500,
        isFeatured: false,
        tag: 'Everyday Essential',
    },

    // --- FASHION ---
    {
        name: "Puma Unisex-Adult Flyer Flex Running Shoes (Black & White)",
        brand: 'Puma',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        description: 'Breathable mesh upper with bold PUMA branding, flexible EVA midsole cushioning, and rubber outsole grip.',
        category: 'Fashion',
        price: 2299,
        originalPrice: 4999,
        discountPercent: 54,
        countInStock: 28,
        rating: 4.6,
        numReviews: 6150,
        isFeatured: true,
        tag: 'Bestseller',
    },
    {
        name: "Clarks Men's Tilden Walk Handcrafted Genuine Leather Formal Derby Shoes",
        brand: 'Clarks',
        image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80',
        description: 'Handcrafted premium burnished dark brown leather dress shoes featuring discreet elastic gore panels, cushioned OrthoLite insole, and flexible non-slip TPR outsole. Perfect for formal and business wear.',
        category: 'Fashion',
        price: 3499,
        originalPrice: 6999,
        discountPercent: 50,
        countInStock: 22,
        rating: 4.7,
        numReviews: 1420,
        isFeatured: true,
        tag: 'Trending Footwear',
    },
    {
        name: "Bata Men's Classic Oxford Lace-Up Formal Leather Shoes (Deep Brown)",
        brand: 'Bata',
        image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80',
        description: 'Sophisticated toe-cap oxford dress shoes crafted with polished genuine leather upper, breathable lining, and lightweight comfort cushioning.',
        category: 'Fashion',
        price: 1999,
        originalPrice: 3999,
        discountPercent: 50,
        countInStock: 30,
        rating: 4.6,
        numReviews: 2890,
        isFeatured: true,
        tag: 'Bestseller',
    },
    {
        name: "Red Tape Men's Handcrafted Leather Penny Loafers (Burgundy Brown)",
        brand: 'Red Tape',
        image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80',
        description: 'Easy slip-on dress loafers made from rich supple leather with refined moc-toe stitching and memory foam padded insole.',
        category: 'Fashion',
        price: 2299,
        originalPrice: 4999,
        discountPercent: 54,
        countInStock: 19,
        rating: 4.5,
        numReviews: 950,
        isFeatured: false,
        tag: 'Top Pick',
    },
    {
        name: "Nike Air Max Excee Running & Streetwear Shoes (White & Black)",
        brand: 'Nike',
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
        description: 'Iconic Air cushioning unit with mixed mesh and leather overlays, delivering all-day bounce and modern street style.',
        category: 'Fashion',
        price: 4995,
        originalPrice: 7995,
        discountPercent: 37,
        countInStock: 15,
        rating: 4.8,
        numReviews: 4500,
        isFeatured: true,
        tag: 'Top Rated',
    },
    {
        name: "Men's Premium Washed Denim Jacket with Dual Flap Pockets",
        brand: 'Roadster',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
        description: '100% Cotton durable rigid denim with metal buttons, spread collar, and tailored classic street style fit.',
        category: 'Fashion',
        price: 1499,
        originalPrice: 3499,
        discountPercent: 57,
        countInStock: 16,
        rating: 4.5,
        numReviews: 1280,
        isFeatured: false,
        tag: 'Trending Style',
    },
    {
        name: 'Handcrafted Genuine Leather Everyday Laptop Backpack',
        brand: 'Wildcraft',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
        description: 'Padded laptop sleeve for 15.6 inch laptops, brass buckles, water-resistant exterior, and reinforced shoulder straps.',
        category: 'Fashion',
        price: 1899,
        originalPrice: 4599,
        discountPercent: 58,
        countInStock: 14,
        rating: 4.8,
        numReviews: 890,
        isFeatured: true,
        tag: 'Top Pick',
    },

    // --- APPLIANCES ---
    {
        name: 'Philips Digital Air Fryer with Rapid Air Tech (4.1 Litre)',
        brand: 'Philips',
        image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80',
        description: 'Cook with up to 90% less fat. Fry, bake, grill, and reheat with convenient digital touchscreen preset menus.',
        category: 'Appliances',
        price: 6499,
        originalPrice: 11995,
        discountPercent: 45,
        countInStock: 15,
        rating: 4.7,
        numReviews: 2980,
        isFeatured: true,
        tag: 'Kitchen Essential',
    },
    {
        name: 'Bajaj Rex 750W Mixer Grinder with 3 Stainless Steel Jars',
        brand: 'Bajaj',
        image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80',
        description: 'Heavy duty 750 Watt copper motor with multi-function blade system and overload protection indicator.',
        category: 'Appliances',
        price: 3299,
        originalPrice: 5850,
        discountPercent: 43,
        countInStock: 25,
        rating: 4.4,
        numReviews: 5400,
        isFeatured: false,
        tag: 'Trusted Choice',
    },

    // --- BEAUTY ---
    {
        name: 'Minimalist 10% Niacinamide Face Serum with Zinc (30 ml)',
        brand: 'Minimalist',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
        description: 'Nourishing daily serum to fade dark spots, balance excess sebum, and strengthen the natural skin barrier.',
        category: 'Beauty',
        price: 599,
        originalPrice: 699,
        discountPercent: 14,
        countInStock: 45,
        rating: 4.6,
        numReviews: 7600,
        isFeatured: false,
        tag: 'Skincare Favorite',
    },

    // --- SPORTS & FITNESS ---
    {
        name: 'Boldfit 20kg Rubber Coated Home Workout Dumbbell Set',
        brand: 'Boldfit',
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
        description: 'Durable anti-roll rubber coated weight plates with solid steel connecting rods and foam padded barbell connector.',
        category: 'Sports & Fitness',
        price: 1899,
        originalPrice: 4999,
        discountPercent: 62,
        countInStock: 20,
        rating: 4.5,
        numReviews: 1840,
        isFeatured: true,
        tag: 'Fitness Deal',
    },

    // --- FURNITURE ---
    {
        name: 'Green Soul Ergonomic High-Back Executive Office Chair',
        brand: 'Green Soul',
        image: 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?w=800&q=80',
        description: 'Breathable dual-mesh backrest, 2D adjustable armrests, pneumatic seat height adjustment, and heavy-duty nylon base.',
        category: 'Furniture',
        price: 7999,
        originalPrice: 14990,
        discountPercent: 46,
        countInStock: 10,
        rating: 4.8,
        numReviews: 2150,
        isFeatured: true,
        tag: 'Work from Home',
    },

    // --- BOOKS ---
    {
        name: 'Atomic Habits: Tiny Changes, Remarkable Results by James Clear',
        brand: 'Penguin',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
        description: 'The definitive guide to breaking bad habits and building good ones with actionable psychological frameworks.',
        category: 'Books',
        price: 499,
        originalPrice: 799,
        discountPercent: 37,
        countInStock: 60,
        rating: 4.9,
        numReviews: 21000,
        isFeatured: false,
        tag: '#1 Bestseller',
    },
];

// Promotional Banners (Matching Flipkart Style in User Screenshot)
const promotionalBanners = [
    {
        badge: 'BIG BANG DIWALI',
        title: 'Acer Swift Neo AI PCs',
        subtitle: 'From ₹47,000* | Up to Intel Core Ultra 5 | 16/512 GB',
        priceText: 'From ₹47,000*',
        bankOffer: 'SBI Card 10% Instant Discount on Debit & Credit Cards',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
        bgGradient: 'from-red-600 via-orange-600 to-amber-600',
        link: '/shop?category=Electronics',
    },
    {
        badge: 'BIG BANG FESTIVE',
        title: 'Blankets & Quilts Up to 60% Off',
        subtitle: 'Monte Carlo, Signature & More Winter Essentials',
        priceText: 'Starting ₹1,299*',
        bankOffer: 'HDFC & SBI Bank 10% Instant Discount',
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
        bgGradient: 'from-amber-600 via-orange-500 to-yellow-600',
        link: '/shop?category=Home',
    },
    {
        badge: 'EXCLUSIVE LAUNCH',
        title: 'SAMSUNG Galaxy F70e 5G',
        subtitle: '6000mAh Battery | 50MP OIS Camera | Super AMOLED',
        priceText: 'From ₹15,999*',
        bankOffer: 'Get ₹1,500 Additional Bank & Exchange Bonus',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        bgGradient: 'from-sky-700 via-blue-600 to-cyan-600',
        link: '/shop?category=Mobiles',
    },
    {
        badge: 'FESTIVE SPECIAL',
        title: 'Mivi One 5G Smartphone',
        subtitle: '120Hz Ultra Display & Frosted Back Design',
        priceText: 'From ₹11,999*',
        bankOffer: 'Instant No Cost EMI Available on All Cards',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
        bgGradient: 'from-emerald-700 via-teal-600 to-emerald-800',
        link: '/shop?category=Mobiles',
    },
];

const seedCompleteDatabase = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://Aquib:Aquib0786@cluster0.t2qut1m.mongodb.net/Ecommerce?appName=Cluster0';
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
        console.log('Connected to MongoDB database.');

        // 1. CLEAR PREVIOUS DATA
        console.log('Purging existing collections for clean seed...');
        await Promise.all([
            User.deleteMany({}),
            Product.deleteMany({}),
            Order.deleteMany({}),
            StoreSettings.deleteMany({}),
            Coupon.deleteMany({}),
        ]);
        console.log('Collections purged.');

        // 2. CREATE USERS
        console.log('Creating Admin, Staff, and Customer users...');
        const salt = await bcrypt.genSalt(10);
        const adminPasswordHash = await bcrypt.hash('adminpassword123', salt);
        const staffPasswordHash = await bcrypt.hash('staff123', salt);
        const customerPasswordHash = await bcrypt.hash('aquib123', salt);

        // Admin User
        const adminUser = await User.create({
            name: 'System Admin',
            email: 'admin@dropcart.com',
            password: adminPasswordHash,
            role: 'admin',
            isAdmin: true,
            permissions: ['manage_products', 'manage_orders', 'manage_appearance', 'manage_staff'],
            coins: 500,
            deliveryCity: 'Mumbai',
            deliveryPincode: '400001',
        });

        // Staff 1: Inventory Manager
        const staff1 = await User.create({
            name: 'Rahul Sharma',
            email: 'rahul.staff@dropcart.com',
            password: staffPasswordHash,
            role: 'staff',
            isAdmin: false,
            permissions: ['manage_products', 'manage_orders'],
            coins: 100,
        });

        // Customer: Aquib (Customer persona from screenshot)
        const customerAquib = await User.create({
            name: 'Aquib',
            email: 'aquib@gmail.com',
            password: customerPasswordHash,
            role: 'customer',
            isAdmin: false,
            coins: 120, // matches coin balance
            deliveryCity: 'Bengaluru',
            deliveryPincode: '560001',
            address: 'Flat 402, Prestige Tower, MG Road',
            city: 'Bengaluru',
            postalCode: '560001',
            country: 'India',
            phone: '+91 9876543210',
        });

        console.log('Users created:');
        console.log('  👑 Admin:     admin@dropcart.com (Password: adminpassword123)');
        console.log('  🛡️ Staff:     rahul.staff@dropcart.com (Password: staff123)');
        console.log('  👤 Customer:  aquib@gmail.com (Password: aquib123)');

        // 3. CREATE PRODUCTS WITH VERIFIED REVIEWS, SPECIFICATIONS, AND VARIANTS
        console.log('Seeding products with customer reviews, specifications & variants...');
        const createdProducts = [];
        for (const item of dummyProducts) {
            const reviews = [
                {
                    user: customerAquib._id,
                    name: customerAquib.name,
                    rating: 5,
                    comment: 'Super fast delivery and fantastic build quality! 100% recommended.',
                    createdAt: new Date(Date.now() - 3 * 86400000),
                },
                {
                    user: staff1._id,
                    name: 'Verified Buyer',
                    rating: 4,
                    comment: 'Works exactly as described. Genuine product with proper manufacturer warranty card.',
                    createdAt: new Date(Date.now() - 7 * 86400000),
                },
            ];

            // Multi-image gallery for zoom showcase
            const images = [
                item.image,
                item.image.includes('unsplash.com') ? `${item.image}&rot=90` : item.image,
                item.image.includes('unsplash.com') ? `${item.image}&sat=50` : item.image,
            ];

            // Category-based realistic variants
            let variants = [];
            if (item.category === 'Mobiles') {
                variants = [
                    { name: 'Storage', options: ['128 GB', '256 GB'], priceDelta: 0 },
                    { name: 'Color', options: ['Starlight Blue', 'Midnight Black'], priceDelta: 0 },
                ];
            } else if (item.category === 'Electronics') {
                variants = [
                    { name: 'Color', options: ['Matte Black', 'Silver Grey'], priceDelta: 0 },
                ];
            } else if (item.category === 'Fashion') {
                variants = [
                    { name: 'Size', options: ['S', 'M', 'L', 'XL'], priceDelta: 0 },
                    { name: 'Color', options: ['Navy Blue', 'Classic Black'], priceDelta: 0 },
                ];
            } else if (item.category === 'Home') {
                variants = [
                    { name: 'Size', options: ['Single Bed', 'Double Bed (Queen)'], priceDelta: 0 },
                ];
            }

            // Structured technical specifications
            const specifications = [
                {
                    groupName: 'General',
                    items: [
                        { key: 'Brand', value: item.brand || 'DropCart' },
                        { key: 'Model Name', value: item.name },
                        { key: 'Category', value: item.category },
                        { key: 'Warranty', value: '1 Year Manufacturer Brand Warranty' },
                    ],
                },
                {
                    groupName: 'Specifications & Features',
                    items: [
                        { key: 'Highlights', value: item.description },
                        { key: 'In The Box', value: '1 Main Unit, Accessories, Quick Start Guide, Warranty Card' },
                        { key: 'Country of Origin', value: 'India' },
                    ],
                },
            ];

            const prod = await Product.create({
                ...item,
                images,
                variants,
                specifications,
                views: Math.floor(Math.random() * 250) + 50,
                reviews,
            });
            createdProducts.push(prod);
        }
        console.log(`Created ${createdProducts.length} rich catalog products across categories.`);

        // Seed Active Coupons
        console.log('Seeding active promotional coupons...');
        await Coupon.create([
            {
                code: 'DIWALI10',
                description: 'Extra 10% OFF on all orders above ₹999 (Max ₹1,000)',
                discountType: 'percentage',
                discountAmount: 10,
                minPurchase: 999,
                maxDiscount: 1000,
                expiryDate: new Date(Date.now() + 60 * 86400000),
                usageLimit: 5000,
                isActive: true,
            },
            {
                code: 'FESTIVE500',
                description: 'Flat ₹500 Instant Discount on orders above ₹2,999',
                discountType: 'fixed',
                discountAmount: 500,
                minPurchase: 2999,
                expiryDate: new Date(Date.now() + 45 * 86400000),
                usageLimit: 2000,
                isActive: true,
            },
            {
                code: 'WELCOME100',
                description: 'Flat ₹100 Welcome OFF on cart value above ₹499',
                discountType: 'fixed',
                discountAmount: 100,
                minPurchase: 499,
                expiryDate: new Date(Date.now() + 90 * 86400000),
                usageLimit: 10000,
                isActive: true,
            },
            {
                code: 'FLAT200',
                description: 'Flat ₹200 OFF on orders above ₹1,499',
                discountType: 'fixed',
                discountAmount: 200,
                minPurchase: 1499,
                expiryDate: new Date(Date.now() + 30 * 86400000),
                usageLimit: 1500,
                isActive: true,
            },
        ]);
        console.log('Coupons seeded: DIWALI10, FESTIVE500, WELCOME100, FLAT200.');

        // Add 2 items to Aquib's wishlist
        customerAquib.wishlist = [createdProducts[0]._id, createdProducts[8]._id];
        await customerAquib.save();

        // 4. CREATE PAST AND ACTIVE ORDERS (For Order Tracker & Admin Hub testing)
        console.log('Creating diverse orders with live tracking stages...');

        // Order 1: Delivered
        await Order.create({
            user: customerAquib._id,
            orderItems: [
                {
                    name: createdProducts[1].name,
                    qty: 1,
                    image: createdProducts[1].image,
                    price: createdProducts[1].price,
                    product: createdProducts[1]._id,
                },
            ],
            shippingAddress: {
                address: 'Flat 402, Prestige Tower, MG Road',
                city: 'Bengaluru',
                postalCode: '560001',
                country: 'India',
            },
            paymentMethod: 'Online',
            totalPrice: createdProducts[1].price,
            isPaid: true,
            paidAt: new Date(Date.now() - 5 * 86400000),
            status: 'Delivered',
            deliveredAt: new Date(Date.now() - 1 * 86400000),
            createdAt: new Date(Date.now() - 5 * 86400000),
        });

        // Order 2: Out for Delivery / Shipped
        await Order.create({
            user: customerAquib._id,
            orderItems: [
                {
                    name: createdProducts[8].name,
                    qty: 1,
                    image: createdProducts[8].image,
                    price: createdProducts[8].price,
                    product: createdProducts[8]._id,
                },
                {
                    name: createdProducts[11].name,
                    qty: 1,
                    image: createdProducts[11].image,
                    price: createdProducts[11].price,
                    product: createdProducts[11]._id,
                },
            ],
            shippingAddress: {
                address: 'Flat 402, Prestige Tower, MG Road',
                city: 'Bengaluru',
                postalCode: '560001',
                country: 'India',
            },
            paymentMethod: 'COD',
            totalPrice: createdProducts[8].price + createdProducts[11].price,
            isPaid: false,
            status: 'Shipped',
            createdAt: new Date(Date.now() - 2 * 86400000),
        });

        // Order 3: Processing
        await Order.create({
            user: customerAquib._id,
            orderItems: [
                {
                    name: createdProducts[0].name,
                    qty: 1,
                    image: createdProducts[0].image,
                    price: createdProducts[0].price,
                    product: createdProducts[0]._id,
                },
            ],
            shippingAddress: {
                address: 'Flat 402, Prestige Tower, MG Road',
                city: 'Bengaluru',
                postalCode: '560001',
                country: 'India',
            },
            paymentMethod: 'Online',
            totalPrice: createdProducts[0].price,
            isPaid: true,
            paidAt: new Date(Date.now() - 12 * 3600000),
            status: 'Processing',
            createdAt: new Date(Date.now() - 12 * 3600000),
        });

        // Order 4: Pending (Admin can test status update)
        await Order.create({
            user: customerAquib._id,
            orderItems: [
                {
                    name: createdProducts[4].name,
                    qty: 1,
                    image: createdProducts[4].image,
                    price: createdProducts[4].price,
                    product: createdProducts[4]._id,
                },
            ],
            shippingAddress: {
                address: 'Sector 62, Commercial Hub',
                city: 'Noida',
                postalCode: '201301',
                country: 'India',
            },
            paymentMethod: 'COD',
            totalPrice: createdProducts[4].price,
            isPaid: false,
            status: 'Pending',
            createdAt: new Date(),
        });

        console.log('4 Orders created covering Pending, Processing, Shipped, and Delivered stages.');

        // 5. CREATE FLIPKART STYLE STOREFRONT SETTINGS
        console.log('Initializing promotional carousel banners...');
        await StoreSettings.create({
            announcement: '🔥 BIG BANG SALE LIVE: Extra 10% Instant Discount on SBI & HDFC Bank Cards | Free Delivery on All Orders!',
            bannerActive: true,
            heroTitle: 'India’s Biggest Festive Sale is Live',
            heroSubtitle: 'Unbeatable deals on AI Laptops, 5G Smartphones, Winter Mink Blankets, and Trending Fashion.',
            heroBadge: 'Big Bang Diwali 2026',
            themeColor: 'orange',
            banners: promotionalBanners,
        });

        console.log('\n===============================================');
        console.log('🎉 FULL FLIPKART-GRADE DATABASE SEEDING COMPLETE!');
        console.log('===============================================\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed with error:', err.message);
        process.exit(1);
    }
};

seedCompleteDatabase();
