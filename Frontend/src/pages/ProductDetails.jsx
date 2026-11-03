import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { AuthContext } from '../context/AuthContext';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
    const { user } = useContext(AuthContext);

    const [product, setProduct] = useState(null);
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(true);

    // Review form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewMessage, setReviewMessage] = useState({ text: '', type: '' });

    const isWishlisted = isInWishlist(id);

    const fetchProduct = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/products/${id}`);
            setProduct(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching product:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
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
            fetchProduct();
            setReviewLoading(false);
        } catch (error) {
            setReviewLoading(false);
            setReviewMessage({
                text: error.response?.data?.message || 'Failed to submit review',
                type: 'error',
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f8f6] px-4 py-12">
                <div className="mx-auto max-w-5xl animate-pulse">
                    <div className="grid grid-cols-1 gap-8 rounded-3xl border border-gray-200 bg-white p-6 md:grid-cols-2">
                        <div className="aspect-square rounded-2xl bg-gray-200" />
                        <div className="space-y-4 py-4">
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
            <div className="min-h-screen bg-[#f8f8f6] px-4 py-16 text-center">
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

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Back button */}
                <Link
                    to="/shop"
                    className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-gray-600 transition hover:text-orange-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to All Products
                </Link>

                {/* Main Product Card */}
                <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-2">
                    {/* Left: Product Image */}
                    <div className="relative flex items-center justify-center bg-gray-50/70 p-6 sm:p-10">
                        <div className="relative aspect-square w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-md">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                            />

                            {/* Category Badge */}
                            <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-800 shadow backdrop-blur-sm">
                                {product.category}
                            </div>

                            {/* Wishlist Button */}
                            <button
                                onClick={handleWishlistClick}
                                className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition ${
                                    isWishlisted
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-white/90 text-gray-600 hover:text-rose-500'
                                }`}
                                title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                            >
                                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                        <div>
                            {/* Category & Rating */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
                                    {product.category}
                                </span>

                                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                                    <span>{product.rating > 0 ? product.rating.toFixed(1) : 'New'}</span>
                                    <span className="text-[10px] text-gray-400">
                                        ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})
                                    </span>
                                </div>
                            </div>

                            {/* Product Title */}
                            <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                                {product.name}
                            </h1>

                            {/* Price */}
                            <div className="mt-4 flex items-center gap-3">
                                <span className="text-3xl font-black text-gray-900">
                                    ₹{product.price}
                                </span>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                    Guaranteed Best Price
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="my-6 h-px bg-gray-100" />

                            {/* Description */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Product Description
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                    {product.description}
                                </p>
                            </div>

                            {/* Stock Indicator */}
                            <div className="mt-6">
                                <span
                                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                                        isOutOfStock
                                            ? 'bg-rose-50 text-rose-700'
                                            : product.countInStock <= 5
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-emerald-50 text-emerald-700'
                                    }`}
                                >
                                    <span
                                        className={`h-2 w-2 rounded-full ${
                                            isOutOfStock
                                                ? 'bg-rose-500'
                                                : product.countInStock <= 5
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500'
                                        }`}
                                    />
                                    {isOutOfStock
                                        ? 'Out of Stock'
                                        : product.countInStock <= 5
                                        ? `Only ${product.countInStock} items remaining!`
                                        : `In Stock (${product.countInStock} units available)`}
                                </span>
                            </div>
                        </div>

                        {/* Quantity and Add to Cart Section */}
                        <div className="mt-8 border-t border-gray-100 pt-6">
                            {!isOutOfStock && (
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-gray-700">
                                        Quantity
                                    </span>
                                    <select
                                        value={qty}
                                        onChange={(e) => setQty(Number(e.target.value))}
                                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white"
                                    >
                                        {[...Array(Math.min(product.countInStock, 10)).keys()].map((x) => (
                                            <option key={x + 1} value={x + 1}>
                                                Qty: {x + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    onClick={addToCartHandler}
                                    disabled={isOutOfStock}
                                    className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold text-white shadow-sm transition ${
                                        isOutOfStock
                                            ? 'cursor-not-allowed bg-gray-300'
                                            : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
                                    }`}
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    {isOutOfStock ? 'Currently Unavailable' : 'Add to Bag'}
                                </button>

                                <button
                                    onClick={handleWishlistClick}
                                    className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 text-xs font-bold transition ${
                                        isWishlisted
                                            ? 'border-rose-200 bg-rose-50 text-rose-600'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                                    {isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-gray-100 pt-6 text-center text-gray-500">
                                <div>
                                    <Truck className="mx-auto h-4 w-4 text-orange-500" />
                                    <p className="mt-1 text-[10px] font-bold uppercase">Fast Shipping</p>
                                </div>
                                <div>
                                    <ShieldCheck className="mx-auto h-4 w-4 text-emerald-500" />
                                    <p className="mt-1 text-[10px] font-bold uppercase">Original Item</p>
                                </div>
                                <div>
                                    <CheckCircle2 className="mx-auto h-4 w-4 text-blue-500" />
                                    <p className="mt-1 text-[10px] font-bold uppercase">Easy Returns</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Reviews & Feedback Section */}
                <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Customer Ratings & Reviews</h2>
                            <p className="text-xs text-gray-500">
                                Verified feedback from shoppers who purchased this item
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center gap-1 font-black text-amber-500">
                                <Star className="h-5 w-5 fill-current" />
                                <span className="text-xl text-gray-900">{product.rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-400">/ 5.0</span>
                            </div>
                            <p className="text-[10px] text-gray-400">{product.numReviews} ratings</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* Left: Customer Reviews List */}
                        <div className="space-y-4 lg:col-span-7">
                            {product.reviews && product.reviews.length > 0 ? (
                                product.reviews.map((rev) => (
                                    <div
                                        key={rev._id}
                                        className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                                                    {rev.name ? rev.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <span className="text-xs font-bold text-gray-900">
                                                    {rev.name}
                                                </span>
                                            </div>

                                            <div className="flex items-center text-amber-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-3 w-3 ${
                                                            i < rev.rating
                                                                ? 'fill-current text-amber-400'
                                                                : 'text-gray-200'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <p className="mt-2 text-xs leading-relaxed text-gray-600">
                                            {rev.comment}
                                        </p>
                                        <p className="mt-2 text-[10px] text-gray-400">
                                            {new Date(rev.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="py-8 text-center text-xs text-gray-400">
                                    No reviews yet. Be the first to share your experience!
                                </p>
                            )}
                        </div>

                        {/* Right: Write a Review Form */}
                        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5 lg:col-span-5">
                            <h3 className="text-sm font-black text-gray-900">Write a Customer Review</h3>
                            <p className="mt-0.5 text-[11px] text-gray-500">
                                Share your thoughts to help other shoppers
                            </p>

                            {reviewMessage.text && (
                                <div
                                    className={`mt-3 rounded-xl p-3 text-xs font-bold ${
                                        reviewMessage.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-rose-50 text-rose-700'
                                    }`}
                                >
                                    {reviewMessage.text}
                                </div>
                            )}

                            {user ? (
                                <form onSubmit={submitReviewHandler} className="mt-4 space-y-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-gray-700">
                                            Your Rating
                                        </label>
                                        <select
                                            value={rating}
                                            onChange={(e) => setRating(Number(e.target.value))}
                                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-orange-500"
                                        >
                                            <option value={5}>⭐⭐⭐⭐⭐ (5 - Outstanding)</option>
                                            <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                                            <option value={3}>⭐⭐⭐ (3 - Good)</option>
                                            <option value={2}>⭐⭐ (2 - Fair)</option>
                                            <option value={1}>⭐ (1 - Poor)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-gray-700">
                                            Feedback & Comments
                                        </label>
                                        <textarea
                                            rows="3"
                                            required
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="What did you like or dislike about this product?"
                                            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-500"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={reviewLoading}
                                        className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
                                    >
                                        {reviewLoading ? 'Submitting...' : 'Post Review'}
                                    </button>
                                </form>
                            ) : (
                                <div className="mt-4 rounded-xl bg-white p-4 text-center">
                                    <p className="text-xs text-gray-600">
                                        Please sign in to your customer account to submit a review.
                                    </p>
                                    <Link
                                        to={`/login?redirect=product/${id}`}
                                        className="mt-3 inline-block rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow transition hover:bg-orange-600"
                                    >
                                        Sign In to Review
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
