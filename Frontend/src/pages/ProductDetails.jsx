import { useState, useEffect, useContext, useId } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Star,
    Heart,
    ShoppingBag,
    Truck,
    ShieldCheck,
    CheckCircle2,
    Scale,
    Bell,
    Share2,
    Sparkles,
    Check,
    Plus,
    X,
    ChevronRight,
    ZoomIn,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { AuthContext } from '../context/AuthContext';
import { CompareContext } from '../context/CompareContext';
import RecentlyViewedProducts, { recordRecentlyViewed } from '../components/RecentlyViewedProducts';
import AIReviewSummary from '../components/AIReviewSummary';
import ImageLightboxModal from '../components/ImageLightboxModal';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const emailInputId = useId();
    const targetPriceInputId = useId();
    const { addToCart } = useContext(CartContext);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
    const { user } = useContext(AuthContext);
    const { addToCompare, removeFromCompare, isInCompare } = useContext(CompareContext) || {};

    const [product, setProduct] = useState(null);
    const [relatedData, setRelatedData] = useState({ similar: [], frequentlyBoughtTogether: [] });
    const [activeImage, setActiveImage] = useState('');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [selectedVariants, setSelectedVariants] = useState({});
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(true);
    const [copiedShare, setCopiedShare] = useState(false);

    // Price drop alert modal state
    const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
    const [alertEmail, setAlertEmail] = useState(user?.email || '');
    const [targetPrice, setTargetPrice] = useState('');
    const [alertMessage, setAlertMessage] = useState({ text: '', type: '' });
    const [alertLoading, setAlertLoading] = useState(false);

    // Review form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewMessage, setReviewMessage] = useState({ text: '', type: '' });

    // Active spec tab
    const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'reviews'

    const isWishlisted = isInWishlist(id);
    const isCompared = isInCompare ? isInCompare(id) : false;

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setLoading(true);
                const [productRes, relatedRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/products/${id}`),
                    axios.get(`${API_BASE_URL}/api/products/${id}/related`).catch(() => ({ data: { similar: [], frequentlyBoughtTogether: [] } })),
                ]);

                const prod = productRes.data;
                setProduct(prod);
                setRelatedData(relatedRes.data || { similar: [], frequentlyBoughtTogether: [] });
                setActiveImage(prod.images && prod.images.length > 0 ? prod.images[0] : prod.image);

                // Initialize default variants
                if (Array.isArray(prod.variants) && prod.variants.length > 0) {
                    const initialVariants = {};
                    prod.variants.forEach((v) => {
                        if (v.options && v.options.length > 0) {
                            initialVariants[v.name] = v.options[0];
                        }
                    });
                    setSelectedVariants(initialVariants);
                }

                // Default target price for alert (10% less)
                if (prod.price) {
                    setTargetPrice(Math.round(prod.price * 0.9));
                }

                // Record in recently viewed
                recordRecentlyViewed(prod);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching product details:', error);
                setLoading(false);
            }
        };

        fetchProductData();
        window.scrollTo(0, 0);
    }, [id]);

    const addToCartHandler = () => {
        if (!product || product.isOutOfStock || product.countInStock <= 0) return;
        addToCart(product, Number(qty));
        navigate('/cart');
    };

    const handleWishlistClick = async () => {
        if (!user) {
            navigate(`/login?redirect=product/${id}`);
            return;
        }
        await toggleWishlist(product);
    };

    const handleCompareClick = () => {
        if (!addToCompare) return;
        if (isCompared) {
            removeFromCompare(product._id);
        } else {
            addToCompare(product);
        }
    };

    const handleShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopiedShare(true);
            setTimeout(() => setCopiedShare(false), 2500);
        }
    };

    const handlePriceAlertSubmit = async (e) => {
        e.preventDefault();
        setAlertLoading(true);
        setAlertMessage({ text: '', type: '' });

        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/alerts/price-drop`, {
                productId: id,
                email: alertEmail,
                targetPrice: Number(targetPrice),
            });

            setAlertMessage({ text: data.message, type: 'success' });
            setAlertLoading(false);
            setTimeout(() => setShowPriceAlertModal(false), 2500);
        } catch (error) {
            setAlertLoading(false);
            setAlertMessage({
                text: error.response?.data?.message || 'Failed to create price alert',
                type: 'error',
            });
        }
    };

    const submitReviewHandler = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate(`/login?redirect=product/${id}`);
            return;
        }

        setReviewLoading(true);
        setReviewMessage({ text: '', type: '' });

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };

            await axios.post(
                `${API_BASE_URL}/api/products/${id}/reviews`,
                { rating, comment },
                config
            );

            setReviewMessage({ text: 'Review submitted successfully! Thank you.', type: 'success' });
            setComment('');
            setRating(5);
            // Refresh product to show new review
            const { data } = await axios.get(`${API_BASE_URL}/api/products/${id}`);
            setProduct(data);
            setReviewLoading(false);
        } catch (error) {
            setReviewLoading(false);
            setReviewMessage({
                text: error.response?.data?.message || 'Failed to submit review',
                type: 'error',
            });
        }
    };

    // Calculate rating breakdown (counts for 5, 4, 3, 2, 1 stars)
    const getRatingBreakdown = () => {
        const reviews = product?.reviews || [];
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach((r) => {
            const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
            counts[star] = (counts[star] || 0) + 1;
        });
        const total = reviews.length || 1;
        return {
            counts,
            percentages: {
                5: Math.round((counts[5] / total) * 100),
                4: Math.round((counts[4] / total) * 100),
                3: Math.round((counts[3] / total) * 100),
                2: Math.round((counts[2] / total) * 100),
                1: Math.round((counts[1] / total) * 100),
            },
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f1f3f6] px-4 py-8">
                <div className="mx-auto max-w-7xl animate-pulse">
                    <div className="grid grid-cols-1 gap-8 rounded-3xl border border-gray-200 bg-white p-8 md:grid-cols-12">
                        <div className="md:col-span-5 aspect-square rounded-2xl bg-gray-200" />
                        <div className="md:col-span-7 space-y-4 py-4">
                            <div className="h-6 w-1/4 rounded bg-gray-200" />
                            <div className="h-8 w-3/4 rounded bg-gray-200" />
                            <div className="h-6 w-1/3 rounded bg-gray-200" />
                            <div className="h-24 rounded bg-gray-200" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#f1f3f6] px-4 py-16 text-center">
                <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
                <Link
                    to="/shop"
                    className="mt-4 inline-block rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow"
                >
                    Back to Shop
                </Link>
            </div>
        );
    }

    const isOutOfStock = product.isOutOfStock || product.countInStock <= 0;
    const galleryImages =
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : [product.image];

    const ratingBreakdown = getRatingBreakdown();

    // Bundle recommendation calculation
    const bundleProduct = relatedData.frequentlyBoughtTogether?.[0];
    const bundleTotal = bundleProduct ? product.price + bundleProduct.price : product.price;
    const bundleDiscountPrice = bundleProduct ? Math.round(bundleTotal * 0.95) : product.price; // extra 5% bundle discount

    return (
        <div className="min-h-screen bg-[#f1f3f6] pb-16">
            {/* Breadcrumb strip */}
            <div className="bg-white border-b border-gray-200">
                <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-xs text-gray-500 sm:px-6">
                    <Link to="/" className="hover:text-blue-600">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-blue-600">
                        {product.category}
                    </Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="truncate max-w-[200px] sm:max-w-md font-bold text-gray-900">{product.name}</span>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
                {/* Main Product Showcase Card */}
                <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-8">
                        {/* LEFT COLUMN: Gallery & Thumbnails (5 cols) */}
                        <div className="md:col-span-5 flex flex-col sm:flex-row gap-4">
                            {/* Thumbnails strip */}
                            {galleryImages.length > 1 && (
                                <div className="flex sm:flex-col gap-2 order-2 sm:order-1 overflow-x-auto">
                                    {galleryImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(img)}
                                            className={`h-16 w-16 shrink-0 rounded-xl border-2 p-1 bg-gray-50 transition ${
                                                activeImage === img
                                                    ? 'border-blue-600 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <img src={img} alt="" className="h-full w-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Main Active Visual with hover zoom */}
                            <div
                                onClick={() => {
                                    const currentSrc = activeImage || product.image;
                                    const idx = galleryImages.findIndex(img => img === currentSrc);
                                    setLightboxIndex(idx >= 0 ? idx : 0);
                                    setIsLightboxOpen(true);
                                }}
                                className="relative flex-1 order-1 sm:order-2 aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/60 p-4 group cursor-zoom-in"
                                title="Click to view enlarged image"
                            >
                                <img
                                    src={activeImage || product.image}
                                    alt={product.name}
                                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                                />

                                {/* Click to Enlarge Badge */}
                                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-[11px] font-black text-white shadow-lg backdrop-blur-xs transition-all duration-300 group-hover:bg-orange-600 group-hover:scale-105">
                                    <ZoomIn className="h-3.5 w-3.5" />
                                    <span>Click to Enlarge</span>
                                </div>

                                {/* Tag Badge */}
                                {product.tag && (
                                    <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-[10px] font-black uppercase text-gray-950 shadow-sm">
                                        <Sparkles className="h-3 w-3" />
                                        {product.tag}
                                    </div>
                                )}

                                {/* Out of stock badge */}
                                {isOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                                        <span className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-black uppercase text-white shadow-xl">
                                            Out of Stock
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Details, Pricing, Variants & Purchase Actions (7 cols) */}
                        <div className="md:col-span-7 flex flex-col justify-between space-y-5">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
                                        {product.brand || product.category}
                                    </span>

                                    {/* Action buttons: Wishlist, Compare, Share */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={handleWishlistClick}
                                            className={`rounded-xl p-2 border transition ${
                                                isWishlisted
                                                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-rose-600'
                                            }`}
                                            title="Add to Wishlist"
                                        >
                                            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                                        </button>

                                        <button
                                            onClick={handleCompareClick}
                                            className={`rounded-xl p-2 border transition ${
                                                isCompared
                                                    ? 'border-blue-200 bg-blue-50 text-blue-600'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                                            }`}
                                            title="Compare with other products"
                                        >
                                            <Scale className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={() => setShowPriceAlertModal(true)}
                                            className="rounded-xl p-2 border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-amber-600 transition"
                                            title="Set Price Drop Alert"
                                        >
                                            <Bell className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={handleShare}
                                            className="rounded-xl p-2 border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition"
                                            title="Share product"
                                        >
                                            {copiedShare ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <h1 className="mt-2 text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                                    {product.name}
                                </h1>

                                {/* Rating & Review count strip */}
                                <div className="mt-2.5 flex items-center gap-3">
                                    <div className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                                        <span>{product.rating || 4.5}</span>
                                        <Star className="h-3 w-3 fill-current" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500">
                                        {product.numReviews || product.reviews?.length || 0} Ratings & Verified Reviews
                                    </span>
                                    <span className="text-xs text-gray-300">•</span>
                                    <span className="text-xs font-semibold text-blue-600">
                                        {product.views || 140} Views this week
                                    </span>
                                </div>

                                {/* Special Price Strip */}
                                <div className="mt-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 p-4">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-black text-gray-950">
                                            ₹{product.price.toLocaleString('en-IN')}
                                        </span>
                                        {product.originalPrice > product.price && (
                                            <>
                                                <span className="text-sm font-semibold text-gray-400 line-through">
                                                    ₹{product.originalPrice.toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-xs font-black text-emerald-600">
                                                    {product.discountPercent || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <p className="mt-1 text-[11px] font-bold text-amber-800">
                                        ✨ Special Festive Price: Extra 10% instant discount on checkout with coupon <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 text-orange-600">DIWALI10</span>
                                    </p>
                                </div>

                                {/* Dynamic Product Variants Selector */}
                                {Array.isArray(product.variants) && product.variants.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {product.variants.map((variant) => (
                                            <div key={variant.name}>
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                                    Select {variant.name}:
                                                </span>
                                                <div className="mt-1.5 flex flex-wrap gap-2">
                                                    {variant.options.map((option) => (
                                                        <button
                                                            key={option}
                                                            onClick={() =>
                                                                setSelectedVariants((prev) => ({
                                                                    ...prev,
                                                                    [variant.name]: option,
                                                                }))
                                                            }
                                                            className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                                                                selectedVariants[variant.name] === option
                                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Stock & Delivery Status */}
                                <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span className="font-semibold text-gray-700">
                                            Free Express Delivery by{' '}
                                            <span className="font-black text-gray-900">Tomorrow, 9 PM</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span className="text-gray-600">
                                            7 Days Replacement Policy • 1 Year Manufacturer Warranty
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Purchase CTA Buttons */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Quantity Picker */}
                                    <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                                        <span className="mr-3 text-xs font-bold text-gray-500">Qty:</span>
                                        <select
                                            value={qty}
                                            onChange={(e) => setQty(Number(e.target.value))}
                                            disabled={isOutOfStock}
                                            className="bg-transparent text-xs font-bold text-gray-900 outline-none"
                                        >
                                            {[...Array(Math.min(product.countInStock || 10, 5)).keys()].map((x) => (
                                                <option key={x + 1} value={x + 1}>
                                                    {x + 1}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Add to Cart button */}
                                    <button
                                        onClick={addToCartHandler}
                                        disabled={isOutOfStock}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition ${
                                            isOutOfStock
                                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
                                        }`}
                                    >
                                        <ShoppingBag className="h-4 w-4" />
                                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                    </button>

                                    {/* Buy Now button */}
                                    <button
                                        onClick={() => {
                                            if (!isOutOfStock) {
                                                addToCart(product, Number(qty));
                                                navigate('/checkout');
                                            }
                                        }}
                                        disabled={isOutOfStock}
                                        className={`flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-wider transition ${
                                            isOutOfStock
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-amber-400 hover:bg-amber-500 text-gray-950 shadow-md active:scale-95'
                                        }`}
                                    >
                                        ⚡ Buy Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Frequently Bought Together Bundle */}
                {bundleProduct && (
                    <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <h2 className="text-base font-black text-gray-900">Frequently Bought Together</h2>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                                Save Extra 5% Bundle Deal
                            </span>
                        </div>

                        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                                {/* Item 1 */}
                                <div className="flex items-center gap-3">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="h-16 w-16 rounded-xl border border-gray-100 object-contain p-1 bg-gray-50"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 line-clamp-1">{product.name}</p>
                                        <p className="text-xs font-black text-gray-950">₹{product.price.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                <Plus className="h-5 w-5 text-gray-400 shrink-0" />

                                {/* Item 2 */}
                                <div className="flex items-center gap-3">
                                    <img
                                        src={bundleProduct.image}
                                        alt={bundleProduct.name}
                                        className="h-16 w-16 rounded-xl border border-gray-100 object-contain p-1 bg-gray-50"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 line-clamp-1">{bundleProduct.name}</p>
                                        <p className="text-xs font-black text-gray-950">₹{bundleProduct.price.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bundle Checkout */}
                            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
                                <div>
                                    <span className="text-[10px] text-gray-500 block">Total Bundle Price:</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-black text-gray-950">₹{bundleDiscountPrice.toLocaleString('en-IN')}</span>
                                        <span className="text-xs text-gray-400 line-through">₹{bundleTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        addToCart(product, 1);
                                        addToCart(bundleProduct, 1);
                                        navigate('/cart');
                                    }}
                                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
                                >
                                    Add Both to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs Strip: Specifications vs Verified Reviews */}
                <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                    <div className="flex border-b border-gray-200 bg-gray-50/60">
                        <button
                            onClick={() => setActiveTab('specs')}
                            className={`px-6 py-3.5 text-xs font-black uppercase tracking-wider transition border-b-2 ${
                                activeTab === 'specs'
                                    ? 'border-blue-600 text-blue-600 bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Technical Specifications
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-6 py-3.5 text-xs font-black uppercase tracking-wider transition border-b-2 ${
                                activeTab === 'reviews'
                                    ? 'border-blue-600 text-blue-600 bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Ratings & Reviews ({product.reviews?.length || 0})
                        </button>
                    </div>

                    <div className="p-6 sm:p-8">
                        {/* SPECIFICATIONS TAB */}
                        {activeTab === 'specs' && (
                            <div className="space-y-6">
                                {Array.isArray(product.specifications) && product.specifications.length > 0 ? (
                                    product.specifications.map((group, gIdx) => (
                                        <div key={gIdx} className="overflow-hidden rounded-2xl border border-gray-100">
                                            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">
                                                    {group.groupName || 'General Details'}
                                                </h3>
                                            </div>
                                            <table className="w-full text-left text-xs divide-y divide-gray-100">
                                                <tbody>
                                                    {group.items?.map((item, iIdx) => (
                                                        <tr key={iIdx} className="hover:bg-gray-50/40">
                                                            <td className="w-1/3 px-4 py-3 font-semibold text-gray-500">{item.key}</td>
                                                            <td className="w-2/3 px-4 py-3 font-medium text-gray-900">{item.value}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))
                                ) : (
                                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                                        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                                            <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">General</h3>
                                        </div>
                                        <table className="w-full text-left text-xs divide-y divide-gray-100">
                                            <tbody>
                                                <tr>
                                                    <td className="w-1/3 px-4 py-3 font-semibold text-gray-500">Brand</td>
                                                    <td className="w-2/3 px-4 py-3 font-medium text-gray-900">{product.brand || 'DropCart'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="w-1/3 px-4 py-3 font-semibold text-gray-500">Category</td>
                                                    <td className="w-2/3 px-4 py-3 font-medium text-gray-900">{product.category}</td>
                                                </tr>
                                                <tr>
                                                    <td className="w-1/3 px-4 py-3 font-semibold text-gray-500">Description</td>
                                                    <td className="w-2/3 px-4 py-3 font-medium text-gray-900">{product.description}</td>
                                                </tr>
                                                <tr>
                                                    <td className="w-1/3 px-4 py-3 font-semibold text-gray-500">Warranty</td>
                                                    <td className="w-2/3 px-4 py-3 font-medium text-gray-900">1 Year Manufacturer Warranty</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <div>
                                <AIReviewSummary productId={product._id} />
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Rating Breakdown Column */}
                                <div className="lg:col-span-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl font-black text-gray-950">{product.rating || 4.5}</span>
                                        <div>
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < Math.round(product.rating || 4.5) ? 'fill-current' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Based on {product.reviews?.length || 0} reviews
                                            </p>
                                        </div>
                                    </div>

                                    {/* Star Rating Bars */}
                                    <div className="mt-5 space-y-2 text-xs">
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <div key={star} className="flex items-center gap-2">
                                                <span className="w-3 font-bold text-gray-600">{star}★</span>
                                                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                                    <div
                                                        style={{ width: `${ratingBreakdown.percentages[star]}%` }}
                                                        className={`h-full ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    />
                                                </div>
                                                <span className="w-6 text-right text-[10px] text-gray-400">
                                                    {ratingBreakdown.counts[star]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Reviews List & Write Review */}
                                <div className="lg:col-span-8 space-y-6">
                                    {/* Write Review Form */}
                                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                        <h3 className="text-sm font-black text-gray-900">Write a Review</h3>
                                        <p className="text-xs text-gray-500">Share your experience with other customers</p>

                                        {reviewMessage.text && (
                                            <div
                                                className={`mt-3 rounded-xl p-3 text-xs font-bold ${
                                                    reviewMessage.type === 'success'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}
                                            >
                                                {reviewMessage.text}
                                            </div>
                                        )}

                                        <form onSubmit={submitReviewHandler} className="mt-4 space-y-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-gray-600 uppercase">Your Rating</label>
                                                <div className="flex gap-1.5 mt-1">
                                                    {[1, 2, 3, 4, 5].map((val) => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => setRating(val)}
                                                            className={`p-1.5 rounded-lg border transition ${
                                                                val <= rating
                                                                    ? 'border-amber-400 bg-amber-50 text-amber-500'
                                                                    : 'border-gray-200 text-gray-300'
                                                            }`}
                                                        >
                                                            <Star className="h-5 w-5 fill-current" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-bold text-gray-600 uppercase">Review Comment</label>
                                                <textarea
                                                    required
                                                    rows={3}
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    placeholder="What did you like or dislike about this product? How is the quality?"
                                                    className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-xs outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={reviewLoading}
                                                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                                            >
                                                {reviewLoading ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Existing Reviews List */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-black text-gray-900">Verified Customer Reviews</h3>
                                        {product.reviews && product.reviews.length > 0 ? (
                                            product.reviews.map((rev, index) => (
                                                <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                                                {rev.name ? rev.name[0].toUpperCase() : 'U'}
                                                            </span>
                                                            <span className="text-xs font-bold text-gray-900">{rev.name}</span>
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                                                                <CheckCircle2 className="h-3 w-3" /> Verified Buyer
                                                            </span>
                                                        </div>
                                                        <div className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                            <span>{rev.rating}</span>
                                                            <Star className="h-2.5 w-2.5 fill-current" />
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                                                    <span className="mt-1.5 block text-[10px] text-gray-400">
                                                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-500 py-4">No reviews yet. Be the first to review this product!</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                </div>

                {/* Recently Viewed Strip */}
                <RecentlyViewedProducts currentProductId={id} />
            </main>

            {/* Price Drop Alert Modal */}
            {showPriceAlertModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <h3 className="text-sm font-black text-gray-900">Set Price Drop Alert</h3>
                            </div>
                            <button
                                onClick={() => setShowPriceAlertModal(false)}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                            We will notify you immediately by email when the price of this product drops below your desired target price.
                        </p>

                        {alertMessage.text && (
                            <div
                                className={`mt-3 rounded-xl p-3 text-xs font-bold ${
                                    alertMessage.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                            >
                                {alertMessage.text}
                            </div>
                        )}

                        <form onSubmit={handlePriceAlertSubmit} className="mt-4 space-y-3">
                            <div>
                                <label htmlFor={emailInputId} className="text-[11px] font-bold uppercase text-gray-600">Email Address</label>
                                <input
                                    id={emailInputId}
                                    type="email"
                                    required
                                    value={alertEmail}
                                    onChange={(e) => setAlertEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor={targetPriceInputId} className="text-[11px] font-bold uppercase text-gray-600">
                                    Target Price (Current: ₹{product.price.toLocaleString('en-IN')})
                                </label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                                    <input
                                        id={targetPriceInputId}
                                        type="number"
                                        required
                                        max={product.price - 1}
                                        value={targetPrice}
                                        onChange={(e) => setTargetPrice(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 pl-7 pr-3 py-2 text-xs outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={alertLoading}
                                className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition"
                            >
                                {alertLoading ? 'Saving Alert...' : 'Notify Me on Price Drop'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* High-Resolution Full-Screen Image Lightbox Modal */}
            <ImageLightboxModal
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                images={galleryImages}
                initialIndex={lightboxIndex}
                productTitle={product?.name}
                productPrice={product?.price}
            />
        </div>
    );
};

export default ProductDetails;
