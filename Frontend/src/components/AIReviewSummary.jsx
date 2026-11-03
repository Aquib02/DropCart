import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, CheckCircle, AlertCircle, ThumbsUp } from 'lucide-react';

const AIReviewSummary = ({ productId }) => {
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId) return;
        let isMounted = true;

        const fetchSummary = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`/api/ai/review-summary/${productId}`);
                if (isMounted && data.success) {
                    setSummaryData(data);
                }
            } catch (err) {
                console.warn('Could not load AI review summary:', err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSummary();
        return () => {
            isMounted = false;
        };
    }, [productId]);

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-5 mb-6 animate-pulse">
                <div className="h-5 bg-amber-200/50 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-amber-100 rounded w-4/5 mb-2"></div>
                <div className="h-4 bg-amber-100 rounded w-3/5"></div>
            </div>
        );
    }

    if (!summaryData) return null;

    return (
        <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-yellow-50/60 border border-amber-200 rounded-2xl p-6 mb-8 shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                            AI Review Synthesis
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                Powered by AI
                            </span>
                        </h3>
                        <p className="text-xs text-gray-500">
                            Summarized from {summaryData.totalReviewsAnalyzed || 0} customer reviews
                        </p>
                    </div>
                </div>

                {summaryData.positivePercentage !== undefined && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{summaryData.positivePercentage}% Positive Sentiment</span>
                    </div>
                )}
            </div>

            {/* Summary text */}
            <p className="text-sm text-gray-700 leading-relaxed font-medium mb-5 bg-white/70 p-3.5 rounded-xl border border-amber-100">
                "{summaryData.summary}"
            </p>

            {/* Pros and Cons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pros */}
                {summaryData.pros?.length > 0 && (
                    <div className="bg-white/80 rounded-xl p-4 border border-green-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2.5 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            What Customers Love
                        </h4>
                        <ul className="space-y-1.5">
                            {summaryData.pros.map((pro, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>{pro}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Cons */}
                {summaryData.cons?.length > 0 && (
                    <div className="bg-white/80 rounded-xl p-4 border border-amber-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2.5 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            Things to Keep in Mind
                        </h4>
                        <ul className="space-y-1.5">
                            {summaryData.cons.map((con, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span>{con}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIReviewSummary;
