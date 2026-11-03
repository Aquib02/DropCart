import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, MessageSquare, Trash2, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminReviewsTab = ({ userToken }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${userToken}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/products/reviews/all`, config);
            setReviews(data || []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load reviews:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userToken) {
            fetchReviews();
        }
    }, [userToken]);

    const handleDeleteReview = async (productId, reviewId) => {
        if (!window.confirm('Delete this customer review?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${userToken}` } };
            await axios.delete(
                `${API_BASE_URL}/api/products/${productId}/reviews/${reviewId}`,
                config
            );
            setReviews((prev) => prev.filter((r) => r._id !== reviewId));
            setMessage('Review deleted successfully.');
            setTimeout(() => setMessage(''), 2500);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete review');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-gray-900">Customer Review Moderation</h2>
                        <p className="text-xs text-gray-500">Inspect verified buyer feedback and moderate spam</p>
                    </div>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                    {reviews.length} Total Reviews
                </span>
            </div>

            {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
                    ✓ {message}
                </div>
            )}

            {/* Reviews List */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-gray-100">
                        <thead className="bg-gray-50/80 font-black uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-5 py-3.5">Product</th>
                                <th className="px-5 py-3.5">Customer</th>
                                <th className="px-5 py-3.5">Rating</th>
                                <th className="px-5 py-3.5">Review Comment</th>
                                <th className="px-5 py-3.5">Date</th>
                                <th className="px-5 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-400">Loading reviews...</td>
                                </tr>
                            ) : reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-400">No reviews submitted yet.</td>
                                </tr>
                            ) : (
                                reviews.map((r) => (
                                    <tr key={r._id} className="hover:bg-gray-50/60 transition">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={r.productImage}
                                                    alt={r.productName}
                                                    className="h-10 w-10 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100"
                                                />
                                                <div>
                                                    <p className="font-bold text-gray-900 line-clamp-1 max-w-[180px]">{r.productName}</p>
                                                    <span className="text-[10px] text-gray-400 uppercase">{r.category}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-gray-900">
                                            {r.name}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                <span>{r.rating}</span>
                                                <Star className="h-2.5 w-2.5 fill-current" />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 max-w-sm">
                                            <p className="line-clamp-2 text-gray-700 leading-relaxed">{r.comment}</p>
                                        </td>
                                        <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                                            {new Date(r.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteReview(r.productId, r._id)}
                                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                                                title="Delete Review"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminReviewsTab;
