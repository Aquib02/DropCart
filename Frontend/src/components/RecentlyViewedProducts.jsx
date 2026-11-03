import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

export const recordRecentlyViewed = (product) => {
    if (!product || !product._id) return;
    try {
        const saved = localStorage.getItem('dropcart_recently_viewed');
        let list = saved ? JSON.parse(saved) : [];
        // Remove duplicate if exists
        list = list.filter((p) => p._id !== product._id);
        // Prepend current product
        list.unshift({
            _id: product._id,
            name: product.name,
            brand: product.brand,
            image: product.image,
            category: product.category,
            price: product.price,
            originalPrice: product.originalPrice,
            discountPercent: product.discountPercent,
            countInStock: product.countInStock,
            isOutOfStock: product.isOutOfStock,
            rating: product.rating,
            numReviews: product.numReviews,
            tag: product.tag,
        });
        // Keep up to 8 items
        list = list.slice(0, 8);
        localStorage.setItem('dropcart_recently_viewed', JSON.stringify(list));
    } catch (e) {
        console.error('Failed to record recently viewed product', e);
    }
};

const RecentlyViewedProducts = ({ currentProductId = null }) => {
    const [recentItems, setRecentItems] = useState([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('dropcart_recently_viewed');
            if (saved) {
                let parsed = JSON.parse(saved);
                if (currentProductId) {
                    parsed = parsed.filter((p) => p._id !== currentProductId);
                }
                setRecentItems(parsed);
            }
        } catch {
            setRecentItems([]);
        }
    }, [currentProductId]);

    if (!recentItems || recentItems.length === 0) return null;

    return (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
            <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <History className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
                                Recently Viewed
                            </h2>
                            <p className="text-xs text-gray-500">Pick up right where you left off</p>
                        </div>
                    </div>

                    <Link
                        to="/shop"
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                        Browse Catalog <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {recentItems.slice(0, 4).map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RecentlyViewedProducts;
