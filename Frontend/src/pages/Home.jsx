import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { API_BASE_URL } from '../config';
import ProductCard from '../components/ProductCard';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [settings, setSettings] = useState({
        heroTitle: 'Everything You Love. In One Place.',
        heroSubtitle:
            'Discover high-quality essentials, trending tech, and curated styles. Built for seamless online shopping.',
        heroBadge: 'New Season Collection 2026',
        featuredTag: 'Trending Now',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [productRes, settingsRes, catRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/products`),
                    axios.get(`${API_BASE_URL}/api/settings`).catch(() => null),
                    axios.get(`${API_BASE_URL}/api/products/categories`).catch(() => null),
                ]);

                setProducts(productRes.data.slice(0, 8)); // Show top 8 featured
                if (settingsRes?.data) {
                    setSettings((prev) => ({
                        ...prev,
                        ...settingsRes.data,
                    }));
                }
                if (catRes?.data) {
                    setCategories(catRes.data.slice(0, 6));
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching home data:', error);
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    return (
        <div className="min-h-screen bg-[#f8f8f6] pb-16">
            {/* Dynamic Hero Section */}
            <section className="relative overflow-hidden bg-[#171717] px-6 py-16 text-white sm:px-10 lg:px-16">
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

                <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
                    <div className="max-w-2xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-400">
                            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                            {settings.heroBadge}
                        </div>

                        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            {settings.heroTitle}
                        </h1>

                        <p className="mt-5 max-w-xl text-base leading-7 text-gray-400 sm:text-lg">
                            {settings.heroSubtitle}
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                to="/shop"
                                className="group inline-flex items-center rounded-xl bg-orange-500 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95"
                            >
                                Explore Catalog
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>

                            <Link
                                to="/shop"
                                className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
                            >
                                Browse Categories
                            </Link>
                        </div>

                        {/* Value Pillars */}
                        <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                100% Genuine Items
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Truck className="h-4 w-4 text-emerald-400" />
                                Free Delivery Above ₹499
                            </span>
                            <span className="flex items-center gap-1.5">
                                <RotateCcw className="h-4 w-4 text-emerald-400" />
                                7 Days Return Policy
                            </span>
                        </div>
                    </div>

                    {/* Hero Graphic / Banner Preview */}
                    <div className="relative hidden lg:block">
                        <div className="relative mx-auto h-80 w-80 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-sm">
                            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/5 text-center">
                                <div className="text-6xl">🛍️</div>
                                <h3 className="mt-4 text-lg font-black text-white">
                                    DropCart Premier
                                </h3>
                                <p className="mt-1 px-4 text-xs text-gray-400">
                                    Next-generation e-commerce with real-time order tracking
                                </p>
                                <span className="mt-4 rounded-full bg-orange-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow">
                                    Verified Stores
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Category Quick Links */}
            {categories.length > 0 && (
                <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                            Popular Categories
                        </h3>
                        <Link to="/shop" className="text-xs font-bold text-orange-600 hover:underline">
                            View All Categories →
                        </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                        {categories.map((cat) => (
                            <Link
                                key={cat}
                                to={`/shop?category=${encodeURIComponent(cat)}`}
                                className="rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:border-orange-500 hover:text-orange-600"
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured Products Showcase */}
            <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1 w-8 rounded-full bg-orange-500" />
                            <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                                {settings.featuredTag || 'Trending Now'}
                            </p>
                        </div>

                        <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                            Featured Products
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Hand-picked essentials with real customer reviews and ratings.
                        </p>
                    </div>

                    <Link
                        to="/shop"
                        className="group flex w-fit items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:border-orange-500 hover:text-orange-600"
                    >
                        Explore Full Store
                        <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4"
                            >
                                <div className="aspect-square animate-pulse rounded-xl bg-gray-200" />
                                <div className="mt-3 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                                    <div className="h-5 w-1/4 rounded bg-gray-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;
