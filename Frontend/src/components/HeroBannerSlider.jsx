import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck, Zap, Scale } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useSocket } from '../context/SocketContext';

const defaultSlides = [
    {
        _id: 'default-1',
        badge: 'NEW GENERATION',
        title: 'Core Ultra AI Performance Laptops',
        tagline: 'Intel Core Ultra 7 • 16GB LPDDR5X • 1TB PCIe Gen4 SSD',
        price: 'From ₹54,999',
        offer: 'Instant ₹4,000 Bank Rebate + Free Next-Day Delivery',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
        bg: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e293b 100%)',
        link: '/shop?category=Electronics',
    },
    {
        _id: 'default-2',
        badge: 'FLAGSHIP LAUNCH',
        title: 'Samsung Galaxy S24 Series 5G',
        tagline: 'Galaxy AI Features • 50MP Pro-Grade OIS • 120Hz Dynamic AMOLED',
        price: 'Starting at ₹49,999',
        offer: 'Up to ₹8,000 Exchange Bonus on Your Old Phone',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        link: '/shop?category=Mobiles',
    },
    {
        _id: 'default-3',
        badge: 'SEASON SPECIAL',
        title: 'Premium Winter & Streetwear',
        tagline: 'Monte Carlo, Puma, Bomber Jackets & Artisan Leather Accessories',
        price: 'Up to 50% Off',
        offer: 'Extra 10% Off with Code WELCOME100 at Checkout',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
        bg: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)',
        link: '/shop?category=Fashion',
    },
];

const HeroBannerSlider = ({ customBanners = [], heroTitle = '', heroSubtitle = '', heroBadge = '' }) => {
    const [dbBanners, setDbBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const recordedImpressions = useRef(new Set());
    const { socket } = useSocket() || {};

    const fetchHeroCampaigns = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/campaigns?type=hero_slider`);
            if (Array.isArray(data) && data.length > 0) {
                // Map campaign fields to slide format
                const formatted = data.map((c) => ({
                    _id: c._id,
                    badge: c.badge || 'PROMO',
                    title: c.title,
                    tagline: c.subtitle || '',
                    price: c.priceText || '',
                    offer: c.offerText || '',
                    image: c.desktopImage,
                    mobileImage: c.mobileImage || c.desktopImage,
                    bg: c.bgGradient || 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e293b 100%)',
                    link: c.ctaLink || '/shop',
                    ctaText: c.ctaText || 'Shop Collection',
                }));
                setDbBanners(formatted);
            }
        } catch {
            // Fallback to default
        }
    };

    useEffect(() => {
        fetchHeroCampaigns();
    }, []);

    // Live Socket.IO listener for real-time campaign updates
    useEffect(() => {
        if (!socket) return;
        const handleCampaignUpdate = () => {
            fetchHeroCampaigns();
        };
        socket.on('campaignsUpdated', handleCampaignUpdate);
        return () => socket.off('campaignsUpdated', handleCampaignUpdate);
    }, [socket]);

    // Priority: Database campaigns > customBanners prop > defaultSlides
    const sourceBanners =
        dbBanners.length > 0 ? dbBanners : customBanners.length > 0 ? customBanners : defaultSlides;

    const banners = sourceBanners.map((slide, idx) => {
        if (idx === 0) {
            return {
                ...slide,
                badge: heroBadge && heroBadge.trim() !== '' ? heroBadge : slide.badge,
                title: heroTitle && heroTitle.trim() !== '' ? heroTitle : slide.title,
                tagline: heroSubtitle && heroSubtitle.trim() !== '' ? heroSubtitle : slide.tagline,
            };
        }
        return slide;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 6500);
        return () => clearInterval(interval);
    }, [banners.length]);

    // Record impression for active slide
    useEffect(() => {
        const currentSlide = banners[currentIndex];
        if (currentSlide && currentSlide._id && !recordedImpressions.current.has(currentSlide._id)) {
            recordedImpressions.current.add(currentSlide._id);
            if (!currentSlide._id.startsWith('default-')) {
                axios.post(`${API_BASE_URL}/api/campaigns/${currentSlide._id}/impression`, {}).catch(() => {});
            }
        }
    }, [currentIndex, banners]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const handleCtaClick = (slide) => {
        if (slide && slide._id && !slide._id.startsWith('default-')) {
            axios.post(`${API_BASE_URL}/api/campaigns/${slide._id}/click`, {}).catch(() => {});
        }
    };

    const current = banners[currentIndex] || defaultSlides[0];

    return (
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
            {/* Main Showcase Hero */}
            <div className="relative overflow-hidden rounded-3xl shadow-xl transition-all duration-500">
                <div
                    style={{ background: current.bg || 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                    className="relative grid min-h-[380px] grid-cols-1 items-center gap-6 px-8 py-10 sm:min-h-[420px] sm:px-14 md:grid-cols-12 md:py-12"
                >
                    {/* Left Column: Headlines & Actions */}
                    <div className="z-10 flex flex-col justify-center space-y-4 md:col-span-7">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-400 backdrop-blur-md border border-white/10">
                                <Sparkles className="h-3 w-3 text-orange-400" />
                                {current.badge || 'FEATURED'}
                            </span>
                        </div>

                        <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                            {current.title}
                        </h1>

                        <p className="text-xs sm:text-sm font-medium text-gray-300 max-w-xl leading-relaxed">
                            {current.tagline}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            {current.price && (
                                <span className="text-2xl sm:text-3xl font-black text-white">
                                    {current.price}
                                </span>
                            )}
                            {current.offer && (
                                <span className="rounded-xl bg-orange-500/20 border border-orange-500/40 px-3 py-1 text-xs font-bold text-orange-300 backdrop-blur-md">
                                    {current.offer}
                                </span>
                            )}
                        </div>

                        <div className="pt-3 flex items-center gap-3">
                            <Link
                                to={current.link || '/shop'}
                                onClick={() => handleCtaClick(current)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 transition hover:scale-105 active:scale-95"
                            >
                                {current.ctaText || 'Shop Collection'} <ArrowRight className="h-4 w-4" />
                            </Link>

                            <Link
                                to="/shop"
                                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 px-5 py-3 text-xs font-bold text-white transition backdrop-blur-md"
                            >
                                Browse All
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Hero Visual Showcase (Responsive Desktop & Mobile) */}
                    <div className="relative z-10 flex items-center justify-center md:col-span-5">
                        <div className="relative aspect-[4/3] w-full max-w-[340px] overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-2 shadow-2xl backdrop-blur-md group">
                            <picture>
                                {current.mobileImage && (
                                    <source media="(max-width: 640px)" srcSet={current.mobileImage} />
                                )}
                                <img
                                    src={current.image}
                                    alt={current.title}
                                    className="h-full w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </picture>
                        </div>
                    </div>

                    {/* Slider Nav Arrows */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70 hover:scale-110 active:scale-95"
                        title="Previous Slide"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70 hover:scale-110 active:scale-95"
                        title="Next Slide"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {/* Dot Indicators */}
                <div className="flex justify-center gap-2 bg-[#090d16] py-3">
                    {banners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 rounded-full transition-all ${
                                currentIndex === idx ? 'w-8 bg-orange-500' : 'w-2 bg-white/30 hover:bg-white/60'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Modern Enterprise 3-Feature Value Bar */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                        <Zap className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-900">Lightning 2-Hour Express</h4>
                        <p className="text-[11px] text-gray-500">Same-day dispatch on over 10,000+ top products</p>
                    </div>
                </div>

                <div className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-900">100% Brand Authenticity</h4>
                        <p className="text-[11px] text-gray-500">Direct authorized warranty & 7-day hassle-free replacement</p>
                    </div>
                </div>

                <div className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Scale className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-900">Smart Price Comparison</h4>
                        <p className="text-[11px] text-gray-500">Compare specs side-by-side with Flipkart & Amazon</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroBannerSlider;