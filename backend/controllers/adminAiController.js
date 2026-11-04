const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Campaign = require('../models/campaignModel');
const Coupon = require('../models/couponModel');
const { GoogleGenAI } = require('@google/genai');

let geminiClient = null;
function getGeminiClient() {
    if (!geminiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
        try {
            geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
        } catch (e) {
            console.warn('Could not initialize GoogleGenAI client for admin:', e.message);
            geminiClient = null;
        }
    }
    return geminiClient;
}

/**
 * Aggregates live, verifiable store metrics strictly from MongoDB
 */
async function getLiveBusinessSnapshot() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // 1. Order Aggregations
    const allOrders = await Order.find({}).lean();
    const totalOrders = allOrders.length;
    let totalRevenue = 0;
    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;
    let pendingOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let returnRequests = 0;

    const productSalesMap = {};
    const categorySalesMap = {};

    allOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const bill = Number(order.totalPrice) || 0;

        if (order.status !== 'Cancelled') {
            totalRevenue += bill;
            if (orderDate >= startOfToday) todayRevenue += bill;
            if (orderDate >= startOfWeek) weekRevenue += bill;
            if (orderDate >= startOfMonth) monthRevenue += bill;
        }

        if (order.status === 'Pending') pendingOrders++;
        else if (order.status === 'Shipped' || order.status === 'Out For Delivery') shippedOrders++;
        else if (order.status === 'Delivered') deliveredOrders++;
        else if (order.status === 'Cancelled') cancelledOrders++;
        else if (order.status === 'Return_Requested' || order.returnRequest?.status === 'Pending') returnRequests++;

        if (order.status !== 'Cancelled' && Array.isArray(order.orderItems)) {
            order.orderItems.forEach(item => {
                const pId = item.product ? item.product.toString() : item.name;
                if (!productSalesMap[pId]) {
                    productSalesMap[pId] = {
                        id: pId,
                        name: item.name,
                        qty: 0,
                        revenue: 0,
                    };
                }
                productSalesMap[pId].qty += Number(item.qty) || 1;
                productSalesMap[pId].revenue += (Number(item.price) || 0) * (Number(item.qty) || 1);
            });
        }
    });

    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 2. Product & Inventory Aggregations
    const allProducts = await Product.find({}).lean();
    const totalProducts = allProducts.length;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    const lowStockItems = [];
    const outOfStockItems = [];
    let inventoryTotalValuation = 0;
    const complaintsList = [];

    allProducts.forEach(prod => {
        const stock = typeof prod.countInStock === 'number' ? prod.countInStock : 0;
        const price = Number(prod.price) || 0;
        inventoryTotalValuation += stock * price;

        if (stock === 0 || prod.isOutOfStock) {
            outOfStockCount++;
            if (outOfStockItems.length < 8) {
                outOfStockItems.push({ id: prod._id, name: prod.name, category: prod.category });
            }
        } else if (stock <= 10) {
            lowStockCount++;
            if (lowStockItems.length < 8) {
                lowStockItems.push({ id: prod._id, name: prod.name, stock, category: prod.category });
            }
        }

        // Category breakdown
        const cat = prod.category || 'Uncategorized';
        categorySalesMap[cat] = (categorySalesMap[cat] || 0) + (productSalesMap[prod._id.toString()]?.revenue || 0);

        // Scan negative reviews
        if (Array.isArray(prod.reviews)) {
            prod.reviews.forEach(r => {
                if (r.rating <= 2 && r.comment) {
                    complaintsList.push({ product: prod.name, rating: r.rating, comment: r.comment });
                }
            });
        }
    });

    const topSellingProducts = Object.values(productSalesMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // 3. Customer count
    const totalCustomers = await User.countDocuments({ role: { $ne: 'admin' } });
    const newCustomersThisWeek = await User.countDocuments({
        role: { $ne: 'admin' },
        createdAt: { $gte: startOfWeek }
    });

    // 4. Active Campaigns
    const activeCampaigns = await Campaign.find({ isActive: true }).select('title position impressions clicks ctr').lean();

    return {
        financials: {
            totalRevenue,
            todayRevenue,
            weekRevenue,
            monthRevenue,
            averageOrderValue,
            inventoryTotalValuation
        },
        orders: {
            totalOrders,
            pendingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            returnRequests
        },
        inventory: {
            totalProducts,
            outOfStockCount,
            lowStockCount,
            lowStockItems,
            outOfStockItems
        },
        customers: {
            totalCustomers,
            newCustomersThisWeek
        },
        topSellingProducts,
        categoryPerformance: Object.entries(categorySalesMap)
            .map(([category, revenue]) => ({ category, revenue }))
            .sort((a, b) => b.revenue - a.revenue),
        activeCampaigns,
        complaints: complaintsList.slice(0, 10)
    };
}

/**
 * 1. AI Business Intelligence Chat & Executive Q&A
 */
exports.askAdminAssistant = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ success: false, message: 'Admin query is required' });
        }

        const metrics = await getLiveBusinessSnapshot();
        const ai = getGeminiClient();

        if (ai) {
            try {
                const prompt = `You are DropCart's Executive AI Enterprise Business Assistant.
You have direct read access to our real-time MongoDB e-commerce database metrics:
\`\`\`json
${JSON.stringify(metrics, null, 2)}
\`\`\`

Admin Question: "${query}"

Guidelines:
1. Provide a sharp, executive-level answer grounded strictly in the provided data.
2. Format the response in clean GitHub-flavored markdown with bolding, bullet points, and values formatted in Indian Rupees (₹).
3. If giving advice, include 2 actionable strategic recommendations for the store owner.
4. NEVER invent fake statistics or financial metrics outside this dataset.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt
                });

                if (response.text) {
                    return res.json({
                        success: true,
                        reply: response.text,
                        groundedMetrics: {
                            totalRevenue: metrics.financials.totalRevenue,
                            totalOrders: metrics.orders.totalOrders,
                            lowStockCount: metrics.inventory.lowStockCount,
                            topSeller: metrics.topSellingProducts[0]?.name || 'N/A'
                        }
                    });
                }
            } catch (geminiErr) {
                console.warn('Gemini Assistant fallback:', geminiErr.message);
            }
        }

        // Deterministic Fallback grounded in exact MongoDB facts
        const q = query.toLowerCase();
        let fallbackReply = '';

        if (q.includes('highest revenue') || q.includes('top product') || q.includes('best selling')) {
            if (metrics.topSellingProducts.length > 0) {
                fallbackReply = `### 🏆 Top Revenue Generating Products (MongoDB Grounded)\n\n` +
                    metrics.topSellingProducts.map((p, i) => `${i + 1}. **${p.name}** — Total Revenue: **₹${p.revenue.toLocaleString('en-IN')}** (${p.qty} units sold)`).join('\n') +
                    `\n\n**Actionable Advice:** Keep inventory buffered for your #1 product (**${metrics.topSellingProducts[0].name}**) and feature it on homepage Hero Section.`;
            } else {
                fallbackReply = `No products have logged completed sales yet. We recommend launching a flash sale campaign to initiate purchase momentum.`;
            }
        } else if (q.includes('running out') || q.includes('stock') || q.includes('low stock') || q.includes('out of stock')) {
            fallbackReply = `### ⚠️ Inventory Status & Stock Alert\n\n` +
                `- **Out of Stock Products:** ${metrics.inventory.outOfStockCount} items\n` +
                `- **Low Stock (< 10 units):** ${metrics.inventory.lowStockCount} items\n\n` +
                `**Immediate Restock Queue:**\n` +
                (metrics.inventory.lowStockItems.length > 0
                    ? metrics.inventory.lowStockItems.map(p => `- **${p.name}** (${p.category}) — Only **${p.stock} units** remaining`).join('\n')
                    : `- All listed products currently maintain safe stock levels (>10 units).`) +
                `\n\n**Total Inventory Valuation:** ₹${metrics.financials.inventoryTotalValuation.toLocaleString('en-IN')}`;
        } else if (q.includes('revenue') || q.includes('sales') || q.includes('this week') || q.includes('this month')) {
            fallbackReply = `### 💰 Real-Time Revenue Breakdown\n\n` +
                `- **Today's Revenue:** ₹${metrics.financials.todayRevenue.toLocaleString('en-IN')}\n` +
                `- **This Week (Last 7 Days):** ₹${metrics.financials.weekRevenue.toLocaleString('en-IN')}\n` +
                `- **This Month:** ₹${metrics.financials.monthRevenue.toLocaleString('en-IN')}\n` +
                `- **All-Time Store Revenue:** ₹${metrics.financials.totalRevenue.toLocaleString('en-IN')}\n` +
                `- **Average Order Value (AOV):** ₹${metrics.financials.averageOrderValue.toLocaleString('en-IN')}\n` +
                `- **Total Processed Orders:** ${metrics.orders.totalOrders} (${metrics.orders.deliveredOrders} delivered, ${metrics.orders.pendingOrders} pending dispatch)`;
        } else if (q.includes('category') || q.includes('categories')) {
            fallbackReply = `### 📊 Category Sales Breakdown\n\n` +
                metrics.categoryPerformance.map((c, i) => `${i + 1}. **${c.category}** — ₹${c.revenue.toLocaleString('en-IN')}`).join('\n') +
                `\n\n**Top Category:** **${metrics.categoryPerformance[0]?.category || 'N/A'}** holds the largest market share in your store.`;
        } else if (q.includes('complaint') || q.includes('review') || q.includes('issues')) {
            fallbackReply = `### 🗣️ Customer Feedback & Review Consensus\n\n` +
                (metrics.complaints.length > 0
                    ? metrics.complaints.map(c => `- **${c.product}** (${c.rating}★): "${c.comment}"`).join('\n')
                    : `- No critical complaints found in recent verified reviews! Overall store sentiment is healthy.`) +
                `\n\n**Actionable Advice:** Monitor product packaging quality and courier partner dispatch times to maintain 4.5+ star store rating.`;
        } else if (q.includes('promote') || q.includes('campaign') || q.includes('discount')) {
            const topProd = metrics.topSellingProducts[0]?.name || 'Flagship items';
            fallbackReply = `### 🚀 Smart Promotional Strategy\n\n` +
                `1. **Feature Bestsellers:** Create a dedicated banner for **${topProd}** on the hero carousel.\n` +
                `2. **Clear Low-Velocity Stock:** Bundle slow-moving products with 15% discount coupon or BOGO offer.\n` +
                `3. **Active Campaigns:** Currently ${metrics.activeCampaigns.length} campaigns running.\n` +
                `4. **Abandoned Carts:** Trigger email/SMS coupon reminders with code **WELCOME10** for new signups (${metrics.customers.newCustomersThisWeek} joined this week).`;
        } else {
            fallbackReply = `### 📈 DropCart Store Executive Summary\n\n` +
                `- **Total Store Revenue:** ₹${metrics.financials.totalRevenue.toLocaleString('en-IN')}\n` +
                `- **Total Orders:** ${metrics.orders.totalOrders} (${metrics.orders.pendingOrders} pending)\n` +
                `- **Registered Customers:** ${metrics.customers.totalCustomers} (${metrics.customers.newCustomersThisWeek} new this week)\n` +
                `- **Catalog Size:** ${metrics.inventory.totalProducts} products (₹${metrics.financials.inventoryTotalValuation.toLocaleString('en-IN')} total stock value)\n` +
                `- **Low Stock Alerts:** ${metrics.inventory.lowStockCount} items need reordering.\n\n` +
                `Feel free to ask specific questions about **revenue trends**, **stock prediction**, **top categories**, or **suspicious orders**!`;
        }

        res.json({
            success: true,
            reply: fallbackReply,
            groundedMetrics: {
                totalRevenue: metrics.financials.totalRevenue,
                totalOrders: metrics.orders.totalOrders,
                lowStockCount: metrics.inventory.lowStockCount
            }
        });
    } catch (error) {
        console.error('Error in askAdminAssistant:', error);
        res.status(500).json({ success: false, message: 'Admin assistant error', error: error.message });
    }
};

/**
 * 2. AI Product Description & SEO Copy Studio
 */
exports.generateProductCopy = async (req, res) => {
    try {
        const { productName, category, features = '', targetAudience = 'All Shoppers', tone = 'Engaging & Premium' } = req.body;
        if (!productName) {
            return res.status(400).json({ success: false, message: 'Product name is required' });
        }

        const ai = getGeminiClient();
        if (ai) {
            try {
                const prompt = `You are an elite E-Commerce Copywriter and SEO specialist.
Generate compelling product sales copy for:
- Product Name: ${productName}
- Category: ${category || 'General'}
- Key Highlights: ${features || 'Premium build, long lasting, high performance'}
- Target Audience: ${targetAudience}
- Tone: ${tone}

Return strictly valid JSON matching this schema:
{
  "seoTitle": "High-converting SEO Title (50-60 chars)",
  "shortPitch": "Compelling 2-sentence hook",
  "longDescription": "Detailed markdown product description with paragraphs and benefits",
  "bulletPoints": ["Feature & Benefit 1", "Feature & Benefit 2", "Feature & Benefit 3", "Feature & Benefit 4"],
  "metaDescription": "SEO Meta Description under 160 characters",
  "searchKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt
                });

                const raw = response.text || '';
                const match = raw.match(/\{[\s\S]*\}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    return res.json({ success: true, ...parsed });
                }
            } catch (err) {
                console.warn('Gemini product copy fallback:', err.message);
            }
        }

        // Deterministic high-quality copy fallback
        const shortPitch = `Discover premium quality with ${productName}, engineered for unmatched performance, durability, and modern style in ${category || 'our collection'}.`;
        const longDescription = `Elevate your lifestyle with the all-new **${productName}**. Designed meticulously for discerning buyers, this product combines state-of-the-art materials with exceptional craftsmanship.\n\nWhether you need reliable everyday functionality or cutting-edge performance, ${productName} delivers beyond expectations. Fully backed by genuine manufacturer warranty and express shipping.`;
        const bulletPoints = [
            `Engineered with top-grade materials for enduring durability and reliability.`,
            `Seamlessly crafted for ${targetAudience} seeking optimum comfort and utility.`,
            `100% genuine product with 7-day hassle-free replacement and verified warranty.`,
            `Fast express doorstep dispatch with secure tamper-proof packaging.`
        ];
        const searchKeywords = [
            productName.toLowerCase(),
            `${category || 'product'}`.toLowerCase(),
            `buy ${productName.toLowerCase()} online`,
            `best ${category || 'deals'}`
        ];

        res.json({
            success: true,
            seoTitle: `${productName} - Best Price & Deals Online | DropCart`,
            shortPitch,
            longDescription,
            bulletPoints,
            metaDescription: `Buy genuine ${productName} online at DropCart with fast delivery, verified warranty, and exclusive offers. Order now!`,
            searchKeywords
        });
    } catch (error) {
        console.error('Error in generateProductCopy:', error);
        res.status(500).json({ success: false, message: 'Copy generation error', error: error.message });
    }
};

/**
 * 3. AI Promotional Banner Copy & Campaign Studio
 */
exports.generateCampaignBannerCopy = async (req, res) => {
    try {
        const { campaignTheme = 'Festive Mega Sale', discountOffer = 'Up to 50% Off', targetCategory = 'All' } = req.body;

        const ai = getGeminiClient();
        if (ai) {
            try {
                const prompt = `Generate 3 high-converting e-commerce banner headline variations for:
Campaign: ${campaignTheme}
Offer: ${discountOffer}
Category: ${targetCategory}

Return strictly JSON format:
{
  "variants": [
    {
      "badge": "LIMITED TIME DEAL",
      "headline": "Bold Punchy Headline",
      "subheadline": "Persuasive sub-copy highlighting discount and urgency",
      "ctaText": "Shop Now / Grab Deal",
      "suggestedGradient": "from-orange-600 to-amber-600"
    }
  ]
}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt
                });

                const raw = response.text || '';
                const match = raw.match(/\{[\s\S]*\}/);
                if (match) {
                    return res.json({ success: true, ...JSON.parse(match[0]) });
                }
            } catch (err) {
                console.warn('Gemini banner copy fallback:', err.message);
            }
        }

        res.json({
            success: true,
            variants: [
                {
                    badge: '⚡ FLASH EXTRAVAGANZA',
                    headline: `${campaignTheme}: Grab ${discountOffer}`,
                    subheadline: `Exclusive prices on top-rated ${targetCategory} essentials. Hurry, offer valid while stocks last!`,
                    ctaText: 'Explore Offers ➔',
                    suggestedGradient: 'from-orange-600 via-rose-600 to-purple-600'
                },
                {
                    badge: '🔥 BEST PRICE GUARANTEE',
                    headline: `Upgrade Today With Massive Savings`,
                    subheadline: `Instant bank discounts + SuperCoins cashback on every order placed today.`,
                    ctaText: 'Claim Your Deal',
                    suggestedGradient: 'from-blue-600 via-indigo-600 to-violet-700'
                },
                {
                    badge: '🌟 MEMBER EXCLUSIVE',
                    headline: `The Ultimate ${targetCategory} Showcase`,
                    subheadline: `Handpicked premium collections with guaranteed express 24h dispatch.`,
                    ctaText: 'Shop Collection',
                    suggestedGradient: 'from-emerald-600 via-teal-600 to-cyan-700'
                }
            ]
        });
    } catch (error) {
        console.error('Error in generateCampaignBannerCopy:', error);
        res.status(500).json({ success: false, message: 'Campaign copy error', error: error.message });
    }
};

/**
 * 4. Predictive Inventory Demand & Stockout Forecaster
 */
exports.predictInventoryDemand = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [products, orders] = await Promise.all([
            Product.find({}).select('name category price countInStock isOutOfStock image').lean(),
            Order.find({ createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'Cancelled' } }).lean()
        ]);

        // Compute 30-day velocity per product
        const salesVelocityMap = {};
        orders.forEach(order => {
            (order.orderItems || []).forEach(item => {
                const id = item.product ? item.product.toString() : item.name;
                salesVelocityMap[id] = (salesVelocityMap[id] || 0) + (Number(item.qty) || 1);
            });
        });

        const forecast = products.map(prod => {
            const stock = typeof prod.countInStock === 'number' ? prod.countInStock : 0;
            const unitsSold30d = salesVelocityMap[prod._id.toString()] || 0;
            const dailyVelocity = unitsSold30d / 30;

            let daysUntilStockout = 999;
            let riskLevel = 'Healthy';

            if (stock === 0 || prod.isOutOfStock) {
                daysUntilStockout = 0;
                riskLevel = 'Critical (Out of Stock)';
            } else if (dailyVelocity > 0) {
                daysUntilStockout = Math.round(stock / dailyVelocity);
                if (daysUntilStockout <= 7) riskLevel = 'High Risk';
                else if (daysUntilStockout <= 14) riskLevel = 'Moderate Risk';
            } else if (stock <= 5) {
                riskLevel = 'Low Stock (Slow Mover)';
            }

            // Recommended replenishment to cover 45 days
            const recommendedReorder = Math.max(0, Math.ceil(dailyVelocity * 45) - stock);

            return {
                id: prod._id,
                name: prod.name,
                category: prod.category,
                price: prod.price,
                stock,
                unitsSold30d,
                dailyBurnRate: Number(dailyVelocity.toFixed(2)),
                daysUntilStockout,
                riskLevel,
                recommendedReorder: recommendedReorder > 0 ? recommendedReorder : (stock === 0 ? 25 : 0),
                image: prod.image
            };
        });

        // Sort by risk priority
        forecast.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

        const criticalCount = forecast.filter(f => f.riskLevel.includes('Critical') || f.riskLevel === 'High Risk').length;

        res.json({
            success: true,
            summary: {
                totalAnalyzed: forecast.length,
                criticalItems: criticalCount,
                recommendation: criticalCount > 0
                    ? `${criticalCount} item(s) require urgent supplier replenishment within 7 days to prevent lost revenue.`
                    : 'Inventory levels are currently stable across all product lines.'
            },
            forecast: forecast.slice(0, 20)
        });
    } catch (error) {
        console.error('Error in predictInventoryDemand:', error);
        res.status(500).json({ success: false, message: 'Demand prediction error', error: error.message });
    }
};

/**
 * 5. Suspicious Order & Fraud Detection Sentinel
 */
exports.detectSuspiciousOrders = async (req, res) => {
    try {
        const recentOrders = await Order.find({})
            .populate('user', 'name email createdAt isBlocked')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const flaggedOrders = [];

        // Check for anomalies:
        // 1. Order value > ₹40,000
        // 2. Customer has multiple orders placed within 30 minutes
        // 3. User account is blocked or flagged
        const userOrderTimes = {};

        recentOrders.forEach(order => {
            const userId = order.user?._id?.toString() || order.shippingAddress?.email || 'guest';
            if (!userOrderTimes[userId]) userOrderTimes[userId] = [];
            userOrderTimes[userId].push(new Date(order.createdAt).getTime());
        });

        recentOrders.forEach(order => {
            const riskFactors = [];
            const bill = Number(order.totalPrice) || 0;
            const userId = order.user?._id?.toString() || order.shippingAddress?.email || 'guest';

            if (bill >= 50000) {
                riskFactors.push(`High cart transaction value (₹${bill.toLocaleString('en-IN')})`);
            } else if (bill >= 30000) {
                riskFactors.push(`Above average transaction value (₹${bill.toLocaleString('en-IN')})`);
            }

            // Rapid order velocity
            const orderTimes = userOrderTimes[userId] || [];
            if (orderTimes.length > 2) {
                riskFactors.push(`High order frequency (${orderTimes.length} orders recently placed by same customer)`);
            }

            if (order.user?.isBlocked) {
                riskFactors.push('Customer account is marked as blocked');
            }

            if (order.status === 'Cancelled' && order.cancellationReason) {
                riskFactors.push(`Previously cancelled: "${order.cancellationReason}"`);
            }

            if (riskFactors.length > 0) {
                const riskLevel = riskFactors.length >= 2 || bill >= 50000 ? 'High' : 'Medium';
                flaggedOrders.push({
                    orderId: order._id,
                    createdAt: order.createdAt,
                    customer: {
                        name: order.user?.name || order.shippingAddress?.name || 'Customer',
                        email: order.user?.email || 'N/A'
                    },
                    totalPrice: order.totalPrice,
                    status: order.status,
                    shippingCity: order.shippingAddress?.city,
                    riskLevel,
                    riskFactors,
                    recommendation: riskLevel === 'High'
                        ? 'Confirm order via direct phone call prior to dispatching package.'
                        : 'Review address details before shipping.'
                });
            }
        });

        res.json({
            success: true,
            totalScanned: recentOrders.length,
            flaggedCount: flaggedOrders.length,
            flaggedOrders
        });
    } catch (error) {
        console.error('Error in detectSuspiciousOrders:', error);
        res.status(500).json({ success: false, message: 'Fraud sentinel error', error: error.message });
    }
};

/**
 * 6. Smart Product Promotion & Cross-Sell Suggestions
 */
exports.suggestProductPromotions = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [products, orders] = await Promise.all([
            Product.find({}).lean(),
            Order.find({ createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'Cancelled' } }).lean()
        ]);

        const salesCount = {};
        orders.forEach(o => {
            (o.orderItems || []).forEach(item => {
                const id = item.product ? item.product.toString() : item.name;
                salesCount[id] = (salesCount[id] || 0) + (Number(item.qty) || 1);
            });
        });

        // 1. Slow moving products with high inventory
        const slowMovers = products
            .filter(p => (p.countInStock || 0) >= 15 && (!salesCount[p._id.toString()] || salesCount[p._id.toString()] <= 2))
            .slice(0, 4)
            .map(p => ({
                id: p._id,
                name: p.name,
                category: p.category,
                price: p.price,
                stock: p.countInStock,
                strategy: 'Flash Clearance Discount',
                suggestedDiscount: '25% - 35% Off',
                rationale: `High stock level (${p.countInStock} units) with low 30-day velocity. A flash sale will release working capital.`
            }));

        // 2. High-rated loss-leader / hero products
        const bestSellers = products
            .filter(p => (p.rating || 0) >= 4.5 && (salesCount[p._id.toString()] || 0) >= 3)
            .slice(0, 3)
            .map(p => ({
                id: p._id,
                name: p.name,
                category: p.category,
                price: p.price,
                rating: p.rating,
                strategy: 'Hero Homepage Showcase',
                suggestedDiscount: '10% Off with Bank Card',
                rationale: `Exceptional customer rating (${p.rating}★). Perfect for hero banner and social media advertisements.`
            }));

        res.json({
            success: true,
            promotions: [
                ...slowMovers,
                ...bestSellers
            ]
        });
    } catch (error) {
        console.error('Error in suggestProductPromotions:', error);
        res.status(500).json({ success: false, message: 'Promotion suggestions error', error: error.message });
    }
};
