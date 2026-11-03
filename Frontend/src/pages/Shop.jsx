import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialKeyword = searchParams.get('keyword') || '';

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState(initialKeyword);
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
    const [selectedSort, setSelectedSort] = useState('newest');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);

    const handleNLSearch = async (queryToSearch) => {
        const q = queryToSearch || searchTerm;
        if (!q.trim()) return;
        try {
            setIsAiSearching(true);
            setLoading(true);
            const { data } = await axios.post(`${API_BASE_URL}/api/ai/nl-search`, { query: q });
            if (data.success) {
                setProducts(data.products);
                setAiSummary(data.aiSummary);
                if (data.parsedIntent?.category && data.parsedIntent.category !== 'All') {
                    setSelectedCategory(data.parsedIntent.category);
                }
            }
        } catch (err) {
            console.error('NL Search failed:', err);
        } finally {
            setIsAiSearching(false);
            setLoading(false);
        }
    };

    // Fetch distinct categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/products/categories`);
                setCategories(['All', ...data]);
            } catch {
                setCategories(['All']);
            }
        };
        fetchCategories();
    }, []);

    // Sync searchTerm with URL if keyword param changes
    useEffect(() => {
        const keywordFromUrl = searchParams.get('keyword') || '';
        setSearchTerm(keywordFromUrl);
    }, [searchParams]);

    // Fetch filtered and sorted products
    useEffect(() => {
        const fetchFilteredProducts = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();

                if (searchTerm.trim()) {
                    params.append('keyword', searchTerm.trim());
                }
                if (selectedCategory && selectedCategory !== 'All') {
                    params.append('category', selectedCategory);
                }
                if (selectedSort) {
                    params.append('sort', selectedSort);
                }
                if (inStockOnly) {
                    params.append('inStockOnly', 'true');
                }

                const { data } = await axios.get(`${API_BASE_URL}/api/products?${params.toString()}`);
                setProducts(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchFilteredProducts();
        }, 200);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm, selectedCategory, selectedSort, inStockOnly]);

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setSelectedSort('newest');
        setInStockOnly(false);
        setSearchParams({});
    };

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Header Banner */}
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1 w-8 rounded-full bg-orange-500" />
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                                Open Catalog
                            </span>
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                            Explore Products
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Discover high-quality essentials, trending tech, and curated styles.
                        </p>
                    </div>

                    {/* Total Match Badge */}
                    {!loading && (
                        <div className="flex w-fit items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
                            <Sparkles className="h-4 w-4 text-orange-500" />
                            <span className="text-xs font-bold text-gray-500">Products Available:</span>
                            <span className="text-sm font-black text-gray-900">{products.length}</span>
                        </div>
                    )}
                </div>

                {/* Filter & Search Bar Toolbar */}
                <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                    {/* AI Reasoning Pill */}
                    {aiSummary && (
                        <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                                <span className="text-xs font-semibold text-gray-800">{aiSummary}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setAiSummary('');
                                    resetFilters();
                                }}
                                className="text-xs text-amber-700 font-bold hover:underline shrink-0"
                            >
                                Clear AI Filter
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        {/* Search Input */}
                        <div className="relative md:col-span-5">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products by title or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-2.5 pl-10 pr-8 text-xs text-gray-900 outline-none transition focus:border-orange-500 focus:bg-white"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2 md:col-span-4">
                            <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-400" />
                            <select
                                value={selectedSort}
                                onChange={(e) => setSelectedSort(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-3 py-2.5 text-xs font-bold text-gray-700 outline-none transition focus:border-orange-500 focus:bg-white"
                            >
                                <option value="newest">Sort: Newest Arrivals</option>
                                <option value="price-asc">Sort: Price (Low to High)</option>
                                <option value="price-desc">Sort: Price (High to Low)</option>
                                <option value="rating">Sort: Highest Customer Rating</option>
                                <option value="name">Sort: Alphabetical (A to Z)</option>
                            </select>
                        </div>

                        {/* In Stock Toggle */}
                        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-2 md:col-span-3">
                            <span className="text-xs font-bold text-gray-700">In-Stock Only</span>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-focus:outline-none" />
                            </label>
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                        <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Category:
                        </span>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                                    selectedCategory === cat
                                        ? 'bg-[#171717] text-orange-400 shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}

                        {/* Clear Filters Button */}
                        {(searchTerm || selectedCategory !== 'All' || inStockOnly) && (
                            <button
                                onClick={resetFilters}
                                className="ml-auto text-xs font-bold text-orange-600 hover:underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>

                    {/* AI Quick Query Chips */}
                    <div className="mt-3 flex items-center gap-2 overflow-x-auto pt-3 border-t border-gray-100 no-scrollbar">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Suggestions:
                        </span>
                        {[
                            'Laptops under ₹50,000',
                            '5G phones with AMOLED',
                            'Running shoes under ₹3,000',
                            'Wireless earbuds with ANC',
                        ].map((query, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setSearchTerm(query);
                                    handleNLSearch(query);
                                }}
                                className="whitespace-nowrap rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition shrink-0"
                            >
                                {query}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <ProductGridSkeleton count={10} />
                ) : products.length === 0 ? (
                    <EmptyState
                        type="no-products"
                        onAction={resetFilters}
                        actionText="Reset All Filters"
                    />
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Shop;
