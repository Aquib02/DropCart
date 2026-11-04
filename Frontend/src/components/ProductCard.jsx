import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { Heart, Star, ShoppingBag, Eye, Check, Zap, Scale, ZoomIn } from 'lucide-react';
import ImageLightboxModal from './ImageLightboxModal';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { AuthContext } from '../context/AuthContext';
import { CompareContext } from '../context/CompareContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(CartContext);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
    const { user } = useContext(AuthContext);
    const { addToCompare, removeFromCompare, isInCompare } = useContext(CompareContext) || {};
    const navigate = useNavigate();

    const [added, setAdded] = useState(false);
    const [isEnlargeOpen, setIsEnlargeOpen] = useState(false);
    const isWishlisted = isInWishlist(product._id);
    const isCompared = isInCompare ? isInCompare(product._id) : false;
    const isOutOfStock = product.isOutOfStock || product.countInStock <= 0;

    const handleWishlistClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/login?redirect=shop');
            return;
        }

        await toggleWishlist(product);
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isOutOfStock) return;

        addToCart(product, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    // Calculate discount percent if not stored directly
    const discount =
        product.discountPercent ||
        (product.originalPrice && product.originalPrice > product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0);

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
            {/* Image Container */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-50/50 p-3">
                <Link to={`/product/${product._id}`} className="block h-full w-full">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                </Link>

                {/* Tag / Category Badge */}
                {product.tag ? (
                    <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-gray-950 shadow-sm">
                        <Zap className="h-2.5 w-2.5 fill-current" />
                        {product.tag}
                    </div>
                ) : (
                    <div className="absolute left-2.5 top-2.5 rounded-md bg-gray-900/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                        {product.category}
                    </div>
                )}

                {/* Wishlist Heart Button */}
                <button
                    onClick={handleWishlistClick}
                    aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
                        isWishlisted
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/90 text-gray-500 hover:bg-white hover:text-rose-500'
                    }`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Compare Button */}
                {addToCompare && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isCompared) {
                                removeFromCompare(product._id);
                            } else {
                                addToCompare(product);
                            }
                        }}
                        aria-label={isCompared ? 'Remove from Compare' : 'Add to Compare'}
                        className={`absolute right-2.5 top-12 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
                            isCompared
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/90 text-gray-500 hover:bg-white hover:text-blue-600'
                        }`}
                        title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
                    >
                        <Scale className="h-3.5 w-3.5" />
                    </button>
                )}

                {/* Quick Enlarge / Zoom Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEnlargeOpen(true);
                    }}
                    aria-label="Enlarge Product Image"
                    className="absolute right-2.5 top-[88px] flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md transition-all duration-200 hover:bg-white hover:text-orange-600 opacity-0 group-hover:opacity-100"
                    title="Click to view enlarged image"
                >
                    <ZoomIn className="h-3.5 w-3.5" />
                </button>

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Product Body (Flipkart Styling) */}
            <div className="flex flex-1 flex-col p-3.5 pt-2">
                {/* Brand */}
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {product.brand || product.category}
                </span>

                {/* Title */}
                <Link to={`/product/${product._id}`}>
                    <h3 className="mt-0.5 line-clamp-1 text-xs font-bold text-gray-900 transition hover:text-orange-600 sm:text-sm">
                        {product.name}
                    </h3>
                </Link>

                {/* Rating */}
                <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex items-center text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                    </div>
                    <span className="text-xs font-black text-gray-900">
                        {product.rating ? product.rating.toFixed(1) : '4.5'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        ({product.numReviews ? product.numReviews.toLocaleString() : '120'})
                    </span>
                </div>

                {/* Price Strip */}
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-base font-black text-gray-950 sm:text-lg">
                        ₹{product.price?.toLocaleString()}
                    </span>
                    {product.originalPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through">
                            ₹{product.originalPrice?.toLocaleString()}
                        </span>
                    )}
                    {discount > 0 && (
                        <span className="text-xs font-black text-orange-600">
                            {discount}% off
                        </span>
                    )}
                </div>

                <div className="mt-1 text-[10px] font-semibold text-gray-500">
                    Free Delivery
                </div>

                {/* Action Buttons */}
                <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <Link
                        to={`/product/${product._id}`}
                        className="flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-50 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                    </Link>

                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold transition ${
                            isOutOfStock
                                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                                : added
                                ? 'bg-emerald-600 text-white'
                                : 'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:scale-95'
                        }`}
                    >
                        {added ? (
                            <>
                                <Check className="h-3.5 w-3.5" />
                                Added
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="h-3.5 w-3.5" />
                                Add
                            </>
                        )}
                    </button>
                </div>
            </div>
            {/* Quick View Enlarged Modal */}
            <ImageLightboxModal
                isOpen={isEnlargeOpen}
                onClose={() => setIsEnlargeOpen(false)}
                images={product.images && product.images.length > 0 ? product.images : [product.image]}
                initialIndex={0}
                productTitle={product.name}
                productPrice={product.price}
            />
        </div>
    );
};

export default ProductCard;
