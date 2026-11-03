import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, CreditCard, ArrowRight } from 'lucide-react';

const defaultSlides = [
    {
        id: 1,
        badge: 'BIG BANG DIWALI',
        title: 'Acer Swift Neo AI PCs',
        tagline: 'Up to Intel Core Ultra 5 | 16/512 GB',
        price: 'From ₹47,000*',
        bankOffer: 'SBI Card 10% Instant Discount on Debit & Credit Cards',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
        bg: 'from-[#b91c1c] via-[#ea580c] to-[#ca8a04]',
        link: '/shop?category=Electronics',
    },
    {
        id: 2,
        badge: 'BIG BANG DIWALI',
        title: 'Warm Blankets & Quilts',
        tagline: 'Monte Carlo, Signature & More Winter Essentials',
        price: 'Up to 60% Off',
        bankOffer: 'SBI & HDFC Bank 10% Instant Discount on All Orders',
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
        bg: 'from-[#c2410c] via-[#d97706] to-[#b45309]',
        link: '/shop?category=Home',
    },
    {
        id: 3,
        badge: 'SAMSUNG SPECIAL',
        title: 'Galaxy F70e 5G',
        tagline: '6000mAh Battery | 50MP OIS Camera | Super AMOLED',
        price: 'From ₹15,999*',
        bankOffer: 'Get ₹1,500 Additional Bank & Exchange Bonus',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        bg: 'from-[#0369a1] via-[#0284c7] to-[#0d9488]',
        link: '/shop?category=Mobiles',
    },
];

const HeroBannerSlider = ({ customBanners = [] }) => {
    const banners = customBanners && customBanners.length > 0 ? customBanners : defaultSlides;
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-advance slide every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 4500);
        return () => clearInterval(interval);
    }, [banners.length]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const current = banners[currentIndex] || defaultSlides[0];

    return (
        <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
            {/* Top Cards Slider (Matching screenshot cards grid) */}
            <div className="relative overflow-hidden rounded-3xl shadow-lg">
                <div
                    className={`relative grid min-h-[220px] grid-cols-1 items-center bg-gradient-to-r ${
                        current.bgGradient || current.bg
                    } p-6 text-white sm:min-h-[260px] sm:p-8 md:grid-cols-12`}
                >
                    {/* Festive Ambient Lanterns / Diya decoration */}
                    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
                    <div className="absolute left-10 bottom-0 h-40 w-40 rounded-full bg-red-400/20 blur-2xl pointer-events-none" />

                    {/* Left Column: Offer Details */}
                    <div className="relative z-10 space-y-2 md:col-span-7 sm:space-y-3">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-amber-200 backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5" />
                            {current.badge}
                        </div>

                        <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
                            {current.title}
                        </h2>

                        <p className="text-xl font-black text-amber-200 sm:text-2xl">
                            {current.price || current.priceText}
                        </p>

                        <p className="text-xs font-semibold text-white/90 sm:text-sm">
                            {current.tagline || current.subtitle}
                        </p>

                        {/* Bank Card Offer Strip */}
                        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
                            <CreditCard className="h-3.5 w-3.5 text-amber-300" />
                            <span>{current.bankOffer}</span>
                        </div>

                        <div className="pt-2">
                            <Link
                                to={current.link || '/shop'}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-gray-900 shadow-md transition hover:bg-amber-100 active:scale-95"
                            >
                                Shop Now <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Hero Product Visual */}
                    <div className="relative z-10 mt-4 flex items-center justify-center md:col-span-5 md:mt-0">
                        <div className="relative aspect-4/3 w-full max-w-[280px] overflow-hidden rounded-2xl border-2 border-white/30 bg-white/10 p-2 shadow-2xl backdrop-blur-sm sm:max-w-[320px]">
                            <img
                                src={current.image}
                                alt={current.title}
                                className="h-full w-full rounded-xl object-cover"
                            />
                        </div>
                    </div>

                    {/* Navigation Arrow Controls */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
                        title="Previous Slide"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
                        title="Next Slide"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {/* Carousel Indicator Dots */}
                <div className="flex justify-center gap-1.5 bg-black/80 py-2">
                    {banners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 rounded-full transition-all ${
                                currentIndex === idx ? 'w-6 bg-orange-500' : 'w-1.5 bg-white/40'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Wide Sponsored Banner (Matching Mivi One 5G Banner in User Screenshot) */}
            <div className="mt-4 overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-[#171717] via-[#262626] to-[#171717] p-4 text-white shadow-md sm:p-6">
                <div className="relative flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div className="space-y-1 text-center md:text-left">
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400">
                            AD • FESTIVE SPECIAL
                        </span>
                        <h3 className="text-xl font-black sm:text-2xl">
                            Mivi One 5G Smartphone
                        </h3>
                        <p className="text-2xl font-black text-amber-400 sm:text-3xl">
                            From ₹11,999*
                        </p>
                        <p className="text-[11px] text-gray-400">
                            120Hz Ultra Smooth Display • 50MP AI Camera • Frosted Back Design
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <img
                            src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&q=80"
                            alt="Mivi One 5G"
                            className="h-24 w-36 rounded-2xl object-cover shadow-lg border border-white/10"
                        />
                        <Link
                            to="/shop?category=Mobiles"
                            className="rounded-xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-orange-600 active:scale-95"
                        >
                            Explore →
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroBannerSlider;
