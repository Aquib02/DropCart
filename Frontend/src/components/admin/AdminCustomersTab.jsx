import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users,
    Coins,
    Search,
    Shield,
    MapPin,
    Crown,
    AlertTriangle,
    Eye,
    Lock,
    Unlock,
    Tag,
    Download,
    ShoppingBag,
    Heart,
    X,
    Calendar,
    Phone,
    Mail,
    Plus,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminCustomersTab = ({ userToken }) => {
    const [customerData, setCustomerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters & Search
    const [search, setSearch] = useState('');
    const [segmentFilter, setSegmentFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);

    // Modals
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetailData, setCustomerDetailData] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Coins Adjustment Modal
    const [showCoinsModal, setShowCoinsModal] = useState(false);
    const [coinsForm, setCoinsForm] = useState({ delta: 50, reason: 'Festival bonus reward' });

    // Exclusive Discount Modal
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [voucherForm, setVoucherForm] = useState({
        discountAmount: 15,
        discountType: 'percentage',
        minPurchase: 999,
        expiryDays: 14
    });

    // Block Customer Modal
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockReason, setBlockReason] = useState('Suspicious checkout activity or policy violation');

    const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

    // Fetch Customer Directory
    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                `${API_BASE_URL}/api/customers?search=${encodeURIComponent(search)}&segment=${segmentFilter}&status=${statusFilter}&page=${page}&limit=25`,
                authConfig
            );
            setCustomerData(data);
        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userToken) {
            fetchCustomers();
        }
    }, [userToken, search, segmentFilter, statusFilter, page]);

    // View Details
    const handleViewCustomer = async (customer) => {
        setSelectedCustomer(customer);
        setShowDetailModal(true);
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/customers/${customer._id}`, authConfig);
            setCustomerDetailData(data);
        } catch (err) {
            console.error('Failed to load customer profile details:', err);
        }
    };

    // Toggle Block / Unblock
    const handleConfirmBlock = async () => {
        if (!selectedCustomer) return;
        setActionLoading(true);
        try {
            await axios.patch(
                `${API_BASE_URL}/api/customers/${selectedCustomer._id}/block`,
                { isBlocked: !selectedCustomer.isBlocked, blockReason },
                authConfig
            );
            setShowBlockModal(false);
            await fetchCustomers();
            if (showDetailModal) {
                const { data } = await axios.get(`${API_BASE_URL}/api/customers/${selectedCustomer._id}`, authConfig);
                setCustomerDetailData(data);
            }
        } catch (err) {
            alert('Failed to update block status');
        } finally {
            setActionLoading(false);
        }
    };

    // Adjust Coins
    const handleConfirmCoins = async (e) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        setActionLoading(true);
        try {
            await axios.post(
                `${API_BASE_URL}/api/customers/${selectedCustomer._id}/coins`,
                { coinsDelta: coinsForm.delta, reason: coinsForm.reason },
                authConfig
            );
            setShowCoinsModal(false);
            await fetchCustomers();
            if (showDetailModal) {
                const { data } = await axios.get(`${API_BASE_URL}/api/customers/${selectedCustomer._id}`, authConfig);
                setCustomerDetailData(data);
            }
        } catch (err) {
            alert('Failed to adjust coins');
        } finally {
            setActionLoading(false);
        }
    };

    // Assign Exclusive Discount
    const handleConfirmVoucher = async (e) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        setActionLoading(true);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/customers/${selectedCustomer._id}/discount`,
                voucherForm,
                authConfig
            );
            alert(res.data.message);
            setShowVoucherModal(false);
            if (showDetailModal) {
                const { data } = await axios.get(`${API_BASE_URL}/api/customers/${selectedCustomer._id}`, authConfig);
                setCustomerDetailData(data);
            }
        } catch (err) {
            alert('Failed to generate exclusive voucher');
        } finally {
            setActionLoading(false);
        }
    };

    // Export Customers CSV
    const handleExportCustomersCSV = () => {
        const customers = customerData?.customers || [];
        if (customers.length === 0) return;

        const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Pincode', 'Segment', 'Total Orders', 'Lifetime Spend (₹)', 'AOV (₹)', 'SuperCoins', 'Status', 'Registered On'];
        const rows = customers.map(c => [
            c._id,
            `"${(c.name || '').replace(/"/g, '""')}"`,
            c.email || '',
            c.phone || '',
            `"${(c.city || c.deliveryCity || '').replace(/"/g, '""')}"`,
            c.postalCode || c.deliveryPincode || '',
            c.segment || 'New',
            c.ordersCount || 0,
            c.totalSpent || 0,
            c.aov || 0,
            c.coins || 0,
            c.isBlocked ? 'BLOCKED' : 'ACTIVE',
            new Date(c.createdAt).toLocaleDateString()
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `dropcart_customers_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const kpis = customerData?.kpis || {};
    const customers = customerData?.customers || [];

    return (
        <div className="space-y-6">
            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Customers</span>
                    <p className="mt-1 text-2xl font-black text-gray-900">{kpis.totalCustomers || 0}</p>
                    <span className="text-[11px] text-gray-500">Registered store shoppers</span>
                </div>

                <div className="rounded-3xl border border-purple-200/80 bg-purple-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">VIP Customers</span>
                    <p className="mt-1 text-2xl font-black text-purple-800">{kpis.vipCount || 0}</p>
                    <span className="text-[11px] text-purple-700 font-bold">LTV &gt; ₹25,000 or 4+ orders</span>
                </div>

                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Lifetime Value (LTV)</span>
                    <p className="mt-1 text-2xl font-black text-gray-900">₹{(kpis.totalLtv || 0).toLocaleString('en-IN')}</p>
                    <span className="text-[11px] text-emerald-600 font-bold">Total revenue generated</span>
                </div>

                <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Repeat Purchase Rate</span>
                    <p className="mt-1 text-2xl font-black text-emerald-800">{kpis.repeatPurchaseRate || 0}%</p>
                    <span className="text-[11px] text-emerald-700 font-bold">Customers with &gt; 1 order</span>
                </div>

                <div className="rounded-3xl border border-rose-200/80 bg-rose-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Blocked / Suspended</span>
                    <p className="mt-1 text-2xl font-black text-rose-800">{kpis.blockedCount || 0}</p>
                    <span className="text-[11px] text-rose-700 font-bold">Restricted accounts</span>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Segmentation Pills */}
                    {['All', 'VIP', 'Regular', 'New', 'At Risk'].map(seg => (
                        <button
                            key={seg}
                            type="button"
                            onClick={() => { setSegmentFilter(seg); setPage(1); }}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                segmentFilter === seg
                                    ? 'bg-orange-500 text-white shadow-xs'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {seg} {seg === 'VIP' && '⭐'}
                        </button>
                    ))}

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 outline-none ml-2"
                    >
                        <option value="All">All Statuses</option>
                        <option value="active">Active Accounts</option>
                        <option value="blocked">Blocked Accounts</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search name, email, phone, city..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-1.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleExportCustomersCSV}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50"
                    >
                        <Download className="h-4 w-4 text-emerald-600" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto rounded-3xl border border-gray-200/80 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        <tr>
                            <th className="p-4 pl-6">Customer Profile</th>
                            <th className="p-4">Segment</th>
                            <th className="p-4">Orders & Lifetime Spend</th>
                            <th className="p-4">Average Order Value</th>
                            <th className="p-4">SuperCoins</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-gray-400 font-bold">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500 mb-2" />
                                    Loading customer profiles...
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-gray-400 font-bold">
                                    No customers found matching the search criteria.
                                </td>
                            </tr>
                        ) : (
                            customers.map((c) => {
                                const isVip = c.segment === 'VIP';
                                const isAtRisk = c.segment === 'At Risk';

                                return (
                                    <tr key={c._id} className="transition hover:bg-gray-50/60">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-black text-sm text-white shrink-0 ${
                                                    isVip ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-sm shadow-purple-500/20' : 'bg-gray-800'
                                                }`}>
                                                    {c.name ? c.name[0].toUpperCase() : 'C'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-gray-900">{c.name}</span>
                                                        {isVip && <Crown className="h-3.5 w-3.5 text-amber-500 fill-current" />}
                                                    </div>
                                                    <p className="text-[11px] text-gray-500">{c.email}</p>
                                                    {c.phone && <p className="text-[10px] text-gray-400">{c.phone}</p>}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                                isVip ? 'bg-purple-100 text-purple-800' :
                                                c.segment === 'Regular' ? 'bg-blue-100 text-blue-800' :
                                                isAtRisk ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                {c.segment}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <div>
                                                <span className="font-black text-gray-900">₹{(c.totalSpent || 0).toLocaleString('en-IN')}</span>
                                                <p className="text-[10px] text-gray-400">{c.ordersCount || 0} order{(c.ordersCount === 1 ? '' : 's')}</p>
                                            </div>
                                        </td>

                                        <td className="p-4 font-mono font-bold text-gray-700">
                                            ₹{(c.aov || 0).toLocaleString('en-IN')}
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <Coins className="h-3.5 w-3.5 text-amber-500" />
                                                <span className="font-black text-gray-900">{c.coins || 0}</span>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-[11px] text-gray-600">
                                                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate max-w-[120px]">{c.city || c.deliveryCity || 'New Delhi'}</span>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            {c.isBlocked ? (
                                                <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-700 uppercase">
                                                    Blocked
                                                </span>
                                            ) : (
                                                <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 uppercase">
                                                    Active
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewCustomer(c)}
                                                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100"
                                                >
                                                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                                                    <span>Profile</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setShowCoinsModal(true);
                                                    }}
                                                    className="rounded-lg border border-amber-200 bg-amber-50/50 p-1.5 text-amber-700 hover:bg-amber-100"
                                                    title="Adjust SuperCoins"
                                                >
                                                    <Coins className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setShowVoucherModal(true);
                                                    }}
                                                    className="rounded-lg border border-purple-200 bg-purple-50/50 p-1.5 text-purple-700 hover:bg-purple-100"
                                                    title="Grant Exclusive Voucher"
                                                >
                                                    <Tag className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL 1: CUSTOMER DETAIL & PURCHASE HISTORY */}
            {showDetailModal && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white font-black text-lg">
                                    {selectedCustomer.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-gray-900">{selectedCustomer.name}</h3>
                                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-orange-800">
                                            {selectedCustomer.segment}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">{selectedCustomer.email} • Registered {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Customer Quick Stats Strip */}
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                                <span className="text-[10px] font-black uppercase text-gray-400">Total Lifetime Spend</span>
                                <p className="mt-0.5 text-lg font-black text-gray-900">
                                    ₹{(customerDetailData?.customer?.totalSpent || selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                                <span className="text-[10px] font-black uppercase text-gray-400">Total Orders Placed</span>
                                <p className="mt-0.5 text-lg font-black text-gray-900">
                                    {customerDetailData?.orders?.length || selectedCustomer.ordersCount || 0} Orders
                                </p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                                <span className="text-[10px] font-black uppercase text-gray-400">SuperCoins Balance</span>
                                <p className="mt-0.5 text-lg font-black text-amber-600">
                                    {selectedCustomer.coins || 0} Coins
                                </p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                                <span className="text-[10px] font-black uppercase text-gray-400">Account Status</span>
                                <p className={`mt-0.5 text-lg font-black ${selectedCustomer.isBlocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {selectedCustomer.isBlocked ? 'Suspended' : 'Active Verified'}
                                </p>
                            </div>
                        </div>

                        {/* Purchase History */}
                        <div className="mt-6 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                Order & Purchase History ({customerDetailData?.orders?.length || 0})
                            </h4>
                            <div className="max-h-60 overflow-y-auto space-y-2 rounded-2xl border border-gray-200 p-3">
                                {customerDetailData?.orders?.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-gray-400">No past orders placed yet.</p>
                                ) : (
                                    customerDetailData?.orders?.map(order => (
                                        <div key={order._id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-xs">
                                            <div>
                                                <span className="font-mono font-bold text-gray-900">Order #{order._id.slice(-6)}</span>
                                                <p className="text-[11px] text-gray-500">{new Date(order.createdAt).toLocaleString()} • {order.orderItems?.length || 0} item(s)</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-gray-900">₹{order.totalPrice}</span>
                                                <p className={`text-[10px] font-bold ${order.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {order.isPaid ? 'Paid' : 'Payment Pending'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Wishlist Items */}
                        {customerDetailData?.customer?.wishlist?.length > 0 && (
                            <div className="mt-6 space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                    Customer Wishlist ({customerDetailData.customer.wishlist.length})
                                </h4>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {customerDetailData.customer.wishlist.map(w => (
                                        <div key={w._id} className="flex items-center gap-2 rounded-xl border border-gray-100 p-2">
                                            <img src={w.image} alt={w.name} className="h-10 w-10 rounded-lg object-cover" />
                                            <div className="min-w-0">
                                                <p className="truncate text-[11px] font-bold text-gray-900">{w.name}</p>
                                                <span className="text-[10px] font-black text-orange-600">₹{w.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bottom Actions */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowCoinsModal(true); }}
                                    className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                                >
                                    Adjust SuperCoins
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowVoucherModal(true); }}
                                    className="rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100"
                                >
                                    Grant Exclusive Voucher
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowBlockModal(true)}
                                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                                    selectedCustomer.isBlocked
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-rose-600 text-white hover:bg-rose-700'
                                }`}
                            >
                                {selectedCustomer.isBlocked ? 'Unblock Customer Account' : 'Suspend / Block Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADJUST SUPERCOINS */}
            {showCoinsModal && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Adjust SuperCoins: {selectedCustomer.name}</h3>
                            <button onClick={() => setShowCoinsModal(false)} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmCoins} className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">
                                    Coins Delta (+ to grant, - to deduct)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={coinsForm.delta}
                                    onChange={(e) => setCoinsForm({ ...coinsForm, delta: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-black text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Reason</label>
                                <input
                                    type="text"
                                    required
                                    value={coinsForm.reason}
                                    onChange={(e) => setCoinsForm({ ...coinsForm, reason: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCoinsModal(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white hover:bg-orange-600"
                                >
                                    Apply Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: EXCLUSIVE VOUCHER */}
            {showVoucherModal && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-black text-gray-900">Grant Exclusive Voucher</h3>
                                <p className="text-xs text-gray-500">For {selectedCustomer.name} ({selectedCustomer.email})</p>
                            </div>
                            <button onClick={() => setShowVoucherModal(false)} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmVoucher} className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Discount Amount</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={voucherForm.discountAmount}
                                        onChange={(e) => setVoucherForm({ ...voucherForm, discountAmount: Number(e.target.value) })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-black text-gray-900 outline-none"
                                    />
                                    <select
                                        value={voucherForm.discountType}
                                        onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Minimum Order Value (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={voucherForm.minPurchase}
                                    onChange={(e) => setVoucherForm({ ...voucherForm, minPurchase: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowVoucherModal(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white hover:bg-orange-600"
                                >
                                    Generate & Assign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: BLOCK CONFIRMATION */}
            {showBlockModal && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">
                                {selectedCustomer.isBlocked ? `Unblock ${selectedCustomer.name}` : `Suspend ${selectedCustomer.name}`}
                            </h3>
                            <button onClick={() => setShowBlockModal(false)} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            <p className="text-xs text-gray-600">
                                {selectedCustomer.isBlocked
                                    ? 'Unblocking will restore their login access and ability to place new orders.'
                                    : 'Suspended customers cannot log in or place orders on the storefront.'}
                            </p>

                            {!selectedCustomer.isBlocked && (
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Suspension Reason</label>
                                    <input
                                        type="text"
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBlockModal(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmBlock}
                                    className={`rounded-xl px-5 py-2 text-xs font-bold text-white ${
                                        selectedCustomer.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {selectedCustomer.isBlocked ? 'Confirm Unblock' : 'Confirm Suspension'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomersTab;
