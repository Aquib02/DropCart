import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import ProductCard from '../components/ProductCard';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/products`);
                setProducts(data.slice(0, 4)); // Show top 4 featured products
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="min-h-screen bg-[#f8f8f6] pb-16">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#171717] px-6 py-16 text-white sm:px-10 lg:px-16">
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

                <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
                    <div className="max-w-2xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-400">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            New Collection
                        </div>

                        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Everything You
                            <span className="block text-orange-500">
                                Love. In One Place.
                            </span>
                        </h1>

                        <p className="mt-5 max-w-xl text-base leading-7 text-gray-400 sm:text-lg">
                            Discover quality products at great prices. From
                            everyday essentials to the latest trends, find
                            everything you need at MyStore.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                to="/shop"
                                className="group inline-flex items-center rounded-lg bg-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all duration-200 hover:bg-orange-600 hover:shadow-orange-500/30"
                            >
                                Shop Now
                                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                                    →
                                </span>
                            </Link>

                            <Link
                                to="/shop"
                                className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
                            >
                                Browse Products
                            </Link>
                        </div>

                        <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-gray-400">
                            <span className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Quality Products
                            </span>

                            <span className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Great Prices
                            </span>

                            <span className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Secure Shopping
                            </span>
                        </div>
                    </div>

                    <div className="relative hidden lg:block">
                        <div className="relative mx-auto h-80 w-80 rounded-full border border-white/10 bg-white/[0.03]">
                            <div className="absolute inset-8 flex items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/5">
                                <div className="text-center">
                                    <div className="text-7xl">🛍️</div>

                                    <p className="mt-3 text-sm font-bold text-gray-300">
                                        Shop. Choose. Enjoy.
                                    </p>
                                </div>
                            </div>

                            <div className="absolute -right-4 top-12 rounded-lg bg-white px-4 py-3 text-xs font-bold text-gray-900 shadow-xl">
                                Best Prices
                            </div>

                            <div className="absolute -bottom-3 left-2 rounded-lg bg-orange-500 px-4 py-3 text-xs font-bold text-white shadow-xl">
                                Shop Now →
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1 w-8 rounded-full bg-orange-500" />

                            <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                                Trending Now
                            </p>
                        </div>

                        <h2 className="text-3xl font-black tracking-tight text-gray-900">
                            Featured Products
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Popular picks selected for you.
                        </p>
                    </div>

                    <Link
                        to="/shop"
                        className="group flex w-fit items-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-orange-200 hover:text-orange-600"
                    >
                        View All
                        <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                            →
                        </span>
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                            >
                                <div className="h-52 animate-pulse bg-gray-200" />

                                <div className="space-y-3 p-5">
                                    <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                                    <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
                                    <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />
                                    <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;