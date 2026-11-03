const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI Chat Assistant
router.post('/chat', aiController.chatWithAssistant);

// Natural Language Search
router.post('/nl-search', aiController.naturalLanguageSearch);

// AI Review Summary & Sentiment
router.get('/review-summary/:productId', aiController.getReviewSummary);

// AI-Assisted Product Comparison Analysis
router.post('/compare-analysis', aiController.compareAnalysis);

// Visual Product Search
router.post('/visual-search', aiController.visualSearch);

module.exports = router;
