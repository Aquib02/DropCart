import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { Heart, Star, ShoppingBag, Eye, Check } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { AuthContext } from '../context/AuthContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(CartContext);
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [added, setAdded] = useState(false);
    const isWishlisted = isInWishlist(product._id);
    const isOutOfStock = product.isOutOfStock || product.countInStock <= 0;

    const handleWishlistClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate(`/login?redirect=shop`);
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

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
            {/* Image Container */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                <Link to={`/product/${product._id}`} className="block h-full w-full">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                </Link>

                {/* Category Pill */}
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-sm backdrop-blur-sm">
                    {product.category}
                </div>

                {/* Wishlist Heart Button */}
                <button
                    onClick={handleWishlistClick}
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
                        isWishlisted
                            ? 'bg-rose-500 text-white hover:bg-rose-600'
                            : 'bg-white/90 text-gray-600 hover:bg-white hover:text-rose-500'
                    }`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Stock Out Overlay if zero stock */}
                {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Product Body */}
            <div className="flex flex-1 flex-col p-4">
                {/* Rating & Stock Status */}
                <div className="mb-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-semibold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{product.rating > 0 ? product.rating.toFixed(1) : 'New'}</span>
                        {product.numReviews > 0 && (
                            <span className="text-[10px] text-gray-400">({product.numReviews})</span>
                        )}
                    </div>

                    {!isOutOfStock ? (
                        product.countInStock <= 5 ? (
                            <span className="text-[10px] font-bold text-amber-600">
                                Only {product.countInStock} left!
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold text-emerald-600">In Stock</span>
                        )
                    ) : (
                        <span className="text-[10px] font-bold text-rose-600">Unavailable</span>
                    )}
                </div>

                {/* Product Title */}
                <Link to={`/product/${product._id}`}>
                    <h3 className="line-clamp-1 text-sm font-bold text-gray-900 transition hover:text-orange-600">
                        {product.name}
                    </h3>
                </Link>

                {/* Price */}
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-black text-gray-900">₹{product.price}</span>
                </div>

                {/* Quick Action Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                        to={`/product/${product._id}`}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                    </Link>

                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
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
        </div>
    );
};

export default ProductCard;
