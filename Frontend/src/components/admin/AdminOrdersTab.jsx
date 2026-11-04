import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ShoppingBag,
    Truck,
    PackageCheck,
    AlertCircle,
    RotateCcw,
    CheckCircle2,
    Search,
    Download,
    Eye,
    FileText,
    QrCode,
    X,
    Clock,
    MapPin,
    Calendar,
    Phone,
    Mail,
    ChevronRight,
    ArrowRight,
    Loader2,
    CheckSquare,
    Square,
    Printer,
    DollarSign,
    ShieldAlert
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useSocket } from '../../context/SocketContext';
import { exportOrdersToCSV } from '../../utils/exportUtils';

const AdminOrdersTab = ({ userToken }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState({ type: '', message: '' });

    // Filters & Search
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());

    // Modals
    const [activeOrder, setActiveOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [showShippingLabelModal, setShowShippingLabelModal] = useState(false);
    const [shippingLabelData, setShippingLabelData] = useState(null);

    // Tracking edit state inside modal
    const [trackingForm, setTrackingForm] = useState({
        courierPartner: 'BlueDart Express',
        trackingNumber: '',
        estimatedDeliveryDate: '',
        notes: ''
    });

    const { socket } = useSocket() || {};
    const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

    // Fetch Orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/orders`, authConfig);
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load orders:', error);
            showNotice('error', 'Failed to load orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userToken) {
            fetchOrders();
        }
    }, [userToken]);

    // Live Socket.IO Updates
    useEffect(() => {
        if (!socket) return;
        const handleOrderUpdate = () => {
            fetchOrders();
        };
        socket.on('newOrderPlaced', handleOrderUpdate);
        socket.on('orderStatusUpdated', handleOrderUpdate);
        socket.on('ordersBulkUpdated', handleOrderUpdate);
        socket.on('returnRequestFiled', handleOrderUpdate);
        return () => {
            socket.off('newOrderPlaced', handleOrderUpdate);
            socket.off('orderStatusUpdated', handleOrderUpdate);
            socket.off('ordersBulkUpdated', handleOrderUpdate);
            socket.off('returnRequestFiled', handleOrderUpdate);
        };
    }, [socket]);

    const showNotice = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification({ type: '', message: '' }), 5000);
    };

    // Filtered orders
    const filteredOrders = orders.filter((o) => {
        const matchesStatus =
            statusFilter === 'All'
                ? true
                : statusFilter === 'Return Requests'
                ? o.status === 'Return_Requested'
                : o.status.toLowerCase() === statusFilter.toLowerCase().replace(/ /g, '_');

        const matchesSearch =
            !searchTerm ||
            o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.shippingAddress?.city || '').toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    // Selection
    const handleToggleSelectAll = () => {
        if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
            setSelectedOrderIds(new Set());
        } else {
            setSelectedOrderIds(new Set(filteredOrders.map(o => o._id)));
        }
    };

    const handleToggleSelect = (id) => {
        const next = new Set(selectedOrderIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedOrderIds(next);
    };

    // Bulk status update
    const handleBatchStatusUpdate = async (newStatus) => {
        if (selectedOrderIds.size === 0) return;
        if (!window.confirm(`Update ${selectedOrderIds.size} selected orders to "${newStatus}"?`)) return;

        setActionLoading(true);
        try {
            const res = await axios.patch(
                `${API_BASE_URL}/api/orders/bulk-status`,
                { orderIds: Array.from(selectedOrderIds), status: newStatus },
                authConfig
            );
            showNotice('success', res.data.message);
            setSelectedOrderIds(new Set());
            await fetchOrders();
        } catch (err) {
            showNotice('error', err.response?.data?.message || 'Bulk status update failed');
        } finally {
            setActionLoading(false);
        }
    };

    // Single order status update
    const handleUpdateSingleStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`${API_BASE_URL}/api/orders/${orderId}/status`, { status: newStatus }, authConfig);
            showNotice('success', `Order marked as ${newStatus}.`);
            await fetchOrders();
            if (activeOrder && activeOrder._id === orderId) {
                const { data } = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`, authConfig);
                setActiveOrder(data);
            }
        } catch (err) {
            showNotice('error', 'Status update failed');
        }
    };

    // Save tracking info
    const handleSaveTracking = async (e) => {
        e.preventDefault();
        if (!activeOrder) return;
        setActionLoading(true);
        try {
            const res = await axios.patch(
                `${API_BASE_URL}/api/orders/${activeOrder._id}/tracking`,
                trackingForm,
                authConfig
            );
            showNotice('success', res.data.message);
            setActiveOrder(res.data.order);
            await fetchOrders();
        } catch (err) {
            showNotice('error', 'Failed to update tracking');
        } finally {
            setActionLoading(false);
        }
    };

    // Process Refund
    const handleProcessRefund = async (action) => {
        if (!activeOrder) return;
        const confirmMsg = action === 'approve'
            ? 'Approve refund? This will restock all order items back into inventory.'
            : 'Reject this return request?';
        if (!window.confirm(confirmMsg)) return;

        setActionLoading(true);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/orders/${activeOrder._id}/refund`,
                { action, refundAmount: activeOrder.totalPrice },
                authConfig
            );
            showNotice('success', res.data.message);
            setActiveOrder(res.data.order);
            await fetchOrders();
        } catch (err) {
            showNotice('error', err.response?.data?.message || 'Refund processing failed');
        } finally {
            setActionLoading(false);
        }
    };

    // View Invoice
    const handleOpenInvoice = async (order) => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/orders/${order._id}/invoice`, authConfig);
            setInvoiceData(data);
            setShowInvoiceModal(true);
        } catch (err) {
            alert('Failed to generate invoice');
        }
    };

    // View Shipping Label
    const handleOpenShippingLabel = async (order) => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/orders/${order._id}/shipping-label`, authConfig);
            setShippingLabelData(data);
            setShowShippingLabelModal(true);
        } catch (err) {
            alert('Failed to generate shipping label');
        }
    };

    // Open Details Modal
    const handleOpenDetailModal = (order) => {
        setActiveOrder(order);
        setTrackingForm({
            courierPartner: order.courierPartner || 'BlueDart Express',
            trackingNumber: order.trackingNumber || `DC-TRK-${order._id.slice(-6)}`,
            estimatedDeliveryDate: order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().slice(0, 10) : '',
            notes: ''
        });
        setShowDetailModal(true);
    };

    // KPI Counts
    const totalCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
    const transitCount = orders.filter(o => o.status === 'Shipped' || o.status === 'Out For Delivery').length;
    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
    const returnCount = orders.filter(o => o.status === 'Return_Requested' || o.status === 'Returned' || o.status === 'Refunded').length;

    return (
        <div className="space-y-6">
            {/* KPI Executive Strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Orders</span>
                    <p className="mt-1 text-2xl font-black text-gray-900">{totalCount}</p>
                    <span className="text-[11px] text-gray-500">Lifetime orders placed</span>
                </div>

                <div className="rounded-3xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Fulfillment Queue</span>
                    <p className="mt-1 text-2xl font-black text-amber-800">{pendingCount}</p>
                    <span className="text-[11px] text-amber-700 font-bold">Pending & Processing</span>
                </div>

                <div className="rounded-3xl border border-blue-200/80 bg-blue-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">In Transit</span>
                    <p className="mt-1 text-2xl font-black text-blue-800">{transitCount}</p>
                    <span className="text-[11px] text-blue-700 font-bold">Shipped & Out for Delivery</span>
                </div>

                <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Completed & Delivered</span>
                    <p className="mt-1 text-2xl font-black text-emerald-800">{deliveredCount}</p>
                    <span className="text-[11px] text-emerald-700 font-bold">Successfully received</span>
                </div>

                <div className="rounded-3xl border border-purple-200/80 bg-purple-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Returns & Refunds</span>
                    <p className="mt-1 text-2xl font-black text-purple-800">{returnCount}</p>
                    <span className="text-[11px] text-purple-700 font-bold">Return workflows</span>
                </div>
            </div>

            {/* Notification Banner */}
            {notification.message && (
                <div
                    className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-bold animate-in fade-in ${
                        notification.type === 'success'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border border-red-200 bg-red-50 text-red-800'
                    }`}
                >
                    {notification.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Toolbar: Filters, Bulk Status & Search */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        'All',
                        'Pending',
                        'Processing',
                        'Shipped',
                        'Out For Delivery',
                        'Delivered',
                        'Cancelled',
                        'Return Requests'
                    ].map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setStatusFilter(status)}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                statusFilter === status
                                    ? 'bg-orange-500 text-white shadow-xs'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Right: Search & Export */}
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Order ID, customer, tracking..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-1.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => exportOrdersToCSV(filteredOrders)}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50"
                    >
                        <Download className="h-4 w-4 text-emerald-600" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Bulk Action Strip (Visible when items selected) */}
            {selectedOrderIds.size > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50/50 p-4 text-xs">
                    <span className="font-bold text-orange-900">
                        {selectedOrderIds.size} orders selected for batch fulfillment:
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleBatchStatusUpdate('Processing')}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-800 hover:bg-gray-50"
                        >
                            Mark as Processing
                        </button>
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleBatchStatusUpdate('Shipped')}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100"
                        >
                            Mark as Shipped
                        </button>
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleBatchStatusUpdate('Delivered')}
                            className="rounded-xl bg-emerald-600 px-3.5 py-1.5 font-bold text-white hover:bg-emerald-700"
                        >
                            Mark as Delivered
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedOrderIds(new Set())}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="overflow-x-auto rounded-3xl border border-gray-200/80 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        <tr>
                            <th className="p-4 pl-6 w-10">
                                <button type="button" onClick={handleToggleSelectAll} className="text-gray-400 hover:text-gray-700">
                                    {selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0 ? (
                                        <CheckSquare className="h-4 w-4 text-orange-500" />
                                    ) : (
                                        <Square className="h-4 w-4" />
                                    )}
                                </button>
                            </th>
                            <th className="p-4">Order ID & Date</th>
                            <th className="p-4">Customer Details</th>
                            <th className="p-4">Items Ordered</th>
                            <th className="p-4">Total Amount & Paid</th>
                            <th className="p-4">Courier & Tracking</th>
                            <th className="p-4">Order Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-gray-400 font-bold">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500 mb-2" />
                                    Loading customer orders...
                                </td>
                            </tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-gray-400 font-bold">
                                    No orders found matching the filter criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((o) => {
                                const isSelected = selectedOrderIds.has(o._id);

                                return (
                                    <tr key={o._id} className={`transition hover:bg-gray-50/60 ${isSelected ? 'bg-orange-50/20' : ''}`}>
                                        <td className="p-4 pl-6">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleSelect(o._id)}
                                                className="text-gray-400 hover:text-gray-700"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="h-4 w-4 text-orange-500" />
                                                ) : (
                                                    <Square className="h-4 w-4" />
                                                )}
                                            </button>
                                        </td>

                                        {/* Order ID & Date */}
                                        <td className="p-4">
                                            <div>
                                                <span className="font-mono font-bold text-gray-900">#{o._id.slice(-6)}</span>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {new Date(o.createdAt).toLocaleDateString()} • {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Customer */}
                                        <td className="p-4">
                                            <div>
                                                <p className="font-bold text-gray-900">{o.user?.name || 'Customer'}</p>
                                                <p className="text-[10px] text-gray-400">{o.user?.email || 'N/A'}</p>
                                                <span className="text-[10px] text-gray-500">{o.shippingAddress?.city || 'New Delhi'}</span>
                                            </div>
                                        </td>

                                        {/* Items Ordered */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                {o.orderItems.slice(0, 2).map((item, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="h-9 w-9 rounded-lg object-cover border border-gray-100 shrink-0"
                                                        title={`${item.name} x${item.qty}`}
                                                    />
                                                ))}
                                                {o.orderItems.length > 2 && (
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-600 shrink-0">
                                                        +{o.orderItems.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Total & Paid */}
                                        <td className="p-4">
                                            <div>
                                                <span className="font-black text-gray-900">₹{o.totalPrice.toLocaleString('en-IN')}</span>
                                                <div className="mt-0.5 flex items-center gap-1">
                                                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${o.isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    <span className={`text-[10px] font-bold ${o.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                        {o.isPaid ? 'PAID' : 'COD / UNPAID'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Courier & Tracking */}
                                        <td className="p-4">
                                            <div>
                                                <span className="font-bold text-gray-800">{o.courierPartner || 'BlueDart Express'}</span>
                                                <p className="font-mono text-[10px] text-gray-500">{o.trackingNumber || 'Pending AWB'}</p>
                                            </div>
                                        </td>

                                        {/* Order Status */}
                                        <td className="p-4">
                                            <select
                                                value={o.status}
                                                onChange={(e) => handleUpdateSingleStatus(o._id, e.target.value)}
                                                className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer ${
                                                    o.status === 'Delivered'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : o.status === 'Shipped' || o.status === 'Out For Delivery'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : o.status === 'Processing'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : o.status === 'Return_Requested'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : o.status === 'Refunded'
                                                        ? 'bg-indigo-100 text-indigo-800'
                                                        : o.status === 'Cancelled'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Out For Delivery">Out For Delivery</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Return_Requested">Return Requested</option>
                                                <option value="Refunded">Refunded</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDetailModal(o)}
                                                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100"
                                                    title="View Full Order Details & Timeline"
                                                >
                                                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                                                    <span>Details</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenInvoice(o)}
                                                    className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
                                                    title="View / Print Tax Invoice"
                                                >
                                                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenShippingLabel(o)}
                                                    className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
                                                    title="View / Print Shipping Label"
                                                >
                                                    <Truck className="h-3.5 w-3.5 text-emerald-600" />
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

            {/* MODAL 1: ORDER DETAILS, TIMELINE & RETURN APPROVAL */}
            {showDetailModal && activeOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black text-gray-900">
                                        Order #{activeOrder._id}
                                    </h3>
                                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-orange-800">
                                        {activeOrder.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">Placed on {new Date(activeOrder.createdAt).toLocaleString()} via {activeOrder.paymentMethod}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Customer & Shipping Summary */}
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-xs space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Customer Details</span>
                                <p className="font-bold text-gray-900 text-sm">{activeOrder.user?.name || 'Customer'}</p>
                                <p className="text-gray-600 flex items-center gap-1.5"><Mail className="h-3 w-3 text-gray-400" /> {activeOrder.user?.email || 'N/A'}</p>
                                {activeOrder.user?.phone && <p className="text-gray-600 flex items-center gap-1.5"><Phone className="h-3 w-3 text-gray-400" /> {activeOrder.user.phone}</p>}
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-xs space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Delivery Address</span>
                                <p className="font-bold text-gray-900">{activeOrder.shippingAddress?.address}</p>
                                <p className="text-gray-600">{activeOrder.shippingAddress?.city}, {activeOrder.shippingAddress?.postalCode}</p>
                                <p className="text-gray-600">{activeOrder.shippingAddress?.country || 'India'}</p>
                            </div>
                        </div>

                        {/* Order Items List */}
                        <div className="mt-6 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                Ordered Products ({activeOrder.orderItems.length})
                            </h4>
                            <div className="rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden text-xs">
                                {activeOrder.orderItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3.5 bg-white">
                                        <div className="flex items-center gap-3">
                                            <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover shrink-0" />
                                            <div>
                                                <p className="font-bold text-gray-900">{item.name}</p>
                                                <p className="text-[11px] text-gray-500">Qty: {item.qty} × ₹{item.price}</p>
                                            </div>
                                        </div>
                                        <span className="font-black text-gray-900">
                                            ₹{(item.qty * item.price).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Return Request Banner (if filed) */}
                        {activeOrder.returnRequest?.status === 'Requested' && (
                            <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/50 p-4">
                                <div className="flex items-center justify-between border-b border-purple-100 pb-2 mb-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                                        <ShieldAlert className="h-4 w-4 text-purple-700" /> Return & Refund Request Filed
                                    </span>
                                    <span className="text-[10px] text-purple-700">Requested on {new Date(activeOrder.returnRequest.requestedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-purple-950 font-medium">Customer Reason: "{activeOrder.returnRequest.reason}"</p>
                                <p className="text-[11px] text-purple-700 mt-1">Refund Amount: ₹{activeOrder.totalPrice}</p>

                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleProcessRefund('approve')}
                                        className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white hover:bg-purple-800 transition"
                                    >
                                        Approve Refund & Restock Items
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleProcessRefund('reject')}
                                        className="rounded-xl border border-purple-300 bg-white px-4 py-2 text-xs font-bold text-purple-900 hover:bg-purple-50 transition"
                                    >
                                        Reject Return Request
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Delivery Tracking Form */}
                        <div className="mt-6 rounded-2xl border border-gray-200 p-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-3">
                                Dispatch & Delivery Logistics
                            </h4>
                            <form onSubmit={handleSaveTracking} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-500">Carrier Partner</label>
                                    <select
                                        value={trackingForm.courierPartner}
                                        onChange={(e) => setTrackingForm({ ...trackingForm, courierPartner: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-800 outline-none"
                                    >
                                        <option value="BlueDart Express">BlueDart Express</option>
                                        <option value="Delhivery">Delhivery</option>
                                        <option value="DTDC Logistics">DTDC Logistics</option>
                                        <option value="Shadowfax">Shadowfax</option>
                                        <option value="India Post">India Post Speed Post</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-500">AWB Tracking Number</label>
                                    <input
                                        type="text"
                                        value={trackingForm.trackingNumber}
                                        onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-mono text-gray-900 outline-none"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="w-full rounded-xl bg-orange-500 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition"
                                    >
                                        Update Tracking
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Activity Timeline */}
                        <div className="mt-6 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                Order Activity Timeline
                            </h4>
                            <div className="space-y-3 pl-2 border-l-2 border-orange-200">
                                {(activeOrder.timeline || []).map((tl, idx) => (
                                    <div key={idx} className="relative pl-4 text-xs">
                                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-orange-500 bg-white" />
                                        <p className="font-bold text-gray-900">{tl.title}</p>
                                        <p className="text-gray-500 text-[11px]">{tl.description}</p>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(tl.timestamp).toLocaleString()} • by {tl.performedBy}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: TAX INVOICE PRINT VIEW */}
            {showInvoiceModal && invoiceData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 print:p-0 print:shadow-none">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Tax Invoice</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-black"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    <span>Print</span>
                                </button>
                                <button onClick={() => setShowInvoiceModal(false)} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Printable Invoice Sheet */}
                        <div className="mt-4 p-4 border border-gray-200 rounded-2xl space-y-4 text-xs">
                            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">{invoiceData.company.name}</h2>
                                    <p className="text-gray-500 text-[11px]">{invoiceData.company.address}</p>
                                    <p className="text-gray-500 text-[11px]">GSTIN: {invoiceData.company.gstin}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-base font-black text-orange-600">{invoiceData.invoiceNumber}</span>
                                    <p className="text-gray-500 text-[11px]">Date: {new Date(invoiceData.invoiceDate).toLocaleDateString()}</p>
                                    <p className="text-gray-500 text-[11px]">Status: <span className="font-bold text-emerald-700">{invoiceData.paymentStatus}</span></p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-gray-400">Billed & Shipped To:</span>
                                    <p className="font-bold text-gray-900">{invoiceData.customer.name}</p>
                                    <p className="text-gray-600">{invoiceData.shippingAddress?.address}</p>
                                    <p className="text-gray-600">{invoiceData.shippingAddress?.city}, {invoiceData.shippingAddress?.postalCode}</p>
                                    <p className="text-gray-600">Email: {invoiceData.customer.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase text-gray-400">Order Reference:</span>
                                    <p className="font-mono font-bold text-gray-900">#{invoiceData.orderId}</p>
                                    <p className="text-gray-600">Payment: {invoiceData.paymentMethod}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-gray-200 text-[10px] font-black uppercase text-gray-400">
                                    <tr>
                                        <th className="py-2">Item Description</th>
                                        <th className="py-2 text-center">Qty</th>
                                        <th className="py-2 text-right">Unit Price</th>
                                        <th className="py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoiceData.items.map((it, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2 font-bold text-gray-900">{it.name}</td>
                                            <td className="py-2 text-center">{it.qty}</td>
                                            <td className="py-2 text-right">₹{it.unitPrice}</td>
                                            <td className="py-2 text-right font-black">₹{it.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Total summary */}
                            <div className="border-t border-gray-200 pt-3 flex justify-end">
                                <div className="w-48 space-y-1 text-right">
                                    <div className="flex justify-between"><span>Subtotal:</span><span className="font-bold">₹{invoiceData.subtotal}</span></div>
                                    <div className="flex justify-between"><span>GST (18%):</span><span className="font-bold">₹{invoiceData.taxAmount}</span></div>
                                    {invoiceData.discountAmount > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-bold"><span>Discount:</span><span>-₹{invoiceData.discountAmount}</span></div>
                                    )}
                                    <div className="flex justify-between border-t border-gray-200 pt-1 text-sm font-black text-gray-900">
                                        <span>Grand Total:</span><span>₹{invoiceData.totalPrice}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: SHIPPING LABEL PRINT VIEW */}
            {showShippingLabelModal && shippingLabelData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 print:p-0">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Shipping Dispatch Label</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-black"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    <span>Print Label</span>
                                </button>
                                <button onClick={() => setShowShippingLabelModal(false)} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Printable Label Box */}
                        <div className="mt-4 p-5 border-2 border-black rounded-xl space-y-4 font-mono text-xs text-black">
                            <div className="flex justify-between items-center border-b-2 border-black pb-2">
                                <span className="font-black text-base uppercase">{shippingLabelData.courierPartner}</span>
                                <span className="rounded bg-black text-white px-2 py-0.5 font-bold text-[10px]">{shippingLabelData.shippingType}</span>
                            </div>

                            <div className="border-b-2 border-black pb-3 text-center">
                                <div className="text-2xl tracking-widest font-black py-2 bg-gray-100">
                                    ||| | |||| | ||||| || |
                                </div>
                                <span className="text-sm font-black tracking-widest">{shippingLabelData.trackingNumber}</span>
                            </div>

                            <div className="border-b-2 border-black pb-3 space-y-1">
                                <span className="text-[10px] font-bold text-gray-600 block">SHIP TO:</span>
                                <p className="font-black text-sm">{shippingLabelData.customer.name}</p>
                                <p>{shippingLabelData.shippingAddress?.address}</p>
                                <p>{shippingLabelData.shippingAddress?.city} - <span className="font-black text-sm">{shippingLabelData.shippingAddress?.postalCode}</span></p>
                                <p>Contact: {shippingLabelData.customer.phone}</p>
                            </div>

                            <div className="flex justify-between items-center text-[11px] pt-1">
                                <div>
                                    <p>Order #{shippingLabelData.orderId.slice(-6)}</p>
                                    <p>Weight: {shippingLabelData.weightKg} kg</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-base">{shippingLabelData.paymentMethod === 'COD' ? `COLLECT: ₹${shippingLabelData.collectibleAmount}` : 'PREPAID - DO NOT COLLECT'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrdersTab;
