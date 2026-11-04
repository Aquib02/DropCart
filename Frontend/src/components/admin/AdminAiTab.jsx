import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Sparkles,
    Bot,
    Send,
    TrendingUp,
    AlertTriangle,
    ShoppingBag,
    DollarSign,
    Layers,
    ShieldAlert,
    Copy,
    Check,
    RefreshCw,
    FileText,
    Lightbulb,
    Percent,
    ArrowRight,
    Clock,
    Search,
    Loader2,
    Sliders,
    Zap,
    ExternalLink,
    ChevronRight,
    Megaphone
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminAiTab = ({ userToken }) => {
    // Sub-modules: 'chat' | 'copywriter' | 'campaigns' | 'inventory_demand' | 'fraud_sentinel' | 'promotions'
    const [activeSubTab, setActiveSubTab] = useState('chat');

    // Chat Assistant State
    const [chatMessages, setChatMessages] = useState([
        {
            role: 'assistant',
            content: `👋 Hello! I am your **DropCart Enterprise AI Assistant**, powered by Google Gemini and directly grounded in your live MongoDB store database.\n\nYou can ask me about **revenue trends**, **stockout risks**, **top-selling products**, **customer complaints**, or **fraudulent orders**. How can I help you today?`,
            groundedMetrics: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputQuery, setInputQuery] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const chatEndRef = useRef(null);

    // Copywriter Studio State
    const [copyForm, setCopyForm] = useState({
        productName: '',
        category: 'Electronics',
        features: 'Fast performance, premium metallic casing, all-day battery life',
        targetAudience: 'Tech enthusiasts & professionals',
        tone: 'Premium & High-Converting'
    });
    const [generatedCopy, setGeneratedCopy] = useState(null);
    const [copyLoading, setCopyLoading] = useState(false);
    const [copyCopied, setCopyCopied] = useState(false);

    // Banner Campaign Studio State
    const [bannerForm, setBannerForm] = useState({
        campaignTheme: 'Diwali Mega Festive Sale 2026',
        discountOffer: 'Up to 60% Off + Extra 10% Bank Discount',
        targetCategory: 'Mobiles & Electronics'
    });
    const [bannerVariants, setBannerVariants] = useState([]);
    const [bannerLoading, setBannerLoading] = useState(false);

    // Predictive Demand State
    const [demandForecast, setDemandForecast] = useState([]);
    const [demandSummary, setDemandSummary] = useState(null);
    const [demandLoading, setDemandLoading] = useState(false);

    // Fraud Sentinel State
    const [flaggedOrders, setFlaggedOrders] = useState([]);
    const [fraudSummary, setFraudSummary] = useState({ totalScanned: 0, flaggedCount: 0 });
    const [fraudLoading, setFraudLoading] = useState(false);

    // Promotion Strategist State
    const [promotions, setPromotions] = useState([]);
    const [promotionsLoading, setPromotionsLoading] = useState(false);

    // Scroll chat to bottom
    useEffect(() => {
        if (activeSubTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeSubTab]);

    // Send Admin AI Chat Message
    const handleSendMessage = async (queryToSend) => {
        const query = queryToSend || inputQuery;
        if (!query.trim() || chatLoading) return;

        const userMsg = {
            role: 'user',
            content: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, userMsg]);
        setInputQuery('');
        setChatLoading(true);

        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/admin-ai/ask`,
                { query },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            if (res.data.success) {
                const aiMsg = {
                    role: 'assistant',
                    content: res.data.reply,
                    groundedMetrics: res.data.groundedMetrics,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setChatMessages(prev => [...prev, aiMsg]);
            }
        } catch (err) {
            setChatMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: `⚠️ Failed to fetch insights: ${err.response?.data?.message || err.message}. Please check your connection.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setChatLoading(false);
        }
    };

    // Copy Text to Clipboard
    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // 2. Generate Product Copy
    const handleGenerateCopy = async (e) => {
        e?.preventDefault();
        if (!copyForm.productName.trim() || copyLoading) return;
        setCopyLoading(true);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/admin-ai/product-copy`,
                copyForm,
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            if (res.data.success) {
                setGeneratedCopy(res.data);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error generating copy');
        } finally {
            setCopyLoading(false);
        }
    };

    // 3. Generate Campaign Banner Copy
    const handleGenerateBannerCopy = async (e) => {
        e?.preventDefault();
        if (bannerLoading) return;
        setBannerLoading(true);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/admin-ai/campaign-copy`,
                bannerForm,
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            if (res.data.success) {
                setBannerVariants(res.data.variants || []);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error generating banner copy');
        } finally {
            setBannerLoading(false);
        }
    };

    // 4. Fetch Demand Forecast
    const fetchDemandForecast = async () => {
        setDemandLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin-ai/demand-forecast`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (res.data.success) {
                setDemandForecast(res.data.forecast || []);
                setDemandSummary(res.data.summary);
            }
        } catch (err) {
            console.error('Error fetching demand forecast:', err);
        } finally {
            setDemandLoading(false);
        }
    };

    // 5. Fetch Fraud Sentinel Orders
    const fetchFraudSentinel = async () => {
        setFraudLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin-ai/suspicious-orders`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (res.data.success) {
                setFlaggedOrders(res.data.flaggedOrders || []);
                setFraudSummary({ totalScanned: res.data.totalScanned, flaggedCount: res.data.flaggedCount });
            }
        } catch (err) {
            console.error('Error scanning orders:', err);
        } finally {
            setFraudLoading(false);
        }
    };

    // 6. Fetch Promotions
    const fetchPromotions = async () => {
        setPromotionsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin-ai/promotions-suggest`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (res.data.success) {
                setPromotions(res.data.promotions || []);
            }
        } catch (err) {
            console.error('Error fetching promotions:', err);
        } finally {
            setPromotionsLoading(false);
        }
    };

    // Auto-fetch data when tab opens
    useEffect(() => {
        if (activeSubTab === 'inventory_demand' && demandForecast.length === 0) fetchDemandForecast();
        if (activeSubTab === 'fraud_sentinel' && flaggedOrders.length === 0) fetchFraudSentinel();
        if (activeSubTab === 'promotions' && promotions.length === 0) fetchPromotions();
    }, [activeSubTab]);

    const quickPrompts = [
        { label: '🏆 Highest Revenue Products', prompt: 'Which products generated the highest revenue this month?' },
        { label: '⚠️ Running Out of Stock', prompt: 'Which products are running out of stock?' },
        { label: '💰 Weekly Revenue & AOV', prompt: 'What is our total revenue, order count, and average order value this week?' },
        { label: '📊 Best Category', prompt: 'Which product category has the highest sales?' },
        { label: '🗣️ Customer Complaints', prompt: 'What are the most common customer complaints and review ratings?' },
        { label: '🚀 Promotion Suggestions', prompt: 'Which products should I promote right now?' }
    ];

    return (
        <div className="space-y-6">
            {/* Header Strip with Gemini Badge */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
                            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                            Google Gemini 2.5 Grounded
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            MongoDB Live Sync
                        </span>
                    </div>
                    <h2 className="mt-1 text-xl font-black text-gray-900">
                        AI-Powered Business Intelligence Assistant
                    </h2>
                    <p className="text-xs text-gray-500">
                        Natural language analytics, inventory demand prediction, SEO copy generator & fraud sentinel
                    </p>
                </div>
            </div>

            {/* Sub-Module Navigation Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2">
                <button
                    onClick={() => setActiveSubTab('chat')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSubTab === 'chat'
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <Bot className="h-4 w-4" />
                    <span>Executive AI Chat</span>
                </button>

                <button
                    onClick={() => setActiveSubTab('copywriter')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSubTab === 'copywriter'
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <FileText className="h-4 w-4" />
                    <span>Product Copy Studio</span>
                </button>

                <button
                    onClick={() => setActiveSubTab('campaigns')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSubTab === 'campaigns'
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <Megaphone className="h-4 w-4" />
                    <span>Banner Copy Studio</span>
                </button>

                <button
                    onClick={() => setActiveSubTab('inventory_demand')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSubTab === 'inventory_demand'
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <TrendingUp className="h-4 w-4" />
                    <span>Predictive Demand</span>
                </button>

                <button
                    onClick={() => setActiveSubTab('fraud_sentinel')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSubTab === 'fraud_sentinel'
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Fraud & Risk Sentinel</span>
                </button>

                <button
                    onClick={() => setActiveSubTab('promotions')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSubTab === 'promotions'
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <Lightbulb className="h-4 w-4" />
                    <span>Smart Promotions</span>
                </button>
            </div>

            {/* TAB 1: EXECUTIVE AI CHAT */}
            {activeSubTab === 'chat' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Left 3 Cols: Interactive Chat Window */}
                    <div className="flex h-[620px] flex-col rounded-3xl border border-gray-200 bg-white shadow-sm lg:col-span-3">
                        {/* Chat Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900">
                                        DropCart Business Intelligence Agent
                                    </h3>
                                    <p className="text-[11px] text-gray-400">
                                        Live grounded insights from your MongoDB collections
                                    </p>
                                </div>
                            </div>
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online & Grounded
                            </span>
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {chatMessages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-xs">
                                            AI
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[85%] rounded-3xl px-5 py-3.5 text-xs shadow-2xs leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-purple-600 text-white rounded-br-xs font-medium'
                                                : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-xs'
                                        }`}
                                    >
                                        <div className="whitespace-pre-line prose prose-sm max-w-none">
                                            {msg.content}
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] opacity-70">
                                            <span>{msg.timestamp}</span>
                                            {msg.role === 'assistant' && (
                                                <button
                                                    onClick={() => copyToClipboard(msg.content, idx)}
                                                    className="flex items-center gap-1 hover:text-purple-600 transition"
                                                    title="Copy response"
                                                >
                                                    {copiedIndex === idx ? (
                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                    <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white font-bold text-xs">
                                            You
                                        </div>
                                    )}
                                </div>
                            ))}

                            {chatLoading && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-xs">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-2.5 text-xs text-gray-500">
                                        Querying MongoDB & analyzing metrics with Gemini...
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Box */}
                        <div className="border-t border-gray-100 p-4">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={inputQuery}
                                    onChange={(e) => setInputQuery(e.target.value)}
                                    placeholder="Ask about revenue this week, top products, low stock, or complaints..."
                                    className="flex-1 rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-gray-900 outline-none transition focus:border-purple-500 focus:bg-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputQuery.trim() || chatLoading}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-700 disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right 1 Col: Quick Prompts & Knowledge Base */}
                    <div className="space-y-4">
                        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                    Executive Shortcuts
                                </h3>
                            </div>
                            <p className="mb-4 text-[11px] text-gray-400">
                                Tap any card below to run an instant grounded audit:
                            </p>

                            <div className="space-y-2">
                                {quickPrompts.map((qp, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSendMessage(qp.prompt)}
                                        className="w-full text-left rounded-2xl border border-gray-100 bg-gray-50/70 p-3 text-xs font-bold text-gray-800 transition hover:border-purple-300 hover:bg-purple-50/50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{qp.label}</span>
                                            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Guardrails Card */}
                        <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 text-xs text-purple-900">
                            <h4 className="font-black">🛡️ Grounding Guarantee</h4>
                            <p className="mt-1 text-[11px] text-purple-700 leading-relaxed">
                                Antigravity AI queries your live MongoDB collections. Financial numbers, order counts, and inventory levels are never hallucinated.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: AI PRODUCT COPY & SEO STUDIO */}
            {activeSubTab === 'copywriter' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Input Form */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <div>
                                <h3 className="text-base font-black text-gray-900">
                                    AI Product Sales Copy & SEO Studio
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Generate high-converting titles, descriptions, and SEO meta tags
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleGenerateCopy} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={copyForm.productName}
                                    onChange={(e) => setCopyForm({ ...copyForm, productName: e.target.value })}
                                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">
                                        Category
                                    </label>
                                    <select
                                        value={copyForm.category}
                                        onChange={(e) => setCopyForm({ ...copyForm, category: e.target.value })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                                    >
                                        <option value="Electronics">Electronics</option>
                                        <option value="Mobiles">Mobiles</option>
                                        <option value="Fashion">Fashion</option>
                                        <option value="Appliances">Appliances</option>
                                        <option value="Home">Home</option>
                                        <option value="Beauty">Beauty</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">
                                        Target Tone
                                    </label>
                                    <select
                                        value={copyForm.tone}
                                        onChange={(e) => setCopyForm({ ...copyForm, tone: e.target.value })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                                    >
                                        <option value="Premium & High-Converting">Premium & High-Converting</option>
                                        <option value="Technical & Detailed">Technical & Detailed</option>
                                        <option value="Punchy & Energetic">Punchy & Energetic</option>
                                        <option value="Luxury & Exclusive">Luxury & Exclusive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">
                                    Key Features & Highlights
                                </label>
                                <textarea
                                    rows={3}
                                    value={copyForm.features}
                                    onChange={(e) => setCopyForm({ ...copyForm, features: e.target.value })}
                                    placeholder="Enter raw specs or bullets: ANC, 30hr battery, multipoint connection..."
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-medium text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">
                                    Target Audience
                                </label>
                                <input
                                    type="text"
                                    value={copyForm.targetAudience}
                                    onChange={(e) => setCopyForm({ ...copyForm, targetAudience: e.target.value })}
                                    placeholder="e.g. Audiophiles, frequent travelers, gamers"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={copyLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-700 disabled:opacity-50"
                            >
                                {copyLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Crafting AI Sales Copy...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        <span>Generate High-Converting Copy</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Output Viewer */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">
                                Generated Copy Output
                            </h3>
                            {generatedCopy && (
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(generatedCopy, null, 2));
                                        setCopyCopied(true);
                                        setTimeout(() => setCopyCopied(false), 2000);
                                    }}
                                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    {copyCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    <span>{copyCopied ? 'Copied All' : 'Copy JSON'}</span>
                                </button>
                            )}
                        </div>

                        {!generatedCopy && !copyLoading && (
                            <div className="flex h-96 flex-col items-center justify-center text-center text-gray-400">
                                <Sparkles className="h-10 w-10 text-purple-300 mb-2" />
                                <p className="text-xs font-bold">No copy generated yet</p>
                                <p className="text-[11px]">Fill out the product specs on the left and click Generate.</p>
                            </div>
                        )}

                        {copyLoading && (
                            <div className="flex h-96 flex-col items-center justify-center text-center text-purple-600">
                                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                                <p className="text-xs font-bold">Synthesizing sales pitch with Gemini 2.5...</p>
                            </div>
                        )}

                        {generatedCopy && !copyLoading && (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {/* SEO Title */}
                                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                                    <span className="text-[10px] font-black uppercase text-purple-600">
                                        SEO Title (Search Optimized)
                                    </span>
                                    <p className="mt-1 text-sm font-black text-gray-900">
                                        {generatedCopy.seoTitle}
                                    </p>
                                </div>

                                {/* Short Pitch */}
                                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                                    <span className="text-[10px] font-black uppercase text-purple-600">
                                        Quick Hook / Short Pitch
                                    </span>
                                    <p className="mt-1 text-xs text-gray-700 leading-relaxed font-medium">
                                        {generatedCopy.shortPitch}
                                    </p>
                                </div>

                                {/* Bullet Points */}
                                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                                    <span className="text-[10px] font-black uppercase text-purple-600">
                                        Key Highlights
                                    </span>
                                    <ul className="mt-2 space-y-1.5">
                                        {(generatedCopy.bulletPoints || []).map((b, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-gray-800">
                                                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Full Description */}
                                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                                    <span className="text-[10px] font-black uppercase text-purple-600">
                                        Full Long Description
                                    </span>
                                    <p className="mt-1 whitespace-pre-line text-xs text-gray-700 leading-relaxed">
                                        {generatedCopy.longDescription}
                                    </p>
                                </div>

                                {/* Meta Tags */}
                                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                                    <span className="text-[10px] font-black uppercase text-purple-600">
                                        Meta Description & Keywords
                                    </span>
                                    <p className="mt-1 text-xs text-gray-600 italic">
                                        "{generatedCopy.metaDescription}"
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {(generatedCopy.searchKeywords || []).map((k, i) => (
                                            <span key={i} className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                                                #{k}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: BANNER CAMPAIGN STUDIO */}
            {activeSubTab === 'campaigns' && (
                <div className="space-y-6">
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-purple-600" />
                                <div>
                                    <h3 className="text-base font-black text-gray-900">
                                        Promotional Banner Copy & Headline Generator
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Create high-CTR headlines for hero sliders, popups, and announcement bars
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleGenerateBannerCopy} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">
                                    Campaign Theme
                                </label>
                                <input
                                    type="text"
                                    value={bannerForm.campaignTheme}
                                    onChange={(e) => setBannerForm({ ...bannerForm, campaignTheme: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">
                                    Discount / Offer Hook
                                </label>
                                <input
                                    type="text"
                                    value={bannerForm.discountOffer}
                                    onChange={(e) => setBannerForm({ ...bannerForm, discountOffer: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={bannerLoading}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {bannerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    <span>Generate Banner Variations</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Banner Variant Previews */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {bannerVariants.map((variant, idx) => (
                            <div
                                key={idx}
                                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${variant.suggestedGradient || 'from-orange-600 to-red-600'} p-6 text-white shadow-md`}
                            >
                                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase backdrop-blur-xs">
                                    {variant.badge}
                                </span>
                                <h4 className="mt-3 text-lg font-black leading-tight">
                                    {variant.headline}
                                </h4>
                                <p className="mt-2 text-xs text-white/90 leading-relaxed font-medium">
                                    {variant.subheadline}
                                </p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-black text-gray-900 shadow-sm">
                                        {variant.ctaText}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(`${variant.headline} - ${variant.subheadline}`, idx)}
                                        className="rounded-xl bg-white/20 p-2 text-white hover:bg-white/30 transition"
                                        title="Copy copy text"
                                    >
                                        {copiedIndex === idx ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: PREDICTIVE INVENTORY DEMAND */}
            {activeSubTab === 'inventory_demand' && (
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-4">
                        <div>
                            <h3 className="text-base font-black text-gray-900">
                                Predictive Inventory Demand & Stockout Forecaster
                            </h3>
                            <p className="text-xs text-gray-500">
                                Analyzes 30-day velocity to forecast when products will run out and suggests optimal reorder units
                            </p>
                        </div>
                        <button
                            onClick={fetchDemandForecast}
                            disabled={demandLoading}
                            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${demandLoading ? 'animate-spin' : ''}`} />
                            <span>Recalculate Run-Rate</span>
                        </button>
                    </div>

                    {demandSummary && (
                        <div className="mb-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 p-4 text-xs text-amber-900 flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                            <div>
                                <span className="font-bold">Executive Inventory Insight: </span>
                                {demandSummary.recommendation}
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="py-3 px-3">Product Name</th>
                                    <th className="py-3 px-3">Category</th>
                                    <th className="py-3 px-3">Current Stock</th>
                                    <th className="py-3 px-3">30-Day Sold</th>
                                    <th className="py-3 px-3">Daily Burn</th>
                                    <th className="py-3 px-3">Days Left</th>
                                    <th className="py-3 px-3">Risk Status</th>
                                    <th className="py-3 px-3">Recommended Reorder</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {demandForecast.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                                        <td className="py-3 px-3 font-bold text-gray-900 max-w-[200px] truncate">
                                            {p.name}
                                        </td>
                                        <td className="py-3 px-3 text-gray-500">{p.category}</td>
                                        <td className="py-3 px-3 font-mono font-bold text-gray-800">{p.stock}</td>
                                        <td className="py-3 px-3 text-gray-600">{p.unitsSold30d}</td>
                                        <td className="py-3 px-3 text-gray-600">{p.dailyBurnRate}/day</td>
                                        <td className="py-3 px-3 font-black text-gray-900">
                                            {p.daysUntilStockout > 90 ? '90+ days' : `${p.daysUntilStockout} days`}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                                    p.riskLevel.includes('Critical')
                                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                                        : p.riskLevel.includes('High')
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}
                                            >
                                                {p.riskLevel}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-bold text-purple-700">
                                            +{p.recommendedReorder} units
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 5: FRAUD & RISK SENTINEL */}
            {activeSubTab === 'fraud_sentinel' && (
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-4">
                        <div>
                            <h3 className="text-base font-black text-gray-900">
                                Suspicious Order & Fraud Detection Sentinel
                            </h3>
                            <p className="text-xs text-gray-500">
                                Identifies unusually high-value transactions, rapid repeat orders, and address anomalies
                            </p>
                        </div>
                        <button
                            onClick={fetchFraudSentinel}
                            disabled={fraudLoading}
                            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${fraudLoading ? 'animate-spin' : ''}`} />
                            <span>Scan Recent Orders</span>
                        </button>
                    </div>

                    {flaggedOrders.length === 0 ? (
                        <div className="py-12 text-center text-xs text-gray-400">
                            <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="font-bold text-gray-700">All Scanned Orders Clear</p>
                            <p className="text-[11px]">No anomalous transactions detected in recent orders.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {flaggedOrders.map((f, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-red-100 bg-red-50/20 p-4 transition hover:bg-red-50/40"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-mono text-xs font-bold text-gray-900">
                                                Order #{f.orderId}
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                Customer: <span className="font-bold text-gray-800">{f.customer.name}</span> ({f.customer.email}) • City: {f.shippingCity || 'N/A'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-gray-900">
                                                ₹{Number(f.totalPrice).toLocaleString('en-IN')}
                                            </span>
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                                    f.riskLevel === 'High'
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-amber-500 text-white'
                                                }`}
                                            >
                                                {f.riskLevel} Risk
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {f.riskFactors.map((rf, rIdx) => (
                                            <span
                                                key={rIdx}
                                                className="rounded-md bg-white border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700"
                                            >
                                                ⚠️ {rf}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-3 rounded-xl bg-white/80 p-2.5 text-[11px] text-gray-700 font-medium">
                                        <span className="font-black text-purple-900">Action Recommendation: </span>
                                        {f.recommendation}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 6: SMART PROMOTION STRATEGIST */}
            {activeSubTab === 'promotions' && (
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-4">
                        <div>
                            <h3 className="text-base font-black text-gray-900">
                                Smart Product Promotion & Cross-Sell Strategist
                            </h3>
                            <p className="text-xs text-gray-500">
                                AI recommendations for clearance deals, loss leaders, and bundling opportunities
                            </p>
                        </div>
                        <button
                            onClick={fetchPromotions}
                            disabled={promotionsLoading}
                            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${promotionsLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh Recommendations</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {promotions.map((p, idx) => (
                            <div
                                key={idx}
                                className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 transition hover:border-purple-200 hover:bg-purple-50/20"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black text-purple-700">
                                        {p.strategy}
                                    </span>
                                    <span className="text-xs font-black text-emerald-600">
                                        {p.suggestedDiscount}
                                    </span>
                                </div>

                                <h4 className="mt-2 text-sm font-black text-gray-900">
                                    {p.name}
                                </h4>
                                <p className="text-[11px] text-gray-500">
                                    Category: {p.category} • Base Price: ₹{Number(p.price).toLocaleString('en-IN')}
                                </p>

                                <p className="mt-3 text-xs text-gray-700 leading-relaxed font-medium">
                                    {p.rationale}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAiTab;
