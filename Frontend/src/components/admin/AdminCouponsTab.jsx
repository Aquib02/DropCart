import { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Plus, Trash2, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminCouponsTab = ({ userToken }) => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountAmount: 10,
        minPurchase: 500,
        maxDiscount: 1000,
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        usageLimit: 500,
    });

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${userToken}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/coupons`, config);
            setCoupons(data || []);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch coupons');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userToken) {
            fetchCoupons();
        }
    }, [userToken]);

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            const config = { headers: { Authorization: `Bearer ${userToken}` } };
            const { data } = await axios.post(`${API_BASE_URL}/api/coupons`, newCoupon, config);
            setCoupons((prev) => [data, ...prev]);
            setShowCreateModal(false);
            setSuccessMessage(`Coupon '${data.code}' created successfully!`);
            setNewCoupon({
                code: '',
                description: '',
                discountType: 'percentage',
                discountAmount: 10,
                minPurchase: 500,
                maxDiscount: 1000,
                expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                usageLimit: 500,
            });
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create coupon');
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${userToken}` } };
            await axios.delete(`${API_BASE_URL}/api/coupons/${id}`, config);
            setCoupons((prev) => prev.filter((c) => c._id !== id));
            setSuccessMessage('Coupon removed successfully.');
            setTimeout(() => setSuccessMessage(''), 2500);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete coupon');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                        <Tag className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-gray-900">Promotional Coupons & Campaigns</h2>
                        <p className="text-xs text-gray-500">Create, monitor and manage active discount vouchers</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black uppercase text-white shadow-sm hover:bg-orange-600 transition"
                >
                    <Plus className="h-4 w-4" /> Create New Coupon
                </button>
            </div>

            {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
                    ✓ {successMessage}
                </div>
            )}

            {/* Coupons Table */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-gray-100">
                        <thead className="bg-gray-50/80 font-black uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-5 py-3.5">Code</th>
                                <th className="px-5 py-3.5">Type & Discount</th>
                                <th className="px-5 py-3.5">Min Order / Max Off</th>
                                <th className="px-5 py-3.5">Usage Count</th>
                                <th className="px-5 py-3.5">Expiry Date</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-400">Loading coupons...</td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-400">No promotional coupons created yet.</td>
                                </tr>
                            ) : (
                                coupons.map((c) => {
                                    const isExpired = new Date(c.expiryDate) < new Date();
                                    return (
                                        <tr key={c._id} className="hover:bg-gray-50/60 transition">
                                            <td className="px-5 py-4 font-mono font-black text-gray-900">
                                                <span className="rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-1 text-orange-700">
                                                    {c.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-bold">
                                                {c.discountType === 'percentage'
                                                    ? `${c.discountAmount}% OFF`
                                                    : `₹${c.discountAmount} Flat OFF`}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500">
                                                Min: ₹{c.minPurchase || 0} {c.maxDiscount ? `(Cap: ₹${c.maxDiscount})` : ''}
                                            </td>
                                            <td className="px-5 py-4 font-semibold">
                                                {c.usedCount || 0} / {c.usageLimit || '∞'}
                                            </td>
                                            <td className="px-5 py-4">
                                                {new Date(c.expiryDate).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-5 py-4">
                                                {isExpired ? (
                                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                                        Expired
                                                    </span>
                                                ) : c.isActive ? (
                                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                                                        Disabled
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteCoupon(c._id)}
                                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                                                    title="Delete Coupon"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Coupon Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-black text-gray-900">Create New Coupon</h3>
                            <button onClick={() => setShowCreateModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {error && (
                            <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateCoupon} className="mt-4 space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 uppercase text-[10px]">Coupon Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. MEGA20, SUMMER500"
                                    value={newCoupon.code}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono font-bold tracking-wider outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase text-[10px]">Discount Type</label>
                                    <select
                                        value={newCoupon.discountType}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-semibold outline-none"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase text-[10px]">Discount Value</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newCoupon.discountAmount}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discountAmount: Number(e.target.value) })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase text-[10px]">Min Purchase (₹)</label>
                                    <input
                                        type="number"
                                        value={newCoupon.minPurchase}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, minPurchase: Number(e.target.value) })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase text-[10px]">Max Discount (₹ Cap)</label>
                                    <input
                                        type="number"
                                        value={newCoupon.maxDiscount}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: Number(e.target.value) })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase text-[10px]">Expiry Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newCoupon.expiryDate}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-semibold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase text-[10px]">Max Usage Limit</label>
                                    <input
                                        type="number"
                                        value={newCoupon.usageLimit}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-xs font-black uppercase text-white shadow-sm hover:bg-orange-600 transition"
                            >
                                Publish Coupon
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCouponsTab;
