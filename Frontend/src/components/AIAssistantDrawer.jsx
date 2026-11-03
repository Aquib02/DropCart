import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Sparkles, Send, X, Bot, User, ShoppingBag, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config';

const AIAssistantDrawer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            text: "Hello! 👋 I'm your DropCart AI Shopping Guide. Ask me for recommendations, budget picks, specs, or deals (e.g. *'best laptop for coding under ₹50,000'*).",
            products: [],
            time: 'Just now'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { addToCart } = useCart();

    const quickQueries = [
        "Best laptop for coding under ₹50,000",
        "Top smartphones with 5G",
        "Festival gift ideas under ₹2,000",
        "Wireless earbuds with noise cancellation"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (queryText) => {
        const textToSend = queryText || input;
        if (!textToSend.trim() || loading) return;

        const userMsg = {
            sender: 'user',
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        if (!queryText) setInput('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/ai/chat`, {
                message: textToSend,
                conversationHistory: messages.slice(-4)
            });

            if (data.success) {
                const aiMsg = {
                    sender: 'ai',
                    text: data.reply,
                    products: data.recommendedProducts || [],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        sender: 'ai',
                        text: "I couldn't process that query. Here are some featured items you might like:",
                        products: [],
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
            }
        } catch (error) {
            setMessages(prev => [
                ...prev,
                {
                    sender: 'ai',
                    text: "Sorry, I ran into a connection glitch. Please check your query or try one of the suggestions below.",
                    products: [],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-white/60 group"
                    title="Ask DropCart AI Assistant"
                >
                    <div className="relative">
                        <Sparkles className="w-5 h-5 animate-spin-slow text-yellow-100 group-hover:rotate-12 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-amber-600 animate-pulse"></span>
                    </div>
                    <span className="text-sm tracking-wide">AI Assistant</span>
                </button>
            )}

            {/* Chat Drawer / Window */}
            {isOpen && (
                <div className="w-[360px] sm:w-[420px] h-[580px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 text-white flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30 shadow-inner">
                                <Bot className="w-5 h-5 text-yellow-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                                    DropCart AI Shopping Guide
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                </h3>
                                <p className="text-[11px] text-amber-100">Live Inventory Grounded • Gemini Powered</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className="flex items-start gap-2 max-w-[88%]">
                                    {msg.sender === 'ai' && (
                                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}

                                    <div
                                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                            msg.sender === 'user'
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-tr-none shadow-sm'
                                                : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-none shadow-sm'
                                        }`}
                                    >
                                        <div className="whitespace-pre-line font-normal">{msg.text}</div>
                                        <span
                                            className={`block text-[10px] mt-1 text-right ${
                                                msg.sender === 'user' ? 'text-amber-100' : 'text-gray-400'
                                            }`}
                                        >
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>

                                {/* Recommended Product Cards inside chat */}
                                {msg.products?.length > 0 && (
                                    <div className="mt-2.5 ml-9 w-[88%] space-y-2">
                                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Catalog Matches:
                                        </div>
                                        {msg.products.map(prod => (
                                            <div
                                                key={prod._id}
                                                className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-3 shadow-xs hover:border-amber-400 transition-colors"
                                            >
                                                <img
                                                    src={prod.image || prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}
                                                    alt={prod.name || prod.title}
                                                    className="w-12 h-12 rounded-lg object-contain bg-gray-50 p-1 border shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-gray-800 truncate">
                                                        {prod.name || prod.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs font-bold text-gray-900">
                                                            ₹{Number(prod.price || prod.discountPrice).toLocaleString('en-IN')}
                                                        </span>
                                                        {prod.rating && (
                                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                                                {prod.rating}★
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Link
                                                    to={`/product/${prod._id}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors shrink-0"
                                                    title="View Details"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 ml-9 bg-white border border-gray-200 p-2.5 rounded-xl w-fit">
                                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                <span>DropCart AI is finding the best matches...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="px-3 pt-2 pb-1 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
                        {quickQueries.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendMessage(q)}
                                disabled={loading}
                                className="whitespace-nowrap text-[11px] bg-amber-50 text-amber-800 font-medium px-2.5 py-1 rounded-full border border-amber-200/80 hover:bg-amber-100 transition-colors shrink-0 disabled:opacity-50"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input Bar */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask AI anything (e.g. 5G phone under 20k)..."
                            className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-sm shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIAssistantDrawer;
