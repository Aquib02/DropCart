import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Boxes,
    AlertTriangle,
    CheckCircle2,
    ArrowDownRight,
    ArrowUpRight,
    RefreshCw,
    Download,
    Search,
    SlidersHorizontal,
    Plus,
    X,
    Loader2,
    Truck,
    ShieldAlert,
    History,
    FileSpreadsheet,
    Zap
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useSocket } from '../../context/SocketContext';

const AdminInventoryTab = ({ userToken }) => {
    const [viewMode, setViewMode] = useState('inventory'); // 'inventory' | 'audit_logs'
    const [dashboardData, setDashboardData] = useState(null);
    const [logsData, setLogsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters & Pagination
    const [keyword, setKeyword] = useState('');
    const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'out' | 'in_stock'
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [page, setPage] = useState(1);

    // Stock Adjustment Modal
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjustForm, setAdjustForm] = useState({
        quantityDelta: '',
        newStock: '',
        mode: 'delta', // 'delta' | 'exact'
        reason: 'Restocked fresh inventory batch',
        type: 'manual_adjustment'
    });

    const { socket } = useSocket() || {};
    const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

    // Fetch Inventory Data
    const fetchInventory = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                `${API_BASE_URL}/api/inventory/dashboard?keyword=${encodeURIComponent(keyword)}&stockStatus=${stockFilter}&category=${categoryFilter}&page=${page}&limit=25`,
                authConfig
            );
            setDashboardData(data);
        } catch (error) {
            console.error('Error fetching inventory dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Audit Logs
    const fetchLogs = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/inventory/logs?page=1&limit=50`, authConfig);
            setLogsData(data.logs || []);
        } catch (error) {
            console.error('Error fetching inventory logs:', error);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [keyword, stockFilter, categoryFilter, page]);

    useEffect(() => {
        if (viewMode === 'audit_logs') {
            fetchLogs();
        }
    }, [viewMode]);

    // Live Socket.IO Updates
    useEffect(() => {
        if (!socket) return;
        const handleInventoryChange = () => {
            fetchInventory();
            if (viewMode === 'audit_logs') fetchLogs();
        };
        socket.on('inventoryUpdated', handleInventoryChange);
        socket.on('inventoryBulkUpdated', handleInventoryChange);
        return () => {
            socket.off('inventoryUpdated', handleInventoryChange);
            socket.off('inventoryBulkUpdated', handleInventoryChange);
        };
    }, [socket, viewMode]);

    // Open Stock Adjustment Modal
    const handleOpenAdjustModal = (product) => {
        setSelectedProduct(product);
        setAdjustForm({
            quantityDelta: '10',
            newStock: String(product.countInStock),
            mode: 'delta',
            reason: 'Restocked fresh supplier batch',
            type: 'manual_adjustment'
        });
    };

    // Submit Stock Adjustment
    const handleSubmitAdjustment = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;
        setActionLoading(true);

        const payload = {
            productId: selectedProduct._id,
            reason: adjustForm.reason,
            type: adjustForm.type
        };

        if (adjustForm.mode === 'exact') {
            payload.newStock = Number(adjustForm.newStock);
        } else {
            payload.quantityDelta = Number(adjustForm.quantityDelta);
        }

        try {
            await axios.post(`${API_BASE_URL}/api/inventory/adjust`, payload, authConfig);
            setSelectedProduct(null);
            await fetchInventory();
            if (viewMode === 'audit_logs') await fetchLogs();
        } catch (error) {
            alert(error.response?.data?.message || 'Stock adjustment failed');
        } finally {
            setActionLoading(false);
        }
    };

    // Quick restock button
    const handleQuickRestock = async (productId, addQty) => {
        try {
            await axios.post(
                `${API_BASE_URL}/api/inventory/adjust`,
                { productId, quantityDelta: addQty, reason: `Quick restock +${addQty} units` },
                authConfig
            );
            await fetchInventory();
        } catch (err) {
            alert('Quick restock failed');
        }
    };

    // Export Inventory CSV
    const handleExportInventoryCSV = () => {
        const products = dashboardData?.products || [];
        if (products.length === 0) return;

        const headers = ['SKU', 'Product Name', 'Category', 'Stock Units', 'Reserved', 'Cost Price', 'Selling Price', 'Inventory Valuation', 'Status', 'Supplier'];
        const rows = products.map(p => {
            const cost = p.costPrice || (p.price * 0.7);
            const valuation = Math.round(cost * (p.countInStock || 0));
            return [
                p.sku || '',
                `"${(p.name || '').replace(/"/g, '""')}"`,
                p.category || '',
                p.countInStock || 0,
                p.reservedStock || 0,
                cost,
                p.price || 0,
                valuation,
                p.countInStock === 0 || p.isOutOfStock ? 'OUT_OF_STOCK' : (p.countInStock <= 5 ? 'LOW_STOCK' : 'IN_STOCK'),
                `"${(p.supplier?.name || 'N/A').replace(/"/g, '""')}"`
            ];
        });

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `dropcart_inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const kpis = dashboardData?.kpis || {};
    const products = dashboardData?.products || [];
    const urgentAlerts = dashboardData?.urgentAlerts || [];

    return (
        <div className="space-y-6">
            {/* KPI Executive Strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total SKUs</span>
                    <p className="mt-1 text-2xl font-black text-gray-900">{kpis.totalSkus || 0}</p>
                    <span className="text-[11px] text-gray-500">Tracked in database</span>
                </div>

                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Units</span>
                    <p className="mt-1 text-2xl font-black text-gray-900">{(kpis.totalUnits || 0).toLocaleString('en-IN')}</p>
                    <span className="text-[11px] text-emerald-600 font-bold">Physical inventory</span>
                </div>

                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Inventory Valuation</span>
                    <p className="mt-1 text-2xl font-black text-gray-900">₹{(kpis.totalValuation || 0).toLocaleString('en-IN')}</p>
                    <span className="text-[11px] text-gray-500">Based on cost prices</span>
                </div>

                <div className="rounded-3xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Low Stock SKUs</span>
                    <p className="mt-1 text-2xl font-black text-amber-800">{kpis.lowStockCount || 0}</p>
                    <span className="text-[11px] text-amber-700 font-bold">≤ 5 units remaining</span>
                </div>

                <div className="rounded-3xl border border-rose-200/80 bg-rose-50/40 p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Sold Out SKUs</span>
                    <p className="mt-1 text-2xl font-black text-rose-800">{kpis.outOfStockCount || 0}</p>
                    <span className="text-[11px] text-rose-700 font-bold">Requires urgent restock</span>
                </div>
            </div>

            {/* Urgent Restock Notification Bar */}
            {urgentAlerts.length > 0 && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50/30 p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-rose-600" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-rose-900">
                                Urgent Restock Alerts ({urgentAlerts.length})
                            </h3>
                        </div>
                        <span className="text-[10px] text-rose-600 font-bold">Preventing customer order drop-offs</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {urgentAlerts.map(item => (
                            <div key={item._id} className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white p-3 shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <img src={item.image} alt={item.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                                    <div className="max-w-[150px]">
                                        <p className="truncate text-xs font-bold text-gray-900">{item.name}</p>
                                        <span className="text-[10px] font-black text-rose-600">
                                            {item.countInStock === 0 ? 'SOLD OUT' : `${item.countInStock} Left in Stock`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickRestock(item._id, 15)}
                                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-emerald-700 transition"
                                    >
                                        +15
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenAdjustModal(item)}
                                        className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* View Mode Switcher & Export */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setViewMode('inventory')}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                            viewMode === 'inventory'
                                ? 'bg-orange-500 text-white shadow-xs'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <Boxes className="h-4 w-4" />
                        <span>Real-Time Stock Tracking</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('audit_logs')}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                            viewMode === 'audit_logs'
                                ? 'bg-orange-500 text-white shadow-xs'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <History className="h-4 w-4" />
                        <span>Inventory Audit Logs</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchInventory}
                        className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                        title="Refresh Stock"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleExportInventoryCSV}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50"
                    >
                        <Download className="h-4 w-4 text-emerald-600" />
                        <span>Export Valuation CSV</span>
                    </button>
                </div>
            </div>

            {/* VIEW 1: REAL-TIME STOCK TABLE */}
            {viewMode === 'inventory' && (
                <div className="space-y-4">
                    {/* Search & Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={stockFilter}
                                onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 outline-none"
                            >
                                <option value="all">All Stock Statuses</option>
                                <option value="in_stock">Healthy (In Stock &gt; 5)</option>
                                <option value="low">Low Stock (≤ 5 units)</option>
                                <option value="out">Sold Out (0 units)</option>
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 outline-none"
                            >
                                <option value="All">All Categories</option>
                                <option value="Mobiles">Mobiles</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Home">Home</option>
                            </select>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                                placeholder="Search SKU, product or brand..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-1.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Stock Table */}
                    <div className="overflow-x-auto rounded-3xl border border-gray-200/80 bg-white shadow-xs">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="p-4 pl-6">SKU & Item</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Units Available</th>
                                    <th className="p-4">Reserved Stock</th>
                                    <th className="p-4">Cost & Valuation</th>
                                    <th className="p-4">Supplier & Lead</th>
                                    <th className="p-4 pr-6 text-right">Stock Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.map((p) => {
                                    const isOutOfStock = p.countInStock === 0 || p.isOutOfStock;
                                    const isLow = !isOutOfStock && p.countInStock <= (p.lowStockThreshold || 5);
                                    const cost = p.costPrice || (p.price * 0.7);
                                    const valuation = Math.round(cost * (p.countInStock || 0));

                                    return (
                                        <tr key={p._id} className="transition hover:bg-gray-50/60">
                                            <td className="p-4 pl-6">
                                                <div>
                                                    <span className="font-mono text-[10px] font-bold text-gray-500">
                                                        {p.sku || 'SKU-NONE'}
                                                    </span>
                                                    <p className="line-clamp-1 font-bold text-gray-900">{p.name}</p>
                                                    <span className="text-[10px] text-gray-400">{p.brand || 'DropCart'}</span>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                                                    {p.category}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-black text-sm ${isOutOfStock ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                                                        {p.countInStock}
                                                    </span>
                                                    {isOutOfStock ? (
                                                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-700 uppercase">
                                                            Sold Out
                                                        </span>
                                                    ) : isLow ? (
                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 uppercase">
                                                            Low Stock
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-800 uppercase">
                                                            Healthy
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <span className="font-mono text-xs text-gray-600">
                                                    {p.reservedStock || 0} units
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <div>
                                                    <span className="font-bold text-gray-900">₹{valuation.toLocaleString('en-IN')}</span>
                                                    <p className="text-[10px] text-gray-400">@ ₹{Math.round(cost)}/unit</p>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div>
                                                    <span className="font-bold text-gray-800">{p.supplier?.name || 'Direct Brand'}</span>
                                                    <p className="text-[10px] text-gray-400">Lead: {p.supplier?.leadTimeDays || 3} days</p>
                                                </div>
                                            </td>

                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickRestock(p._id, 10)}
                                                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-black text-emerald-700 hover:bg-emerald-100 transition"
                                                        title="Quick Restock +10"
                                                    >
                                                        +10
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenAdjustModal(p)}
                                                        className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Adjust Stock
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW 2: AUDIT TRAIL LOGS */}
            {viewMode === 'audit_logs' && (
                <div className="overflow-x-auto rounded-3xl border border-gray-200/80 bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-wider text-gray-400">
                            <tr>
                                <th className="p-4 pl-6">Timestamp</th>
                                <th className="p-4">Product & SKU</th>
                                <th className="p-4">Movement Type</th>
                                <th className="p-4">Stock Delta</th>
                                <th className="p-4">Previous ➔ New</th>
                                <th className="p-4">Reason / Notes</th>
                                <th className="p-4 pr-6">Performed By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logsData.map(log => {
                                const isPositive = log.quantityDelta > 0;
                                return (
                                    <tr key={log._id} className="transition hover:bg-gray-50/60">
                                        <td className="p-4 pl-6 text-[11px] text-gray-500 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="font-bold text-gray-900">{log.productName}</p>
                                                <span className="font-mono text-[10px] text-gray-400">{log.sku || 'SKU-NONE'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700 uppercase">
                                                {log.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isPositive ? `+${log.quantityDelta}` : log.quantityDelta}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-gray-600">
                                            {log.previousStock} ➔ <span className="font-bold text-gray-900">{log.newStock}</span>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {log.reason}
                                        </td>
                                        <td className="p-4 pr-6 font-bold text-gray-800">
                                            {log.performedByName}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL: STOCK ADJUSTMENT */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-black text-gray-900">Adjust Inventory Stock</h3>
                                <p className="text-xs text-gray-500">{selectedProduct.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitAdjustment} className="mt-4 space-y-4">
                            <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3 text-xs">
                                <span className="text-gray-500 font-bold">Current Stock Level:</span>
                                <span className="text-base font-black text-gray-900">{selectedProduct.countInStock} units</span>
                            </div>

                            {/* Adjustment Mode Switcher */}
                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Adjustment Mode</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustForm({ ...adjustForm, mode: 'delta' })}
                                        className={`rounded-xl border p-2.5 text-xs font-bold transition text-center ${
                                            adjustForm.mode === 'delta'
                                                ? 'border-orange-500 bg-orange-50 text-orange-900'
                                                : 'border-gray-200 text-gray-700'
                                        }`}
                                    >
                                        Add / Subtract Units (+/-)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustForm({ ...adjustForm, mode: 'exact' })}
                                        className={`rounded-xl border p-2.5 text-xs font-bold transition text-center ${
                                            adjustForm.mode === 'exact'
                                                ? 'border-orange-500 bg-orange-50 text-orange-900'
                                                : 'border-gray-200 text-gray-700'
                                        }`}
                                    >
                                        Set Exact Count
                                    </button>
                                </div>
                            </div>

                            {adjustForm.mode === 'delta' ? (
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">
                                        Quantity Delta (+ to restock, - to write off)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={adjustForm.quantityDelta}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, quantityDelta: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-black text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. +20 or -5"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">
                                        New Exact Total Count
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={adjustForm.newStock}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, newStock: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-black text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Audit Reason</label>
                                <input
                                    type="text"
                                    required
                                    value={adjustForm.reason}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                    placeholder="e.g. Restocked supplier shipment, damaged stock disposal..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProduct(null)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    <span>Confirm Adjustment</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventoryTab;
