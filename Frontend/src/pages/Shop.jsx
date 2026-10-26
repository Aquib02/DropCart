import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import ProductCard from '../components/ProductCard';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get(
                    `${API_BASE_URL}/api/products`
                );
                setProducts(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* Shop Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1 w-8 rounded-full bg-orange-500" />

                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                                MyStore Collection
                            </span>
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                            All Products
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Explore our latest products and find something you love.
                        </p>
                    </div>

                    {/* Product Count */}
                    {!loading && (
                        <div className="w-fit rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
                            <span className="text-xs font-bold text-gray-400">
                                PRODUCTS
                            </span>
                            <span className="ml-2 text-sm font-black text-gray-900">
                                {products.length}
                            </span>
                        </div>
                    )}
                </div>

                {/* Top Divider */}
                <div className="mb-7 h-px bg-gray-200" />

                {loading ? (
                    /* Loading Skeleton */
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {[...Array(10)].map((_, index) => (
                            <div
                                key={index}
                                className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white"
                            >
                                <div className="aspect-square bg-gray-200" />

                                <div className="space-y-3 p-4">
                                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                                    <div className="h-4 w-4/5 rounded bg-gray-200" />
                                    <div className="h-5 w-1/3 rounded bg-gray-200" />
                                    <div className="h-8 rounded bg-gray-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
                        {products.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Shop;