import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { X, Scale, ShoppingBag, Star, Check, AlertCircle } from 'lucide-react';
import { CompareContext } from '../context/CompareContext';
import { CartContext } from '../context/CartContext';

const CompareDrawer = () => {
    const {
        compareItems,
        removeFromCompare,
        clearCompare,
        isCompareModalOpen,
        setIsCompareModalOpen,
    } = useContext(CompareContext);

    const { addToCart } = useContext(CartContext);

    if (compareItems.length === 0) return null;

    // Collect all unique specification keys across all items in comparison
    const allSpecKeys = [];
    compareItems.forEach((product) => {
        if (Array.isArray(product.specifications)) {
            product.specifications.forEach((group) => {
                if (Array.isArray(group.items)) {
                    group.items.forEach((item) => {
                        if (!allSpecKeys.includes(item.key)) {
                            allSpecKeys.push(item.key);
                        }
                    });
                }
            });
        }
    });

    const getProductSpecValue = (product, key) => {
        if (!Array.isArray(product.specifications)) return '—';
        for (const group of product.specifications) {
            if (Array.isArray(group.items)) {
                const found = group.items.find((i) => i.key.toLowerCase() === key.toLowerCase());
                if (found) return found.value;
            }
        }
        return '—';
    };

    return (
        <>
            {/* Floating Bottom Comparison Dock */}
            {!isCompareModalOpen && (
                <aside aria-label="Product comparison dock" className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 px-4 py-2.5 shadow-2xl backdrop-blur-md transition-all sm:gap-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                            <Scale className="h-4 w-4" />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-black text-gray-900">Compare Products</p>
                            <p className="text-[10px] text-gray-500">{compareItems.length} of 4 items selected</p>
                        </div>
                    </div>

                    {/* Thumbnail pills */}
                    <div className="flex items-center gap-2">
                        {compareItems.map((prod) => (
                            <div key={prod._id} className="relative group">
                                <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="h-10 w-10 rounded-xl border border-gray-200 object-cover p-0.5 bg-gray-50"
                                />
                                <button
                                    onClick={() => removeFromCompare(prod._id)}
                                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                                    title="Remove"
                                >
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                        <button
                            onClick={() => setIsCompareModalOpen(true)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                        >
                            Compare Now ({compareItems.length})
                        </button>
                        <button
                            onClick={clearCompare}
                            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            title="Clear comparison list"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </aside>
            )}

            {/* Full Side-by-Side Comparison Modal */}
            {isCompareModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6 backdrop-blur-sm">
                    <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                                    <Scale className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900">
                                        Compare Products ({compareItems.length} / 4)
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Side-by-side pricing, ratings, specifications and features
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={clearCompare}
                                    className="text-xs font-bold text-gray-500 hover:text-red-600"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setIsCompareModalOpen(false)}
                                    className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body: Comparison Grid */}
                        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
                            <div className="min-w-[640px]">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr>
                                            <th className="w-1/5 pb-4 pr-4 align-top text-xs font-bold uppercase tracking-wider text-gray-400">
                                                Features
                                            </th>
                                            {compareItems.map((prod) => (
                                                <th key={prod._id} className="w-1/4 pb-4 px-3 align-top">
                                                    <div className="relative rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                                                        <button
                                                            onClick={() => removeFromCompare(prod._id)}
                                                            className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                                                            title="Remove"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                        <img
                                                            src={prod.image}
                                                            alt={prod.name}
                                                            className="mx-auto h-32 w-32 rounded-xl object-contain bg-white p-2"
                                                        />
                                                        <Link
                                                            to={`/product/${prod._id}`}
                                                            onClick={() => setIsCompareModalOpen(false)}
                                                            className="mt-3 block text-xs font-bold text-gray-900 hover:text-blue-600 line-clamp-2"
                                                        >
                                                            {prod.name}
                                                        </Link>
                                                        <div className="mt-2 flex items-baseline gap-2">
                                                            <span className="text-base font-black text-gray-950">
                                                                ₹{prod.price.toLocaleString('en-IN')}
                                                            </span>
                                                            {prod.originalPrice > prod.price && (
                                                                <span className="text-xs text-gray-400 line-through">
                                                                    ₹{prod.originalPrice.toLocaleString('en-IN')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() => addToCart(prod, 1)}
                                                            disabled={prod.isOutOfStock || prod.countInStock === 0}
                                                            className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                                                                prod.isOutOfStock || prod.countInStock === 0
                                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-orange-500 text-white shadow-sm hover:bg-orange-600'
                                                            }`}
                                                        >
                                                            <ShoppingBag className="h-3.5 w-3.5" />
                                                            {prod.isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                                        </button>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                        {/* Row 1: Brand & Category */}
                                        <tr>
                                            <td className="py-3 pr-4 font-bold text-gray-500">Brand / Category</td>
                                            {compareItems.map((prod) => (
                                                <td key={prod._id} className="py-3 px-3">
                                                    <span className="font-semibold text-gray-900">{prod.brand || 'DropCart'}</span>
                                                    <span className="ml-1 text-gray-400">• {prod.category}</span>
                                                </td>
                                            ))}
                                        </tr>

                                        {/* Row 2: Customer Rating */}
                                        <tr>
                                            <td className="py-3 pr-4 font-bold text-gray-500">Rating & Reviews</td>
                                            {compareItems.map((prod) => (
                                                <td key={prod._id} className="py-3 px-3">
                                                    <div className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                                                        <span>{prod.rating || 4.5}</span>
                                                        <Star className="h-3 w-3 fill-current" />
                                                    </div>
                                                    <span className="ml-2 text-gray-400">
                                                        ({prod.numReviews || prod.reviews?.length || 0} reviews)
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>

                                        {/* Row 3: Stock Status */}
                                        <tr>
                                            <td className="py-3 pr-4 font-bold text-gray-500">Availability</td>
                                            {compareItems.map((prod) => (
                                                <td key={prod._id} className="py-3 px-3">
                                                    {prod.isOutOfStock || prod.countInStock === 0 ? (
                                                        <span className="inline-flex items-center gap-1 font-bold text-red-600">
                                                            <AlertCircle className="h-3.5 w-3.5" /> Out of stock
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                                            <Check className="h-3.5 w-3.5" /> In Stock ({prod.countInStock} units)
                                                        </span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>

                                        {/* Row 4: Key Specifications */}
                                        {allSpecKeys.map((specKey) => (
                                            <tr key={specKey} className="hover:bg-gray-50/60">
                                                <td className="py-3 pr-4 font-semibold text-gray-600">{specKey}</td>
                                                {compareItems.map((prod) => (
                                                    <td key={prod._id} className="py-3 px-3 text-gray-900 font-medium">
                                                        {getProductSpecValue(prod, specKey)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}

                                        {/* Row 5: Description summary */}
                                        <tr>
                                            <td className="py-3 pr-4 font-bold text-gray-500">Highlights</td>
                                            {compareItems.map((prod) => (
                                                <td key={prod._id} className="py-3 px-3 text-gray-600 leading-relaxed">
                                                    {prod.description}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CompareDrawer;
