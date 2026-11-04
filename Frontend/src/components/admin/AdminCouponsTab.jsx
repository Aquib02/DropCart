import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Tag,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    X,
    Sparkles,
    Copy,
    Check,
    Clock,
    Zap,
    Gift,
    Percent,
    DollarSign,
    Layers,
    UserCheck,
    Calendar,
    Flame
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminCouponsTab = ({ userToken }) => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [copiedCode, setCopiedCode] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'flash' | 'expired'

    const initialCouponState = {
        code: '',
        description: '',
        discountType: 'percentage', // 'percentage' | 'fixed' | 'bogo' | 'first_order' | 'category_specific' | 'flash_sale'
        discountAmount: 15,
        applicableCategory: 'All',
        applicableUserEmail: '',
        minPurchase: 500,
        maxDiscount: 1000,
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        usageLimit: 500,
        isFlashSale: false
    };

    const [newCoupon, setNewCoupon] = useState(initialCouponState);

    const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_BASE_URL}/api/coupons`, authConfig);
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
            const payload = {
                ...newCoupon,
                code: newCoupon.code.trim().toUpperCase(),
                discountAmount: Number(newCoupon.discountAmount),
                minPurchase: Number(newCoupon.minPurchase) || 0,
                maxDiscount: newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : null,
                usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : 500,
                isFlashSale: newCoupon.discountType === 'flash_sale' || newCoupon.isFlashSale
            };

            const { data } = await axios.post(`${API_BASE_URL}/api/coupons`, payload, authConfig);
            setCoupons((prev) => [data, ...prev]);
            setShowCreateModal(false);
            setSuccessMessage(`Coupon '${data.code}' created successfully!`);
            setNewCoupon(initialCouponState);
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create coupon');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const { data } = await axios.patch(`${API_BASE_URL}/api/coupons/${id}/toggle`, {}, authConfig);
            setCoupons((prev) => prev.map((c) => (c._id === id ? data.coupon : c)));
            setSuccessMessage(data.message);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            alert('Failed to toggle coupon status');
        }
    };

    const handleDeleteCoupon = async (id, code) => {
        if (!window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/coupons/${id}`, authConfig);
            setCoupons((prev) => prev.filter((c) => c._id !== id));
            setSuccessMessage('Coupon removed successfully.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete coupon');
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(''), 2000);
    };

    // Filter coupons
    const filteredCoupons = coupons.filter((c) => {
        const isExpired = new Date(c.expiryDate) < new Date();
        if (filterStatus === 'active') return c.isActive && !isExpired;
        if (filterStatus === 'flash') return c.isFlashSale || c.discountType === 'flash_sale';
        if (filterStatus === 'expired') return isExpired || !c.isActive;
        return true;
    });

    const activeCount = coupons.filter(c => c.isActive && new Date(c.expiryDate) >= new Date()).length;
    const flashCount = coupons.filter(c => c.isFlashSale || c.discountType === 'flash_sale').length;
    const totalRedeemed = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);

    return (
        <div className="space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Vouchers</span>
                    <p className="mt-1 text-2xl font-black text-gray-900">{coupons.length}</p>
                    <span className="text-[11px] text-gray-500">Across all promotional engines</span>
                </div>

                <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Active Live</span>
                    <p className="mt-1 text-2xl font-black text-emerald-800">{activeCount}</p>
                    <span className="text-[11px] text-emerald-700 font-bold">Applicable at checkout</span>
                </div>

                <div className="rounded-3xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Flash Promotions</span>
                    <p className="mt-1 text-2xl font-black text-amber-800">{flashCount}</p>
                    <span className="text-[11px] text-amber-700 font-bold">Time-limited urgency deals</span>
                </div>

                <div className="rounded-3xl border border-purple-200/80 bg-purple-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Total Times Redeemed</span>
                    <p className="mt-1 text-2xl font-black text-purple-800">{totalRedeemed}</p>
                    <span className="text-[11px] text-purple-700 font-bold">Customer redemptions</span>
                </div>
            </div>

            {/* Notification Banner */}
            {successMessage && (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                    {['all', 'active', 'flash', 'expired'].map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFilterStatus(status)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition capitalize ${
                                filterStatus === status
                                    ? 'bg-orange-500 text-white shadow-xs'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {status === 'all' ? 'All Coupons' : status === 'flash' ? 'Flash Sales 🔥' : status}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition"
                >
                    <Plus className="h-4 w-4" />
                    <span>Create New Voucher</span>
                </button>
            </div>

            {/* Coupons Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCoupons.map((c) => {
                    const isExpired = new Date(c.expiryDate) < new Date();
                    const isExhausted = c.usageLimit && c.usedCount >= c.usageLimit;
                    const isCopied = copiedCode === c.code;

                    return (
                        <div
                            key={c._id}
                            className={`relative overflow-hidden rounded-3xl border p-5 shadow-xs transition-all ${
                                !c.isActive || isExpired
                                    ? 'border-gray-200 bg-gray-50/70 opacity-75'
                                    : c.isFlashSale
                                    ? 'border-amber-300 bg-gradient-to-br from-amber-50/40 via-white to-white'
                                    : 'border-gray-200/80 bg-white hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-base font-black tracking-wider text-gray-900">
                                        {c.code}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyCode(c.code)}
                                        className="p-1 rounded-md text-gray-400 hover:text-gray-700"
                                        title="Copy Code"
                                    >
                                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {c.isFlashSale && (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-800">
                                            Flash Deal
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleStatus(c._id)}
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase transition ${
                                            c.isActive && !isExpired
                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        {c.isActive && !isExpired ? 'Active' : 'Paused'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-orange-600">
                                        {c.discountType === 'percentage' || c.discountType === 'first_order' || c.discountType === 'flash_sale'
                                            ? `${c.discountAmount}% OFF`
                                            : c.discountType === 'bogo'
                                            ? 'Buy 1 Get 1 Free'
                                            : `₹${c.discountAmount} OFF`}
                                    </span>
                                    {c.maxDiscount && (
                                        <span className="text-[10px] font-bold text-gray-400">
                                            (Up to ₹{c.maxDiscount})
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-600 line-clamp-2">
                                    {c.description || 'Exclusive festival discount voucher applicable at checkout.'}
                                </p>

                                <div className="space-y-1 text-[11px] text-gray-500 border-t border-gray-100 pt-2">
                                    {c.minPurchase > 0 && (
                                        <p>Min Purchase: <span className="font-bold text-gray-800">₹{c.minPurchase.toLocaleString('en-IN')}</span></p>
                                    )}
                                    {c.applicableCategory && c.applicableCategory !== 'All' && (
                                        <p>Category: <span className="font-bold text-purple-700">{c.applicableCategory}</span></p>
                                    )}
                                    {c.applicableUserEmail && (
                                        <p>Target User: <span className="font-bold text-blue-700">{c.applicableUserEmail}</span></p>
                                    )}
                                    <p className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        <span>Expires: {new Date(c.expiryDate).toLocaleDateString()}</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-[11px]">
                                    <span className="font-mono text-gray-500">
                                        Redeemed: <span className="font-bold text-gray-900">{c.usedCount || 0}</span> / {c.usageLimit || '∞'}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCoupon(c._id, c.code)}
                                        className="text-rose-500 hover:text-rose-700 p-1"
                                        title="Delete Voucher"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL: CREATE VOUCHER */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-black text-gray-900">Create Promotional Voucher</h3>
                                <p className="text-xs text-gray-500">Configure discount rules, criteria, and audience limits</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateCoupon} className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Voucher Code *</label>
                                <input
                                    type="text"
                                    required
                                    value={newCoupon.code}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-mono font-black text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    placeholder="e.g. DIWALI2026, FESTIVE100, BOGO50"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Promotion Type *</label>
                                <select
                                    value={newCoupon.discountType}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                                >
                                    <option value="percentage">Percentage Discount (% Off)</option>
                                    <option value="fixed">Fixed Cash Discount (₹ Off)</option>
                                    <option value="first_order">First-Order Exclusive Discount</option>
                                    <option value="bogo">Buy One Get One Free (BOGO)</option>
                                    <option value="category_specific">Category-Specific Promotion</option>
                                    <option value="flash_sale">Flash Sale Deal (Time Urgency)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">
                                        Discount Value {newCoupon.discountType === 'fixed' ? '(₹)' : '(%)'}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newCoupon.discountAmount}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discountAmount: Number(e.target.value) })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-black text-gray-900 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Max Discount Cap (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newCoupon.maxDiscount || ''}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value ? Number(e.target.value) : null })}
                                        placeholder="Optional limit"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none"
                                    />
                                </div>
                            </div>

                            {newCoupon.discountType === 'category_specific' && (
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Target Category</label>
                                    <select
                                        value={newCoupon.applicableCategory}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, applicableCategory: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="Mobiles">Mobiles & Flagships</option>
                                        <option value="Electronics">Electronics & Laptops</option>
                                        <option value="Fashion">Fashion & Footwear</option>
                                        <option value="Home">Home & Living</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">
                                    Target Customer Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={newCoupon.applicableUserEmail}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, applicableUserEmail: e.target.value })}
                                    placeholder="Leave empty for all customers"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Min Cart Purchase (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newCoupon.minPurchase}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, minPurchase: Number(e.target.value) })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Expiry Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={newCoupon.expiryDate}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Description</label>
                                <input
                                    type="text"
                                    value={newCoupon.description}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                                    placeholder="e.g. Flat 15% discount for festival shopping"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white hover:bg-orange-600"
                                >
                                    Publish Coupon
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCouponsTab;
