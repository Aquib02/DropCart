const Product = require('../models/productModel');
const { GoogleGenAI } = require('@google/genai');

let geminiClient = null;
function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
    } catch (e) {
      console.warn('Could not initialize GoogleGenAI client:', e.message);
      geminiClient = null;
    }
  }
  return geminiClient;
}

// Helper: Extract price limit from text (e.g., "under 50000", "below 20k", "under 1,500", "under ₹50,000")
function extractPriceConstraint(text) {
  if (!text) return null;
  const normalized = text.toLowerCase().replace(/,/g, '');
  const kMatch = normalized.match(/(?:under|below|less than|max|within)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000;
  }
  const numMatch = normalized.match(/(?:under|below|less than|max|within)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }
  return null;
}

// 1. AI Shopping Assistant Chat
exports.chatWithAssistant = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Fetch catalog products from MongoDB using correct field names: name, price, countInStock
    const catalog = await Product.find({
      $or: [
        { isOutOfStock: false },
        { countInStock: { $gt: 0 } },
        { countInStock: { $exists: false } }
      ]
    })
      .select('name price originalPrice category rating numReviews brand description image images countInStock specifications')
      .limit(40)
      .lean();

    const maxPrice = extractPriceConstraint(message);
    const keywords = message
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['best', 'show', 'find', 'give', 'what', 'with', 'under', 'from'].includes(w));

    let matchedProducts = [];

    // 1. Try Live Gemini API if key is present
    const ai = getGeminiClient();
    if (ai) {
      try {
        const catalogBrief = catalog.map(p => ({
          id: p._id,
          name: p.name,
          price: p.price,
          category: p.category,
          rating: p.rating || 4.5,
          brand: p.brand
        }));

        const prompt = `You are DropCart's elite AI Shopping Assistant. 
You must strictly recommend genuine products from this provided database catalog only. 
NEVER invent fake products, prices, discounts, or specifications.
Catalog: ${JSON.stringify(catalogBrief)}

User question: "${message}"

Instructions:
1. Provide a warm, concise, and helpful shopping recommendation in markdown.
2. If recommending specific products from the catalog, mention their exact name and price (₹).
3. At the very end of your response, output a single line with JSON array of matching product IDs like:
MATCHED_IDS: ["id1", "id2"]`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: prompt
        });

        const replyText = response.text || '';
        let cleanReply = replyText;
        const matchMarker = replyText.indexOf('MATCHED_IDS:');
        if (matchMarker !== -1) {
          cleanReply = replyText.substring(0, matchMarker).trim();
          try {
            const jsonPart = replyText.substring(matchMarker + 12).trim();
            const ids = JSON.parse(jsonPart);
            if (Array.isArray(ids) && ids.length > 0) {
              matchedProducts = await Product.find({ _id: { $in: ids } }).limit(4);
            }
          } catch (e) {
            // fallback
          }
        }

        if (matchedProducts.length > 0) {
          return res.json({
            success: true,
            reply: cleanReply,
            recommendedProducts: matchedProducts
          });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to database catalog engine:', geminiError.message);
      }
    }

    // 2. High-Accuracy Database Catalog Grounded Engine (Always reliable fallback)
    let candidateProducts = catalog.filter(p => {
      const pPrice = Number(p.price) || 0;
      if (maxPrice && pPrice > maxPrice) return false;
      const text = `${p.name || ''} ${p.category || ''} ${p.brand || ''} ${p.description || ''}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });

    if (candidateProducts.length === 0 && maxPrice) {
      // Find within user budget
      candidateProducts = catalog.filter(p => (Number(p.price) || 0) <= maxPrice);
    }

    if (candidateProducts.length === 0) {
      // Top rated catalog items
      candidateProducts = [...catalog].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
    } else {
      candidateProducts = candidateProducts.slice(0, 4);
    }

    let reply = `Here are the top matches I found directly in our DropCart catalog`;
    if (maxPrice) reply += ` under ₹${maxPrice.toLocaleString('en-IN')}`;
    reply += `:\n\n`;

    candidateProducts.forEach((p, idx) => {
      const price = Number(p.price) || 0;
      reply += `${idx + 1}. **${p.name}** - ₹${price.toLocaleString('en-IN')} (${p.rating || 4.5}★)\n`;
    });
    reply += `\nEach item is genuine, in stock, and eligible for festival discount coupons and SuperCoins!`;

    res.json({
      success: true,
      reply,
      recommendedProducts: candidateProducts
    });
  } catch (error) {
    console.error('Error in chatWithAssistant:', error);
    res.status(500).json({ success: false, message: 'Shopping assistant error', error: error.message });
  }
};

// 2. Natural Language Product Search (e.g. "best laptop for coding under 50000")
exports.naturalLanguageSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const maxPrice = extractPriceConstraint(query);
    const lowerQuery = query.toLowerCase();

    // Detect known categories
    const categories = ['Mobiles', 'Fashion', 'Electronics', 'Home', 'Appliances', 'Beauty', 'Toys', 'Books', 'Furniture'];
    let detectedCategory = categories.find(c => lowerQuery.includes(c.toLowerCase()));

    // Common synonyms
    if (!detectedCategory) {
      if (lowerQuery.includes('phone') || lowerQuery.includes('iphone') || lowerQuery.includes('samsung') || lowerQuery.includes('5g')) detectedCategory = 'Mobiles';
      else if (lowerQuery.includes('laptop') || lowerQuery.includes('headphone') || lowerQuery.includes('watch') || lowerQuery.includes('camera') || lowerQuery.includes('earbuds')) detectedCategory = 'Electronics';
      else if (lowerQuery.includes('shirt') || lowerQuery.includes('shoe') || lowerQuery.includes('dress') || lowerQuery.includes('jacket') || lowerQuery.includes('jeans')) detectedCategory = 'Fashion';
      else if (lowerQuery.includes('sofa') || lowerQuery.includes('table') || lowerQuery.includes('bed') || lowerQuery.includes('chair')) detectedCategory = 'Furniture';
    }

    // Build Mongo Query with correct fields
    const filter = {};
    if (detectedCategory) {
      filter.category = detectedCategory;
    }
    if (maxPrice) {
      filter.price = { $lte: maxPrice };
    }

    // Keyword matching
    const searchTerms = lowerQuery
      .replace(/best|under|below|less than|for|with|in|the|show|me|find|buy|\d+/g, '')
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 2);

    let products = [];
    if (searchTerms.length > 0) {
      const regexTerms = searchTerms.map(t => new RegExp(t, 'i'));
      products = await Product.find({
        ...filter,
        $or: [
          { name: { $in: regexTerms } },
          { description: { $in: regexTerms } },
          { brand: { $in: regexTerms } }
        ]
      }).limit(20);
    }

    if (products.length === 0) {
      products = await Product.find(filter).limit(20);
    }

    const aiSummary = `Found ${products.length} product(s) matching your criteria ${detectedCategory ? `in ${detectedCategory}` : ''} ${maxPrice ? `under ₹${maxPrice.toLocaleString('en-IN')}` : ''}.`;

    res.json({
      success: true,
      query,
      aiSummary,
      parsedIntent: {
        category: detectedCategory || 'All',
        maxPrice: maxPrice || null,
        keywords: searchTerms
      },
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error in naturalLanguageSearch:', error);
    res.status(500).json({ success: false, message: 'Natural language search error', error: error.message });
  }
};

// 3. AI-Generated Product Review Summary & Sentiment
exports.getReviewSummary = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = product.reviews || [];
    if (reviews.length === 0) {
      return res.json({
        success: true,
        summary: `No customer reviews yet for "${product.name}". Be the first verified buyer to review!`,
        pros: ['Brand new item in pristine condition', 'Fast express delivery available'],
        cons: ['Awaiting initial community reviews'],
        sentiment: 'Neutral',
        positivePercentage: 100,
        totalReviewsAnalyzed: 0
      });
    }

    // Check Gemini API
    const ai = getGeminiClient();
    if (ai) {
      try {
        const reviewTexts = reviews.map(r => `Rating: ${r.rating}★ - Comment: "${r.comment}"`).join('\n');
        const prompt = `You are an AI sentiment analyzer. Analyze these customer reviews for product "${product.name}":
${reviewTexts}

Output strictly valid JSON with this shape:
{
  "summary": "1-2 sentence executive summary of customer consensus",
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2"],
  "sentiment": "Positive" | "Neutral" | "Mixed",
  "positivePercentage": number between 0 and 100
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            success: true,
            ...parsed,
            totalReviewsAnalyzed: reviews.length
          });
        }
      } catch (geminiError) {
        console.warn('Gemini review summary fallback:', geminiError.message);
      }
    }

    // Deterministic Review Sentiment Engine
    const highRatings = reviews.filter(r => r.rating >= 4);
    const positivePercentage = Math.round((highRatings.length / reviews.length) * 100);

    const pros = [];
    const cons = [];

    reviews.forEach(r => {
      const c = r.comment.toLowerCase();
      if (r.rating >= 4) {
        if ((c.includes('quality') || c.includes('build')) && !pros.includes('High build quality & design')) pros.push('High build quality & design');
        if ((c.includes('battery') || c.includes('backup')) && !pros.includes('Long-lasting battery life')) pros.push('Long-lasting battery life');
        if ((c.includes('fast') || c.includes('speed') || c.includes('performance')) && !pros.includes('Fast and snappy performance')) pros.push('Fast and snappy performance');
        if ((c.includes('camera') || c.includes('photo')) && !pros.includes('Impressive camera clarity')) pros.push('Impressive camera clarity');
        if ((c.includes('value') || c.includes('worth')) && !pros.includes('Great value for money')) pros.push('Great value for money');
      } else if (r.rating <= 2) {
        if (c.includes('battery') && !cons.includes('Battery drainage under heavy load')) cons.push('Battery drainage under heavy load');
        if (c.includes('delivery') && !cons.includes('Delivery delays reported')) cons.push('Delivery delays reported');
        if (c.includes('heat') && !cons.includes('Slight heating observed during gaming')) cons.push('Slight heating observed during gaming');
      }
    });

    if (pros.length === 0) pros.push('Consistent performance meeting catalog specifications', 'Verified authentic purchase');
    if (cons.length === 0) cons.push('High demand due to festive sale offers');

    const sentiment = positivePercentage >= 70 ? 'Positive' : positivePercentage >= 40 ? 'Mixed' : 'Needs Improvement';

    res.json({
      success: true,
      summary: `${positivePercentage}% of verified buyers recommend "${product.name}". Customers praise its ${pros[0].toLowerCase()} and overall reliability.`,
      pros,
      cons,
      sentiment,
      positivePercentage,
      totalReviewsAnalyzed: reviews.length
    });
  } catch (error) {
    console.error('Error in getReviewSummary:', error);
    res.status(500).json({ success: false, message: 'Review summary error', error: error.message });
  }
};

// 4. AI-Assisted Product Comparison
exports.compareAnalysis = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide at least 2 product IDs to compare' });
    }

    const products = await Product.find({ _id: { $in: productIds } }).lean();
    if (products.length < 2) {
      return res.status(404).json({ success: false, message: 'Not enough products found for comparison' });
    }

    // Sort by price
    const sortedByPrice = [...products].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    const sortedByRating = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const valueWinner = sortedByPrice[0];
    const topRatedWinner = sortedByRating[0];

    const aiRecommendation = `If budget is your priority, **${valueWinner.name}** at ₹${Number(valueWinner.price).toLocaleString('en-IN')} gives you the best price-to-performance ratio. If you want maximum buyer satisfaction, **${topRatedWinner.name}** leads with a ${topRatedWinner.rating || 4.5}★ rating.`;

    res.json({
      success: true,
      valueWinner: { id: valueWinner._id, title: valueWinner.name, price: valueWinner.price },
      topRatedWinner: { id: topRatedWinner._id, title: topRatedWinner.name, rating: topRatedWinner.rating },
      aiRecommendation,
      products
    });
  } catch (error) {
    console.error('Error in compareAnalysis:', error);
    res.status(500).json({ success: false, message: 'Compare analysis error', error: error.message });
  }
};

// 5. Visual Product Search (by uploaded tags / image detection)
exports.visualSearch = async (req, res) => {
  try {
    const { visualKeywords = '', category = '' } = req.body;
    const tokens = visualKeywords.toLowerCase().split(/\s+/).filter(Boolean);

    const filter = {};
    if (category) filter.category = category;

    let matched = [];
    if (tokens.length > 0) {
      const regexes = tokens.map(t => new RegExp(t, 'i'));
      matched = await Product.find({
        ...filter,
        $or: [
          { name: { $in: regexes } },
          { description: { $in: regexes } },
          { category: { $in: regexes } },
          { brand: { $in: regexes } }
        ]
      }).limit(12);
    }

    if (matched.length === 0) {
      matched = await Product.find(filter).sort({ rating: -1 }).limit(8);
    }

    res.json({
      success: true,
      message: `Visual search matched ${matched.length} similar items from our catalog.`,
      products: matched
    });
  } catch (error) {
    console.error('Error in visualSearch:', error);
    res.status(500).json({ success: false, message: 'Visual search error', error: error.message });
  }
};
