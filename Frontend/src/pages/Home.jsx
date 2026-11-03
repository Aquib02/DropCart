import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Zap, ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';
import { API_BASE_URL } from '../config';
import CategoryBar from '../components/CategoryBar';
import HeroBannerSlider from '../components/HeroBannerSlider';
import ProductCard from '../components/ProductCard';
import RecentlyViewedProducts from '../components/RecentlyViewedProducts';
import AIPersonalizedRecommendations from '../components/AIPersonalizedRecommendations';
import { useSocket } from '../context/SocketContext';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket() || {};

    // Live Socket.IO listener for real-time storefront appearance updates
    useEffect(() => {
        if (!socket) return;
        const handleSettingsUpdate = (updatedSettings) => {
            if (updatedSettings) {
                setSettings(updatedSettings);
            }
        };
        socket.on('settingsUpdated', handleSettingsUpdate);
        return () => socket.off('settingsUpdated', handleSettingsUpdate);
    }, [socket]);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [productRes, settingsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/products`).catch(() => ({ data: [] })),
                    axios.get(`${API_BASE_URL}/api/settings`).catch(() => null),
                ]);

                setProducts(Array.isArray(productRes?.data) ? productRes.data : []);
                if (settingsRes?.data) {
                    setSettings(settingsRes.data);
                }
            } catch (error) {
                console.error('Error fetching home data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    const productList = Array.isArray(products) ? products : [];

    // Filter categories for Flipkart curated rows
    const mobiles = productList.filter((p) => p.category === 'Mobiles');
    const electronics = productList.filter((p) => p.category === 'Electronics');
    const homeAndLiving = productList.filter((p) => p.category === 'Home');
    const fashion = productList.filter((p) => p.category === 'Fashion');

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Category Ribbon */}
            <CategoryBar />

            {/* Modern Hero Showcase */}
            <HeroBannerSlider
                customBanners={settings?.banners}
                heroTitle={settings?.heroTitle}
                heroSubtitle={settings?.heroSubtitle}
                heroBadge={settings?.heroBadge}
            />

            {/* Section 1: Trending 5G Mobiles */}
            <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
                <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500 text-xs text-white">
                                    <Zap className="h-3.5 w-3.5 fill-current" />
                                </span>
                                <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                                    Top 5G Smartphones
                                </h2>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Latest Samsung, Apple, OnePlus & Google Pixel with exchange bonuses
                            </p>
                        </div>

                        <Link
                            to="/shop?category=Mobiles"
                            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-800 transition hover:bg-gray-100 shadow-2xs"
                        >
                            View All <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {(mobiles.length > 0 ? mobiles : productList.slice(0, 4)).map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 2: AI Laptops & Premium Audio */}
            <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
                <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                                Laptops, Audio & Tech Essentials
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                High-performance AI workstations, studio headphones, and accessories
                            </p>
                        </div>

                        <Link
                            to="/shop?category=Electronics"
                            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-800 transition hover:bg-gray-100 shadow-2xs"
                        >
                            Explore Tech <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {(electronics.length > 0 ? electronics : productList.slice(4, 8)).map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 3: Winter Blankets & Home Comfort */}
            <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
                <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                                Winter Blankets & Home Essentials
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Monte Carlo, Signature Mink Quilts & Bedding at Up to 60% Off
                            </p>
                        </div>

                        <Link
                            to="/shop?category=Home"
                            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                        >
                            View Home Deals <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {(homeAndLiving.length > 0 ? homeAndLiving : productList.slice(8, 12)).map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 4: Trending Fashion & Footwear */}
            <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
                <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                                Trending Fashion & Footwear
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Puma, Denim Jackets, Leather Backpacks and Streetwear Essentials
                            </p>
                        </div>

                        <Link
                            to="/shop?category=Fashion"
                            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                        >
                            Explore Fashion <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {(fashion.length > 0 ? fashion : productList.slice(12, 16)).map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Personalized Recommendations Strip */}
            <AIPersonalizedRecommendations />

            {/* Recently Viewed Products Strip */}
            <RecentlyViewedProducts />

            {/* Enterprise Assurance Strip */}
            <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
                <div className="grid grid-cols-2 gap-4 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xs sm:grid-cols-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-900">100% Authentic</p>
                            <p className="text-[10px] text-gray-400">Direct Brand Warranty</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                            <Truck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-900">Express Delivery</p>
                            <p className="text-[10px] text-gray-400">Free over ₹499</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                            <RotateCcw className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-900">Easy Returns</p>
                            <p className="text-[10px] text-gray-400">7-Day Hassle-Free</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-900">Secure Checkout</p>
                            <p className="text-[10px] text-gray-400">256-Bit SSL Encrypted</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
