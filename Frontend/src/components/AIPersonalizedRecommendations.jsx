import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { API_BASE_URL } from '../config';

const AIPersonalizedRecommendations = () => {
    const [recommended, setRecommended] = useState([]);
    const [recommendationReason, setRecommendationReason] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const getRecommendations = async () => {
            try {
                // Check recently viewed products from localStorage
                let viewed = [];
                try {
                    const raw = localStorage.getItem('dropcart_recently_viewed');
                    if (raw) viewed = JSON.parse(raw);
                } catch {
                    viewed = [];
                }

                let targetCategory = '';
                if (viewed.length > 0 && viewed[0].category) {
                    targetCategory = viewed[0].category;
                    setRecommendationReason(`Based on your interest in ${targetCategory}`);
                } else {
                    setRecommendationReason('Curated based on top customer ratings & trending deals');
                }

                // Query products matching category or top rated
                const params = targetCategory ? `?category=${encodeURIComponent(targetCategory)}` : '?sort=rating';
                const { data } = await axios.get(`${API_BASE_URL}/api/products${params}`);

                if (isMounted) {
                    const list = Array.isArray(data) ? data : [];
                    setRecommended(list.slice(0, 4));
                }
            } catch (err) {
                console.warn('Personalized recommendations error:', err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        getRecommendations();

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading || recommended.length === 0) return null;

    return (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
            <div className="overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/40 via-white to-orange-50/30 p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-xs text-white shadow-sm">
                                <Sparkles className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                                AI Personalised Picks
                            </span>
                        </div>
                        <h2 className="mt-1 text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                            Recommended Just For You
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500">{recommendationReason}</p>
                    </div>

                    <Link
                        to="/shop"
                        className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-4 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-50 shadow-2xs"
                    >
                        Explore More <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {recommended.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AIPersonalizedRecommendations;
