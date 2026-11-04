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
    const [secondaryBanners, setSecondaryBanners] = useState([]);
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket() || {};

    // Live Socket.IO listener for real-time storefront appearance & layout updates
    useEffect(() => {
        if (!socket) return;
        const handleSettingsUpdate = (updatedSettings) => {
            if (updatedSettings) {
                setSettings(updatedSettings);
            }
        };
        const handleCampaignsUpdate = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/campaigns?type=secondary_banner`);
                if (Array.isArray(data)) setSecondaryBanners(data);
            } catch {}
        };
        const handleLayoutUpdate = (updatedLayout) => {
            if (updatedLayout && Array.isArray(updatedLayout.sections)) {
                setLayout(updatedLayout);
            }
        };

        socket.on('settingsUpdated', handleSettingsUpdate);
        socket.on('campaignsUpdated', handleCampaignsUpdate);
        socket.on('homepageLayoutUpdated', handleLayoutUpdate);

        return () => {
            socket.off('settingsUpdated', handleSettingsUpdate);
            socket.off('campaignsUpdated', handleCampaignsUpdate);
            socket.off('homepageLayoutUpdated', handleLayoutUpdate);
        };
    }, [socket]);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [productRes, settingsRes, promoRes, layoutRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/products`).catch(() => ({ data: [] })),
                    axios.get(`${API_BASE_URL}/api/settings`).catch(() => null),
                    axios.get(`${API_BASE_URL}/api/campaigns?type=secondary_banner`).catch(() => ({ data: [] })),
                    axios.get(`${API_BASE_URL}/api/homepage-layout/published`).catch(() => null),
                ]);

                setProducts(Array.isArray(productRes?.data) ? productRes.data : []);
                if (settingsRes?.data) {
                    setSettings(settingsRes.data);
                }
                if (Array.isArray(promoRes?.data)) {
                    setSecondaryBanners(promoRes.data);
                }
                if (layoutRes?.data && Array.isArray(layoutRes.data.sections)) {
                    setLayout(layoutRes.data);
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

    // Helper: Resolve products for a product_grid section
    const getProductsForSection = (section) => {
        // 1. If explicit custom products were selected by admin in Visual Editor
        if (Array.isArray(section.selectedProductIds) && section.selectedProductIds.length > 0) {
            const mapped = section.selectedProductIds.map(item => {
                if (typeof item === 'object' && item !== null && item._id) return item;
                return productList.find(p => p._id === item);
            }).filter(Boolean);
            if (mapped.length > 0) return mapped;
        }

        // 2. Filter by category
        const cat = section.category || 'All';
        const filtered = cat === 'All'
            ? productList
            : productList.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());

        const limit = section.limit || 4;
        return filtered.length > 0 ? filtered.slice(0, limit) : productList.slice(0, limit);
    };

    // Render individual section dynamically from Visual Editor
    const renderSection = (section, index) => {
        if (!section.isVisible) return null;

        switch (section.type) {
            case 'category_bar':
                return <CategoryBar key={section.id || index} />;

            case 'hero_slider':
                return (
                    <HeroBannerSlider
                        key={section.id || index}
                        customBanners={settings?.banners}
                        heroTitle={settings?.heroTitle}
                        heroSubtitle={settings?.heroSubtitle}
                        heroBadge={settings?.heroBadge}
                    />
                );

            case 'promotional_banner':
                if (secondaryBanners.length === 0) return null;
                return (
                    <section key={section.id || index} className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {secondaryBanners.map((banner) => (
                                <Link
                                    key={banner._id}
                                    to={banner.ctaLink || '/shop'}
                                    onClick={() => {
                                        if (banner._id && !banner._id.startsWith('default-')) {
                                            axios.post(`${API_BASE_URL}/api/campaigns/${banner._id}/click`, {}).catch(() => {});
                                        }
                                    }}
                                    className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-cover bg-center p-6 text-white shadow-sm transition hover:shadow-md"
                                    style={{
                                        background: banner.bgGradient || 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                                        backgroundImage: banner.desktopImage ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${banner.desktopImage})` : undefined
                                    }}
                                >
                                    <div className="relative z-10 flex h-full flex-col justify-between">
                                        <div>
                                            {banner.badge && (
                                                <span className="inline-block rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-[10px] font-black tracking-wider uppercase text-white mb-2">
                                                    {banner.badge}
                                                </span>
                                            )}
                                            <h3 className="text-lg font-black text-white sm:text-xl group-hover:underline">
                                                {banner.title}
                                            </h3>
                                            {banner.subtitle && (
                                                <p className="mt-1 text-xs text-gray-200 line-clamp-2">
                                                    {banner.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-xs font-black text-amber-300">
                                                {banner.offerText || banner.priceText || 'Limited Time Offer'}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                                                {banner.ctaText || 'Shop Now'} <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                );

            case 'assurance_bar':
                return (
                    <section key={section.id || index} className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
                        <div
                            className="grid grid-cols-2 gap-4 rounded-3xl border border-gray-200/80 p-6 shadow-xs sm:grid-cols-4"
                            style={{ backgroundColor: section.backgroundColor || '#ffffff' }}
                        >
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
                );

            case 'product_grid':
            default: {
                const sectionItems = getProductsForSection(section);
                const isDarkBg = section.backgroundColor && (section.backgroundColor === '#0f172a' || section.backgroundColor.startsWith('#0'));

                return (
                    <section key={section.id || index} className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
                        <div
                            className="overflow-hidden rounded-3xl border border-gray-200/80 p-5 shadow-sm sm:p-6 transition-all"
                            style={{ backgroundColor: section.backgroundColor || '#ffffff' }}
                        >
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {section.badgeText && (
                                            <span className="flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                                                <Zap className="h-3 w-3 fill-current" />
                                                {section.badgeText}
                                            </span>
                                        )}
                                        <h2 className={`text-xl font-black tracking-tight sm:text-2xl ${isDarkBg ? 'text-white' : 'text-gray-900'}`}>
                                            {section.title}
                                        </h2>
                                    </div>
                                    {section.subtitle && (
                                        <p className={`mt-0.5 text-xs ${isDarkBg ? 'text-gray-300' : 'text-gray-500'}`}>
                                            {section.subtitle}
                                        </p>
                                    )}
                                </div>

                                {section.ctaText && (
                                    <Link
                                        to={section.ctaLink || '/shop'}
                                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-800 transition hover:bg-gray-100 shadow-2xs"
                                    >
                                        {section.ctaText} <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {sectionItems.map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        </div>
                    </section>
                );
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Dynamic Visual Layout Engine Sections */}
            {layout && Array.isArray(layout.sections) && layout.sections.length > 0 ? (
                layout.sections.map((sec, idx) => renderSection(sec, idx))
            ) : (
                /* Fallback Default Layout if layout is not yet loaded */
                <>
                    <CategoryBar />
                    <HeroBannerSlider
                        customBanners={settings?.banners}
                        heroTitle={settings?.heroTitle}
                        heroSubtitle={settings?.heroSubtitle}
                        heroBadge={settings?.heroBadge}
                    />
                    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
                        <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                                        Super Deals & Trending Offers
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Top flagship smartphones, smartwatches & accessories on festive discount
                                    </p>
                                </div>
                                <Link
                                    to="/shop?category=Mobiles"
                                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-800 transition hover:bg-gray-100"
                                >
                                    View All Deals <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {productList.slice(0, 4).map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* AI Personalized Recommendations Strip */}
            <AIPersonalizedRecommendations />

            {/* Recently Viewed Products Strip */}
            <RecentlyViewedProducts />
        </div>
    );
};

export default Home;
