import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    BarChart3,
    Package,
    ShoppingBag,
    Palette,
    Users,
    Plus,
    Trash2,
    Edit2,
    AlertTriangle,
    TrendingUp,
    Shield,
    X,
    RefreshCw,
    Download,
    Tag,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import AdminAnalyticsCharts from '../components/admin/AdminAnalyticsCharts';
import AdminCouponsTab from '../components/admin/AdminCouponsTab';
import AdminCustomersTab from '../components/admin/AdminCustomersTab';
import AdminReviewsTab from '../components/admin/AdminReviewsTab';
import { exportOrdersToCSV } from '../utils/exportUtils';
import { useSocket } from '../context/SocketContext';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Active Tab: 'overview' | 'products' | 'orders' | 'appearance' | 'staff'
    const [activeTab, setActiveTab] = useState('overview');

    // Overview Stats State
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Products State
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productSearch, setProductSearch] = useState('');
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // New / Edit Product Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        image: '',
        category: '',
        countInStock: '',
        description: '',
        isOutOfStock: false,
    });
    const [productFormLoading, setProductFormLoading] = useState(false);
    const [productMessage, setProductMessage] = useState('');

    // Orders State
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [orderStatusFilter, setOrderStatusFilter] = useState('All');

    // Store Appearance State
    const [appearance, setAppearance] = useState({
        announcement: '',
        bannerActive: true,
        heroTitle: '',
        heroSubtitle: '',
        heroBadge: '',
        themeColor: 'orange',
    });
    const [appearanceLoading, setAppearanceLoading] = useState(false);
    const [appearanceStatus, setAppearanceStatus] = useState({ type: '', message: '' });

    // Staff & RBAC State
    const [staffList, setStaffList] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        permissions: ['manage_products', 'manage_orders'],
    });
    const [staffMessage, setStaffMessage] = useState('');

    // Security Check: Ensure user is Admin or Staff
    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=admin/dashboard');
            return;
        }

        const isAllowed = user.isAdmin || user.role === 'admin' || user.role === 'staff';
        if (!isAllowed) {
            navigate('/customer/dashboard');
        }
    }, [user, navigate]);

    // Data Loaders
    const fetchStats = async () => {
        if (!user) return;
        try {
            setLoadingStats(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/orders/stats`, config);
            setStats(data);
            setLoadingStats(false);
        } catch {
            setLoadingStats(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const { data } = await axios.get(`${API_BASE_URL}/api/products`);
            setProducts(data);
            setLoadingProducts(false);
        } catch {
            setLoadingProducts(false);
        }
    };

    const fetchOrders = async () => {
        if (!user) return;
        try {
            setLoadingOrders(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/orders`, config);
            setOrders(data);
            setLoadingOrders(false);
        } catch {
            setLoadingOrders(false);
        }
    };

    const fetchAppearance = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/settings`);
            if (data) {
                setAppearance({
                    announcement: data.announcement || '',
                    bannerActive: data.bannerActive !== undefined ? data.bannerActive : true,
                    heroTitle: data.heroTitle || '',
                    heroSubtitle: data.heroSubtitle || '',
                    heroBadge: data.heroBadge || '',
                    themeColor: data.themeColor || 'orange',
                });
            }
        } catch (err) {
            console.error('Failed to load appearance', err);
        }
    };

    const fetchStaff = async () => {
        if (!user) return;
        try {
            setLoadingStaff(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/users/staff`, config);
            setStaffList(data);
            setLoadingStaff(false);
        } catch {
            setLoadingStaff(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchProducts();
        fetchOrders();
        fetchAppearance();
        fetchStaff();
    }, [user]);

    // Real-Time Socket.IO: Live orders and stats sync
    const { socket } = useSocket() || {};
    useEffect(() => {
        if (!socket) return;
        const onRealtimeUpdate = () => {
            fetchOrders();
            fetchStats();
        };
        socket.on('newOrderPlaced', onRealtimeUpdate);
        socket.on('orderStatusUpdated', onRealtimeUpdate);
        return () => {
            socket.off('newOrderPlaced', onRealtimeUpdate);
            socket.off('orderStatusUpdated', onRealtimeUpdate);
        };
    }, [socket]);

    // Permission check helper
    const can = (permission) => {
        if (!user) return false;
        if (user.isAdmin || user.role === 'admin') return true;
        return Array.isArray(user.permissions) && user.permissions.includes(permission);
    };

    // 1-Click Out-of-Stock Toggle Handler
    const handleToggleStock = async (product) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const newOutOfStockState = !product.isOutOfStock && product.countInStock > 0;

            const { data } = await axios.patch(
                `${API_BASE_URL}/api/products/${product._id}/stock`,
                {
                    isOutOfStock: newOutOfStockState,
                    countInStock: newOutOfStockState ? 0 : 15,
                },
                config
            );

            setProducts((prev) => prev.map((p) => (p._id === product._id ? data : p)));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update stock');
        }
    };

    // Quick Stock Adjust (+1 / -1)
    const handleAdjustStock = async (product, change) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const newStock = Math.max(0, product.countInStock + change);

            const { data } = await axios.patch(
                `${API_BASE_URL}/api/products/${product._id}/stock`,
                {
                    countInStock: newStock,
                    isOutOfStock: newStock === 0,
                },
                config
            );

            setProducts((prev) => prev.map((p) => (p._id === product._id ? data : p)));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to adjust stock');
        }
    };

    // Delete Product Handler
    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${API_BASE_URL}/api/products/${id}`, config);
            setProducts((prev) => prev.filter((p) => p._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete product');
        }
    };

    // Add or Update Product Handler
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setProductFormLoading(true);
        setProductMessage('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };

            if (editingProduct) {
                const { data } = await axios.put(
                    `${API_BASE_URL}/api/products/${editingProduct._id}`,
                    formData,
                    config
                );
                setProducts((prev) => prev.map((p) => (p._id === editingProduct._id ? data : p)));
                setProductMessage('Product updated successfully!');
            } else {
                const { data } = await axios.post(`${API_BASE_URL}/api/products`, formData, config);
                setProducts((prev) => [data, ...prev]);
                setProductMessage('Product added successfully!');
            }

            setProductFormLoading(false);
            setTimeout(() => {
                setShowAddProductModal(false);
                setEditingProduct(null);
                setFormData({
                    name: '',
                    price: '',
                    image: '',
                    category: '',
                    countInStock: '',
                    description: '',
                    isOutOfStock: false,
                });
                setProductMessage('');
            }, 1000);
        } catch (error) {
            setProductFormLoading(false);
            setProductMessage(error.response?.data?.message || 'Failed to save product');
        }
    };

    // Order Status Update Handler
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.put(
                `${API_BASE_URL}/api/orders/${orderId}/status`,
                { status: newStatus },
                config
            );
            setOrders((prev) => prev.map((o) => (o._id === orderId ? data : o)));
            fetchStats();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update order status');
        }
    };

    // Save Store Appearance Handler
    const handleAppearanceSubmit = async (e) => {
        e.preventDefault();
        setAppearanceLoading(true);
        setAppearanceStatus({ type: '', message: '' });

        if (!user || !user.token) {
            setAppearanceLoading(false);
            setAppearanceStatus({
                type: 'error',
                message: 'Admin authorization session is missing or expired. Please re-login.'
            });
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.put(`${API_BASE_URL}/api/settings`, appearance, config);
            setAppearance({
                announcement: data.announcement || '',
                bannerActive: data.bannerActive !== undefined ? data.bannerActive : true,
                heroTitle: data.heroTitle || '',
                heroSubtitle: data.heroSubtitle || '',
                heroBadge: data.heroBadge || '',
                themeColor: data.themeColor || 'orange',
            });
            if (data.themeColor) {
                document.documentElement.setAttribute('data-theme', data.themeColor);
                localStorage.setItem('dropcart_theme', data.themeColor);
            }
            setAppearanceLoading(false);
            setAppearanceStatus({
                type: 'success',
                message: 'Live changes published successfully! Updated across all storefront visitors.'
            });
            setTimeout(() => setAppearanceStatus({ type: '', message: '' }), 5000);
        } catch (error) {
            setAppearanceLoading(false);
            setAppearanceStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to update appearance. Please try again.'
            });
        }
    };

    // Staff Creation Handler
    const handleStaffSubmit = async (e) => {
        e.preventDefault();
        setStaffMessage('');

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.post(`${API_BASE_URL}/api/users/staff`, staffForm, config);
            setStaffList((prev) => [...prev, data]);
            setShowStaffModal(false);
            setStaffForm({
                name: '',
                email: '',
                password: '',
                role: 'staff',
                permissions: ['manage_products', 'manage_orders'],
            });
            alert('Staff member registered successfully with custom permissions!');
        } catch (error) {
            setStaffMessage(error.response?.data?.message || 'Failed to create staff');
        }
    };

    // Delete Staff Member
    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Revoke access and delete this staff member?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${API_BASE_URL}/api/users/staff/${id}`, config);
            setStaffList((prev) => prev.filter((s) => s._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete staff member');
        }
    };

    // Filtered Products
    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.category.toLowerCase().includes(productSearch.toLowerCase())
    );

    // Filtered Orders
    const filteredOrders = orders.filter((o) =>
        orderStatusFilter === 'All' ? true : o.status === orderStatusFilter
    );

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Admin Top Header Banner */}
                <div className="mb-8 overflow-hidden rounded-3xl bg-[#171717] p-6 text-white shadow-xl sm:p-8">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-lg">
                                <Shield className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-black sm:text-3xl">
                                        Admin Control Center
                                    </h1>
                                    <span className="rounded-full bg-orange-500 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                                        {user?.role === 'admin' || user?.isAdmin ? 'Owner / Admin' : 'Staff'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-400">
                                    Manage inventory, customer orders, store appearance, and team permissions
                                </p>
                            </div>
                        </div>

                        {/* Navigation Pills */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                    activeTab === 'overview'
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                <BarChart3 className="h-4 w-4" />
                                Overview
                            </button>

                            {can('manage_products') && (
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'products'
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    <Package className="h-4 w-4" />
                                    Products & Stocks
                                </button>
                            )}

                            {can('manage_orders') && (
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'orders'
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    Orders ({orders.length})
                                </button>
                            )}

                            {/* Coupons & Promotions Tab */}
                            <button
                                onClick={() => setActiveTab('coupons')}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                    activeTab === 'coupons'
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                <Tag className="h-4 w-4" />
                                Coupons & Deals
                            </button>

                            {/* Customer Directory Tab */}
                            <button
                                onClick={() => setActiveTab('customers')}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                    activeTab === 'customers'
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                <Users className="h-4 w-4" />
                                Customers
                            </button>

                            {/* Customer Reviews Moderation Tab */}
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                    activeTab === 'reviews'
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                <MessageSquare className="h-4 w-4" />
                                Reviews
                            </button>

                            {can('manage_appearance') && (
                                <button
                                    onClick={() => setActiveTab('appearance')}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'appearance'
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    <Palette className="h-4 w-4" />
                                    Look & Theme
                                </button>
                            )}

                            {can('manage_staff') && (
                                <button
                                    onClick={() => setActiveTab('staff')}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'staff'
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    <Shield className="h-4 w-4" />
                                    Staff & Roles
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* TAB 1: OVERVIEW & ANALYTICS */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {loadingStats ? (
                            <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-500" />
                                <p className="mt-3 text-xs font-bold text-gray-500">
                                    Calculating metrics...
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Metrics Cards Grid */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase text-gray-400">
                                                Total Revenue
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                ₹
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-gray-900">
                                            ₹{stats?.totalRevenue?.toLocaleString() || 0}
                                        </p>
                                        <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                            <TrendingUp className="h-3 w-3" /> Live Gross Sales
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase text-gray-400">
                                                Total Orders
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                                <ShoppingBag className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-gray-900">
                                            {stats?.totalOrders || 0}
                                        </p>
                                        <span className="mt-1 text-[11px] font-bold text-amber-600">
                                            {stats?.pendingOrders || 0} Pending Delivery
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase text-gray-400">
                                                Catalog Stock
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                <Package className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-gray-900">
                                            {stats?.totalProducts || 0}
                                        </p>
                                        <span className="mt-1 text-[11px] font-bold text-rose-600">
                                            {stats?.outOfStockProducts || 0} Out of Stock
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase text-gray-400">
                                                Customers & Staff
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                                <Users className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-gray-900">
                                            {stats?.totalUsers || 0}
                                        </p>
                                        <span className="mt-1 text-[11px] font-bold text-gray-500">
                                            {stats?.totalStaff || 0} Admin / Staff Members
                                        </span>
                                    </div>
                                </div>

                                {/* Low Stock Alerts and Recent Orders */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    {/* Low Stock Warning Card */}
                                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                <h3 className="text-base font-black text-gray-900">
                                                    Stock Alerts & Depleted Items
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('products')}
                                                className="text-xs font-bold text-orange-600 hover:underline"
                                            >
                                                Manage All →
                                            </button>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {products
                                                .filter((p) => p.isOutOfStock || p.countInStock <= 5)
                                                .slice(0, 5)
                                                .map((p) => (
                                                    <div
                                                        key={p._id}
                                                        className="flex items-center justify-between py-3"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={p.image}
                                                                alt={p.name}
                                                                className="h-10 w-10 rounded-lg object-cover"
                                                            />
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-900">
                                                                    {p.name}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400">
                                                                    ₹{p.price}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                                    p.isOutOfStock || p.countInStock === 0
                                                                        ? 'bg-rose-100 text-rose-700'
                                                                        : 'bg-amber-100 text-amber-700'
                                                                }`}
                                                            >
                                                                {p.isOutOfStock || p.countInStock === 0
                                                                    ? 'Out of Stock'
                                                                    : `${p.countInStock} Left`}
                                                            </span>
                                                            <button
                                                                onClick={() => handleToggleStock(p)}
                                                                className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                                                            >
                                                                Restock +15
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            {products.filter((p) => p.isOutOfStock || p.countInStock <= 5)
                                                .length === 0 && (
                                                <p className="py-6 text-center text-xs text-gray-400">
                                                    🎉 All products are adequately stocked!
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Customer Orders */}
                                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag className="h-5 w-5 text-orange-500" />
                                                <h3 className="text-base font-black text-gray-900">
                                                    Recent Customer Orders
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('orders')}
                                                className="text-xs font-bold text-orange-600 hover:underline"
                                            >
                                                View All →
                                            </button>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {orders.slice(0, 5).map((o) => (
                                                <div
                                                    key={o._id}
                                                    className="flex items-center justify-between py-3"
                                                >
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">
                                                            {o.user?.name || 'Customer'}
                                                        </p>
                                                        <p className="font-mono text-[10px] text-gray-400">
                                                            #{o._id.substring(o._id.length - 8)} •{' '}
                                                            {new Date(o.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-gray-900">
                                                            ₹{o.totalPrice}
                                                        </p>
                                                        <span
                                                            className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                                                o.status === 'Delivered'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                              }`}
                                                        >
                                                            {o.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {orders.length === 0 && (
                                                <p className="py-6 text-center text-xs text-gray-400">
                                                    No orders yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Interactive Sales Analytics & Revenue Trends Charts */}
                                <AdminAnalyticsCharts stats={stats} />
                            </>
                        )}
                    </div>
                )}

                {/* TAB 2: INVENTORY & PRODUCTS MANAGER */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">
                                    Inventory & Product Manager
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Add, edit, adjust stocks, and mark products out of stock in real time
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setEditingProduct(null);
                                    setFormData({
                                        name: '',
                                        price: '',
                                        image: '',
                                        category: '',
                                        countInStock: 20,
                                        description: '',
                                        isOutOfStock: false,
                                    });
                                    setShowAddProductModal(true);
                                }}
                                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                            >
                                <Plus className="h-4 w-4" />
                                Add New Product
                            </button>
                        </div>

                        {/* Search and Filter */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                            <input
                                type="text"
                                placeholder="Search products by title or category..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                            />
                        </div>

                        {/* Products Table */}
                        <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <tr>
                                        <th className="p-4 sm:px-6">Product</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Price</th>
                                        <th className="p-4">Stock Level</th>
                                        <th className="p-4">Status & 1-Click Toggle</th>
                                        <th className="p-4 text-right sm:px-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProducts.map((p) => {
                                        const isOutOfStock = p.isOutOfStock || p.countInStock <= 0;

                                        return (
                                            <tr key={p._id} className="transition hover:bg-gray-50/50">
                                                <td className="p-4 sm:px-6">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={p.image}
                                                            alt={p.name}
                                                            className="h-12 w-12 rounded-xl object-cover shadow-sm"
                                                        />
                                                        <div className="max-w-[200px]">
                                                            <p className="line-clamp-1 font-bold text-gray-900">
                                                                {p.name}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">
                                                                ID: {p._id.substring(p._id.length - 6)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-4 font-semibold text-gray-700">
                                                    {p.category}
                                                </td>

                                                <td className="p-4 font-black text-gray-900">
                                                    ₹{p.price}
                                                </td>

                                                <td className="p-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleAdjustStock(p, -1)}
                                                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 font-bold hover:bg-gray-100"
                                                            title="Decrease stock by 1"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-gray-800">
                                                            {p.countInStock}
                                                        </span>
                                                        <button
                                                            onClick={() => handleAdjustStock(p, 1)}
                                                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 font-bold hover:bg-gray-100"
                                                            title="Increase stock by 1"
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            onClick={() => handleAdjustStock(p, 10)}
                                                            className="rounded-lg bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 hover:bg-emerald-100 transition"
                                                            title="Quick restock +10 units"
                                                        >
                                                            +10
                                                        </button>
                                                        {p.countInStock <= 5 && !isOutOfStock && (
                                                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800">
                                                                Low
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <button
                                                        onClick={() => handleToggleStock(p)}
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider transition ${
                                                            isOutOfStock
                                                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                        }`}
                                                        title="Click to toggle stock status"
                                                    >
                                                        <span
                                                            className={`h-2 w-2 rounded-full ${
                                                                isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500'
                                                            }`}
                                                        />
                                                        {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                                                    </button>
                                                </td>

                                                <td className="p-4 text-right sm:px-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingProduct(p);
                                                                setFormData({
                                                                    name: p.name,
                                                                    price: p.price,
                                                                    image: p.image,
                                                                    category: p.category,
                                                                    countInStock: p.countInStock,
                                                                    description: p.description,
                                                                    isOutOfStock: p.isOutOfStock,
                                                                });
                                                                setShowAddProductModal(true);
                                                            }}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-orange-600"
                                                            title="Edit Product"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteProduct(p._id)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-600"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
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

                {/* TAB 3: CUSTOMER ORDERS HUB */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">
                                    Customer Orders & Dispatch Hub
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Track shipments, update statuses (Pending ➔ Processing ➔ Shipped ➔ Delivered), and review addresses
                                </p>
                            </div>

                            {/* Status Filter Chips and CSV Export */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex flex-wrap gap-1.5">
                                    {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setOrderStatusFilter(status)}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                                orderStatusFilter === status
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => exportOrdersToCSV(orders)}
                                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 hover:border-emerald-500 hover:text-emerald-700 transition shadow-2xs"
                                    title="Download orders report in CSV format"
                                >
                                    <Download className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Export CSV</span>
                                </button>
                            </div>
                        </div>

                        {/* Orders List */}
                        <div className="space-y-4">
                            {filteredOrders.map((order) => (
                                <div
                                    key={order._id}
                                    className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                        <div>
                                            <p className="font-mono text-xs font-bold text-gray-900">
                                                Order #{order._id}
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                Customer: <span className="font-bold text-gray-800">{order.user?.name || 'Customer'}</span> ({order.user?.email || 'N/A'})
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                Date: {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold uppercase text-gray-400">
                                                    Total Bill
                                                </span>
                                                <p className="text-base font-black text-gray-900">
                                                    ₹{order.totalPrice}
                                                </p>
                                            </div>

                                            {/* Interactive Status Dropdown */}
                                            <div className="flex items-center gap-2">
                                                <label className="text-[10px] font-bold uppercase text-gray-400">
                                                    Status:
                                                </label>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) =>
                                                        handleUpdateOrderStatus(order._id, e.target.value)
                                                    }
                                                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                    <option value="Returned">Returned</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items Summary */}
                                    <div className="mt-4 flex flex-wrap gap-4">
                                        {order.orderItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2 text-xs"
                                            >
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                />
                                                <div>
                                                    <p className="line-clamp-1 font-bold text-gray-900">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        Qty: {item.qty} × ₹{item.price}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Delivery Address */}
                                    <div className="mt-4 rounded-xl bg-orange-50/50 p-3 text-xs text-gray-700">
                                        <span className="font-bold text-orange-900">
                                            Shipping Destination:{' '}
                                        </span>
                                        {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                                        {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                                    </div>
                                </div>
                            ))}
                            {filteredOrders.length === 0 && (
                                <p className="py-12 text-center text-xs text-gray-400">
                                    No orders found matching this filter.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: STORE LOOK & APPEARANCE CUSTOMIZER */}
                {activeTab === 'appearance' && (
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-black text-gray-900">
                                Storefront Appearance & Theme Customizer
                            </h2>
                            <p className="text-xs text-gray-500">
                                Update the homepage banner, announcement marquee text, hero headlines, and theme styling in real-time
                            </p>
                        </div>

                        {appearanceStatus.message && (
                            <div
                                className={`mb-6 flex items-center gap-2 rounded-xl p-4 text-xs font-bold ${
                                    appearanceStatus.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                            >
                                {appearanceStatus.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                                )}
                                <span>{appearanceStatus.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleAppearanceSubmit} className="space-y-6">
                            {/* Announcement Bar Customizer */}
                            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900">
                                            Top Announcement Bar
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Sticky bar at the top of the navbar for flash sales, codes, and notice
                                        </p>
                                    </div>

                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={appearance.bannerActive}
                                            onChange={(e) =>
                                                setAppearance({
                                                    ...appearance,
                                                    bannerActive: e.target.checked,
                                                })
                                            }
                                            className="h-4 w-4 rounded text-orange-500"
                                        />
                                        <span className="text-xs font-bold text-gray-700">Active</span>
                                    </label>
                                </div>

                                <input
                                    type="text"
                                    value={appearance.announcement}
                                    onChange={(e) =>
                                        setAppearance({ ...appearance, announcement: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs outline-none focus:border-orange-500"
                                    placeholder="e.g. 🔥 Special Offer: 20% OFF on all electronics! Code: FLASH20"
                                />
                            </div>

                            {/* Hero Banner Headlines */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-gray-900">Homepage Hero Banner Content</h3>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                        Collection Badge Text
                                    </label>
                                    <input
                                        type="text"
                                        value={appearance.heroBadge}
                                        onChange={(e) =>
                                            setAppearance({ ...appearance, heroBadge: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. New Season Collection 2026"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                        Main Hero Headline
                                    </label>
                                    <input
                                        type="text"
                                        value={appearance.heroTitle}
                                        onChange={(e) =>
                                            setAppearance({ ...appearance, heroTitle: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. Everything You Love. In One Place."
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                        Hero Subtitle / Description
                                    </label>
                                    <textarea
                                        rows="2"
                                        value={appearance.heroSubtitle}
                                        onChange={(e) =>
                                            setAppearance({ ...appearance, heroSubtitle: e.target.value })
                                        }
                                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="Brief promotional description..."
                                    />
                                </div>
                            </div>

                            {/* Theme Accent Color Selection */}
                            <div className="border-t border-gray-100 pt-6">
                                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                    Storefront Accent Theme Color
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { id: 'orange', name: 'Warm Orange', bg: 'bg-orange-500' },
                                        { id: 'indigo', name: 'Indigo Blue', bg: 'bg-indigo-600' },
                                        { id: 'emerald', name: 'Emerald Green', bg: 'bg-emerald-600' },
                                        { id: 'rose', name: 'Rose Red', bg: 'bg-rose-500' },
                                        { id: 'blue', name: 'Ocean Cyan', bg: 'bg-cyan-600' },
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setAppearance({ ...appearance, themeColor: c.id });
                                                document.documentElement.setAttribute('data-theme', c.id);
                                            }}
                                            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition ${
                                                appearance.themeColor === c.id
                                                    ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className={`h-3 w-3 rounded-full ${c.bg}`} />
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={appearanceLoading}
                                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
                                >
                                    {appearanceLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Publishing Live Changes...</span>
                                        </>
                                    ) : (
                                        'Publish Live Changes'
                                    )}
                                </button>

                                {appearanceStatus.message && (
                                    <div
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold animate-in fade-in ${
                                            appearanceStatus.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                : 'bg-red-50 text-red-800 border border-red-200'
                                        }`}
                                    >
                                        {appearanceStatus.type === 'success' ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                                        )}
                                        <span>{appearanceStatus.message}</span>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 5: STAFF & CUSTOM ROLES (RBAC) */}
                {activeTab === 'staff' && (
                    <div className="space-y-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">
                                    Staff Members & Role-Based Permissions
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Create custom roles for your staff and grant access to select features only
                                </p>
                            </div>

                            {user?.isAdmin && (
                                <button
                                    onClick={() => setShowStaffModal(true)}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add New Staff Member
                                </button>
                            )}
                        </div>

                        {/* Staff Table */}
                        <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <tr>
                                        <th className="p-4 sm:px-6">Staff Member</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Assigned Role</th>
                                        <th className="p-4">Granted Permissions</th>
                                        <th className="p-4 text-right sm:px-6">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {staffList.map((s) => (
                                        <tr key={s._id} className="transition hover:bg-gray-50/50">
                                            <td className="p-4 font-bold text-gray-900 sm:px-6">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-xs font-bold text-orange-400">
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span>{s.name}</span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-gray-600">{s.email}</td>

                                            <td className="p-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                                        s.role === 'admin'
                                                            ? 'bg-orange-500 text-white'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {s.role}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {s.role === 'admin' ? (
                                                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                                                            Full Access (All Features)
                                                        </span>
                                                    ) : s.permissions?.length > 0 ? (
                                                        s.permissions.map((perm) => (
                                                            <span
                                                                key={perm}
                                                                className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700"
                                                            >
                                                                {perm.replace('manage_', '')}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400">
                                                            No active permissions
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4 text-right sm:px-6">
                                                {s._id !== user._id && user.isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteStaff(s._id)}
                                                        className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                                                        title="Revoke Access"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: PROMOTIONAL COUPONS & CAMPAIGNS */}
                {activeTab === 'coupons' && <AdminCouponsTab userToken={user.token} />}

                {/* TAB: REGISTERED CUSTOMERS DIRECTORY */}
                {activeTab === 'customers' && <AdminCustomersTab userToken={user.token} />}

                {/* TAB: CUSTOMER REVIEWS MODERATION */}
                {activeTab === 'reviews' && <AdminReviewsTab userToken={user.token} />}

                {/* MODAL: ADD / EDIT PRODUCT */}
                {showAddProductModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="text-base font-black text-gray-900">
                                    {editingProduct ? 'Edit Product Details' : 'Add New Product to Store'}
                                </h3>
                                <button
                                    onClick={() => setShowAddProductModal(false)}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {productMessage && (
                                <div
                                    className={`mb-4 rounded-xl p-3 text-xs font-bold ${
                                        productMessage.includes('successfully')
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-rose-50 text-rose-700'
                                    }`}
                                >
                                    {productMessage}
                                </div>
                            )}

                            <form onSubmit={handleProductSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-700">
                                        Product Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. Wireless Noise Canceling Headphones"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-gray-700">
                                            Price (₹)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.price}
                                            onChange={(e) =>
                                                setFormData({ ...formData, price: e.target.value })
                                            }
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                            placeholder="2499"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-gray-700">
                                            Initial Stock Count
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.countInStock}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    countInStock: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                            placeholder="50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-700">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="Electronics, Fashion, Fitness..."
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-700">
                                        Image URL
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={formData.image}
                                        onChange={(e) =>
                                            setFormData({ ...formData, image: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="https://images.unsplash.com/photo-..."
                                    />
                                    {formData.image && (
                                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-2">
                                            <img
                                                src={formData.image}
                                                alt="Preview"
                                                className="h-12 w-12 rounded-lg object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                            <span className="text-[10px] text-gray-500">Live Image Preview</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        rows="3"
                                        required
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="Write an attractive description..."
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={productFormLoading}
                                        className="w-full rounded-xl bg-orange-500 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
                                    >
                                        {productFormLoading
                                            ? 'Saving...'
                                            : editingProduct
                                            ? 'Update Product'
                                            : 'Upload Product to Catalog'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: ADD STAFF MEMBER & PERMISSIONS */}
                {showStaffModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                    <h3 className="text-base font-black text-gray-900">
                                        Invite New Staff Member
                                    </h3>
                                    <p className="text-[10px] text-gray-400">
                                        Assign granular feature permissions for your team
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowStaffModal(false)}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {staffMessage && (
                                <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
                                    {staffMessage}
                                </div>
                            )}

                            <form onSubmit={handleStaffSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-700">
                                        Staff Member Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={staffForm.name}
                                        onChange={(e) =>
                                            setStaffForm({ ...staffForm, name: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. Alex Sharma"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-700">
                                        Staff Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={staffForm.email}
                                        onChange={(e) =>
                                            setStaffForm({ ...staffForm, email: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="alex@dropcart.com"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-700">
                                        Temporary Login Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={staffForm.password}
                                        onChange={(e) =>
                                            setStaffForm({ ...staffForm, password: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="StaffPass@123"
                                    />
                                </div>

                                {/* Granular Permissions Selection */}
                                <div className="border-t border-gray-100 pt-3">
                                    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-900">
                                        Feature Permissions Granted:
                                    </label>
                                    <div className="space-y-2">
                                        {[
                                            {
                                                id: 'manage_products',
                                                title: '📦 Manage Products & Stock',
                                                desc: 'Add, edit, adjust stocks, and mark products out of stock',
                                            },
                                            {
                                                id: 'manage_orders',
                                                title: '📋 Manage Orders & Dispatch',
                                                desc: 'View customer orders and update shipping stages',
                                            },
                                            {
                                                id: 'manage_appearance',
                                                title: '🎨 Manage Look & Announcement',
                                                desc: 'Edit website banners, titles, and themes',
                                            },
                                            {
                                                id: 'manage_staff',
                                                title: '👥 Manage Staff & Roles',
                                                desc: 'Invite, edit, or remove other team members',
                                            },
                                        ].map((perm) => (
                                            <label
                                                key={perm.id}
                                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 transition hover:bg-gray-100/50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={staffForm.permissions.includes(perm.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setStaffForm({
                                                            ...staffForm,
                                                            permissions: checked
                                                                ? [...staffForm.permissions, perm.id]
                                                                : staffForm.permissions.filter(
                                                                      (p) => p !== perm.id
                                                                  ),
                                                        });
                                                    }}
                                                    className="mt-0.5 h-4 w-4 rounded text-orange-500"
                                                />
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800">
                                                        {perm.title}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {perm.desc}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-orange-500 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                                >
                                    Create Staff Account
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
