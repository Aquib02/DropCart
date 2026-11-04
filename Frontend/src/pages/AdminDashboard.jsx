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
    ChevronLeft,
    ChevronRight,
    Menu,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Percent,
    Clock,
    Activity,
    ExternalLink,
    Filter,
    FileSpreadsheet,
    Layers,
    Sparkles,
    LayoutTemplate,
    Boxes,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import AdminAnalyticsCharts from '../components/admin/AdminAnalyticsCharts';
import AdminCouponsTab from '../components/admin/AdminCouponsTab';
import AdminCustomersTab from '../components/admin/AdminCustomersTab';
import AdminReviewsTab from '../components/admin/AdminReviewsTab';
import AdminCampaignsTab from '../components/admin/AdminCampaignsTab';
import AdminVisualEditorTab from '../components/admin/AdminVisualEditorTab';
import AdminProductsTab from '../components/admin/AdminProductsTab';
import AdminInventoryTab from '../components/admin/AdminInventoryTab';
import AdminOrdersTab from '../components/admin/AdminOrdersTab';
import AdminAiTab from '../components/admin/AdminAiTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import AdminSecurityTab from '../components/admin/AdminSecurityTab';
import { exportOrdersToCSV, exportAnalyticsReportToCSV } from '../utils/exportUtils';
import { useSocket } from '../context/SocketContext';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Active Tab: 'overview' | 'products' | 'orders' | 'appearance' | 'staff' | 'coupons' | 'customers' | 'reviews'
    const [activeTab, setActiveTab] = useState('overview');

    // Sidebar & Layout State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Date Range Filter State ('all' | 'today' | '7d' | '30d' | '90d' | '1y' | 'custom')
    const [dateRange, setDateRange] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);

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
    const fetchStats = async (range = dateRange, start = customStartDate, end = customEndDate) => {
        if (!user) return;
        try {
            setLoadingStats(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            let url = `${API_BASE_URL}/api/orders/stats?range=${range}`;
            if (range === 'custom' && start && end) {
                url += `&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
            }
            const { data } = await axios.get(url, config);
            setStats(data);
            setLoadingStats(false);
        } catch {
            setLoadingStats(false);
        }
    };

    const handleSelectRange = (range) => {
        if (range === 'custom') {
            setShowCustomDateModal(true);
            return;
        }
        setDateRange(range);
        fetchStats(range);
    };

    const handleApplyCustomDate = (e) => {
        e.preventDefault();
        if (!customStartDate || !customEndDate) {
            alert('Please select both start and end dates.');
            return;
        }
        setDateRange('custom');
        setShowCustomDateModal(false);
        fetchStats('custom', customStartDate, customEndDate);
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
        <div className="flex min-h-screen bg-[#f8f9fa] text-gray-900 font-sans">
            {/* Mobile Backdrop */}
            {mobileSidebarOpen && (
                <div
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
                />
            )}

            {/* Collapsible Enterprise Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200/80 bg-white transition-all duration-300 ease-in-out lg:static ${
                    isSidebarCollapsed ? 'w-20' : 'w-64'
                } ${mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Sidebar Header */}
                <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/20">
                            <Shield className="h-5 w-5" />
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="truncate">
                                <h2 className="text-sm font-black tracking-tight text-gray-900">DropCart</h2>
                                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest block">
                                    Enterprise OS
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setMobileSidebarOpen(false)}
                        className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Links Grouped */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                    {/* Group: Core Intelligence */}
                    <div>
                        {!isSidebarCollapsed && (
                            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                Intelligence
                            </p>
                        )}
                        <nav className="space-y-1">
                            <button
                                onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
                                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                    activeTab === 'overview'
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                title={isSidebarCollapsed ? 'Overview & KPIs' : undefined}
                            >
                                <BarChart3 className="h-4 w-4 shrink-0" />
                                {!isSidebarCollapsed && <span className="truncate">Overview & KPIs</span>}
                            </button>

                            <button
                                onClick={() => { setActiveTab('ai_assistant'); setMobileSidebarOpen(false); }}
                                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                    activeTab === 'ai_assistant'
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                title={isSidebarCollapsed ? 'AI Business Assistant' : undefined}
                            >
                                <div className="flex items-center gap-3">
                                    <Sparkles className="h-4 w-4 shrink-0 text-purple-500" />
                                    {!isSidebarCollapsed && <span className="truncate">AI Assistant</span>}
                                </div>
                                {!isSidebarCollapsed && (
                                    <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-black text-purple-700">
                                        Gemini
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    {/* Group: Commerce Operations */}
                    <div>
                        {!isSidebarCollapsed && (
                            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                Commerce
                            </p>
                        )}
                        <nav className="space-y-1">
                            {can('manage_products') && (
                                <button
                                    onClick={() => { setActiveTab('products'); setMobileSidebarOpen(false); }}
                                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'products'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isSidebarCollapsed ? 'Products & Stock' : undefined}
                                >
                                    <div className="flex items-center gap-3">
                                        <Package className="h-4 w-4 shrink-0" />
                                        {!isSidebarCollapsed && <span className="truncate">Products Catalog</span>}
                                    </div>
                                    {!isSidebarCollapsed && stats?.lowStockCount > 0 && (
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                            activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {stats.lowStockCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {can('manage_products') && (
                                <button
                                    onClick={() => { setActiveTab('inventory'); setMobileSidebarOpen(false); }}
                                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'inventory'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isSidebarCollapsed ? 'Inventory & Stock' : undefined}
                                >
                                    <div className="flex items-center gap-3">
                                        <Boxes className="h-4 w-4 shrink-0" />
                                        {!isSidebarCollapsed && <span className="truncate">Inventory Control</span>}
                                    </div>
                                </button>
                            )}

                            {can('manage_orders') && (
                                <button
                                    onClick={() => { setActiveTab('orders'); setMobileSidebarOpen(false); }}
                                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'orders'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isSidebarCollapsed ? 'Orders' : undefined}
                                >
                                    <div className="flex items-center gap-3">
                                        <ShoppingBag className="h-4 w-4 shrink-0" />
                                        {!isSidebarCollapsed && <span className="truncate">Orders</span>}
                                    </div>
                                    {!isSidebarCollapsed && (
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                            activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {orders.length}
                                        </span>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => { setActiveTab('customers'); setMobileSidebarOpen(false); }}
                                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                    activeTab === 'customers'
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                title={isSidebarCollapsed ? 'Customers CRM' : undefined}
                            >
                                <Users className="h-4 w-4 shrink-0" />
                                {!isSidebarCollapsed && <span className="truncate">Customers CRM</span>}
                            </button>
                        </nav>
                    </div>

                    {/* Group: Marketing & Storefront */}
                    <div>
                        {!isSidebarCollapsed && (
                            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                Growth & Look
                            </p>
                        )}
                        <nav className="space-y-1">
                            <button
                                onClick={() => { setActiveTab('coupons'); setMobileSidebarOpen(false); }}
                                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                    activeTab === 'coupons'
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                title={isSidebarCollapsed ? 'Coupons & Deals' : undefined}
                            >
                                <Tag className="h-4 w-4 shrink-0" />
                                {!isSidebarCollapsed && <span className="truncate">Coupons & Deals</span>}
                            </button>

                            {can('manage_appearance') && (
                                <button
                                    onClick={() => { setActiveTab('campaigns'); setMobileSidebarOpen(false); }}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'campaigns'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isSidebarCollapsed ? 'Campaigns & Ads' : undefined}
                                >
                                    <Sparkles className="h-4 w-4 shrink-0" />
                                    {!isSidebarCollapsed && <span className="truncate">Campaigns & Ads</span>}
                                </button>
                            )}

                            {can('manage_appearance') && (
                                <button
                                    onClick={() => { setActiveTab('visual_editor'); setMobileSidebarOpen(false); }}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'visual_editor'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isSidebarCollapsed ? 'Homepage Visual Editor' : undefined}
                                >
                                    <LayoutTemplate className="h-4 w-4 shrink-0" />
                                    {!isSidebarCollapsed && <span className="truncate">Visual Editor</span>}
                                </button>
                            )}

                            {can('manage_appearance') && (
                                <button
                                    onClick={() => { setActiveTab('appearance'); setMobileSidebarOpen(false); }}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'appearance'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                title={isSidebarCollapsed ? 'Store Look & Theme' : undefined}
                            >
                                <Palette className="h-4 w-4 shrink-0" />
                                {!isSidebarCollapsed && <span className="truncate">Store Look & Theme</span>}
                            </button>
                            )}
                        </nav>
                    </div>

                    {/* Group: Governance & Security */}
                    <div>
                        {!isSidebarCollapsed && (
                            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                Governance
                            </p>
                        )}
                        <nav className="space-y-1">
                            <button
                                onClick={() => { setActiveTab('reviews'); setMobileSidebarOpen(false); }}
                                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                    activeTab === 'reviews'
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                title={isSidebarCollapsed ? 'Product Reviews' : undefined}
                            >
                                <MessageSquare className="h-4 w-4 shrink-0" />
                                {!isSidebarCollapsed && <span className="truncate">Support & Reviews</span>}
                            </button>

                            {can('manage_staff') && (
                                <button
                                    onClick={() => { setActiveTab('staff'); setMobileSidebarOpen(false); }}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                                        activeTab === 'staff'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isSidebarCollapsed ? 'Staff & Security' : undefined}
                                >
                                    <Shield className="h-4 w-4 shrink-0" />
                                    {!isSidebarCollapsed && <span className="truncate">Staff & Security</span>}
                                </button>
                            )}
                        </nav>
                    </div>
                </div>

                {/* Sidebar Footer User Card */}
                <div className="border-t border-gray-100 p-3">
                    <div className={`flex items-center gap-3 rounded-2xl bg-gray-50 p-2.5 ${isSidebarCollapsed ? 'justify-center p-2' : ''}`}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-gray-900 to-gray-700 text-white font-black text-xs">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="min-w-0 flex-1 truncate">
                                <p className="text-xs font-black text-gray-900 truncate">{user?.name || 'Administrator'}</p>
                                <span className="text-[10px] font-bold text-gray-500 capitalize">
                                    {user?.role === 'admin' || user?.isAdmin ? 'Owner / Admin' : 'Staff Member'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Enterprise Sticky Topbar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
                    {/* Left: Mobile hamburger & Desktop sidebar toggle & Title */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="hidden rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:flex items-center justify-center transition"
                            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                        >
                            {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        </button>

                        <div className="hidden sm:block">
                            <h1 className="text-sm font-black capitalize text-gray-900">
                                {activeTab === 'overview' && 'Executive Dashboard & Analytics'}
                                {activeTab === 'ai_assistant' && 'AI-Powered Business Intelligence Assistant'}
                                {activeTab === 'products' && 'Product Management & Catalog Engine'}
                                {activeTab === 'inventory' && 'Inventory Control & Stock Valuation'}
                                {activeTab === 'orders' && 'Order Fulfillment & Lifecycle'}
                                {activeTab === 'coupons' && 'Coupon & Promotional Offers'}
                                {activeTab === 'campaigns' && 'Campaigns & Promotional Advertisements'}
                                {activeTab === 'visual_editor' && 'Homepage Visual Editor & Section Manager'}
                                {activeTab === 'appearance' && 'Storefront Theme & Branding'}
                                {activeTab === 'customers' && 'Customer Relationship Manager'}
                                {activeTab === 'reviews' && 'Customer Engagement, Support & Reviews Hub'}
                                {activeTab === 'staff' && 'Access Control & Staff RBAC'}
                            </h1>
                            <p className="text-[11px] text-gray-400">
                                Real-time enterprise administration & inventory sync
                            </p>
                        </div>
                    </div>

                    {/* Right: Date Range Selector, Export, Refresh, Storefront */}
                    <div className="flex items-center gap-2">
                        {/* Date Filters (Only visible on Overview) */}
                        {activeTab === 'overview' && (
                            <div className="hidden md:flex items-center rounded-xl bg-gray-100 p-1 text-[11px] font-bold text-gray-600">
                                {['all', 'today', '7d', '30d', '90d', '1y'].map((rng) => (
                                    <button
                                        key={rng}
                                        onClick={() => handleSelectRange(rng)}
                                        className={`rounded-lg px-2.5 py-1 transition uppercase ${
                                            dateRange === rng
                                                ? 'bg-white text-orange-600 shadow-xs'
                                                : 'hover:text-gray-900'
                                        }`}
                                    >
                                        {rng === 'all' ? 'All' : rng}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowCustomDateModal(true)}
                                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                                        dateRange === 'custom'
                                            ? 'bg-white text-orange-600 shadow-xs'
                                            : 'hover:text-gray-900'
                                    }`}
                                >
                                    <Calendar className="h-3 w-3" /> Custom
                                </button>
                            </div>
                        )}

                        {/* Export Analytics Report Button */}
                        {activeTab === 'overview' && (
                            <button
                                onClick={() => exportAnalyticsReportToCSV(stats)}
                                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-orange-600 transition"
                                title="Export CSV Report"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Export Report</span>
                            </button>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={() => {
                                fetchStats();
                                fetchProducts();
                                fetchOrders();
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-xs hover:bg-gray-50 hover:text-orange-600 transition"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin text-orange-500' : ''}`} />
                        </button>

                        {/* View Live Store */}
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-gray-800 transition"
                        >
                            <span>Storefront</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                </header>

                {/* Main Content Body */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">

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
                                {/* 10 Enterprise KPI Cards Grid */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                    {/* Card 1: Gross Revenue */}
                                    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                Gross Revenue
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                                                ₹
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-gray-950">
                                            ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
                                        </p>
                                        <div className="mt-2 flex items-center gap-1 text-[11px] font-bold">
                                            {(stats?.revenueGrowthPercent || 0) >= 0 ? (
                                                <span className="flex items-center text-emerald-600">
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                    +{stats?.revenueGrowthPercent || 0}%
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-rose-600">
                                                    <ArrowDownRight className="h-3.5 w-3.5" />
                                                    {stats?.revenueGrowthPercent || 0}%
                                                </span>
                                            )}
                                            <span className="text-gray-400 font-normal">vs prev period</span>
                                        </div>
                                    </div>

                                    {/* Card 2: Total Net Profit */}
                                    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                Net Profit
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 font-bold">
                                                <TrendingUp className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-teal-700">
                                            ₹{(stats?.totalProfit || 0).toLocaleString('en-IN')}
                                        </p>
                                        <span className="mt-2 text-[11px] font-bold text-gray-500 block">
                                            Based on COGS & margins
                                        </span>
                                    </div>

                                    {/* Card 3: Total Orders */}
                                    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                Total Orders
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                                <ShoppingBag className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-gray-950">
                                            {stats?.totalOrders || 0}
                                        </p>
                                        <div className="mt-2 flex items-center gap-1 text-[11px] font-bold">
                                            {(stats?.orderGrowthPercent || 0) >= 0 ? (
                                                <span className="flex items-center text-emerald-600">
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                    +{stats?.orderGrowthPercent || 0}%
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-rose-600">
                                                    <ArrowDownRight className="h-3.5 w-3.5" />
                                                    {stats?.orderGrowthPercent || 0}%
                                                </span>
                                            )}
                                            <span className="text-gray-400 font-normal">volume growth</span>
                                        </div>
                                    </div>

                                    {/* Card 4: Average Order Value */}
                                    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                Avg Order Value
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                <Percent className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-gray-950">
                                            ₹{(stats?.averageOrderValue || 0).toLocaleString('en-IN')}
                                        </p>
                                        <span className="mt-2 text-[11px] font-bold text-gray-500 block">
                                            Revenue per checkout
                                        </span>
                                    </div>

                                    {/* Card 5: Conversion Rate */}
                                    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                Conversion Rate
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                                <Activity className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-purple-700">
                                            {stats?.conversionRate || 0}%
                                        </p>
                                        <span className="mt-2 text-[11px] font-bold text-emerald-600 block">
                                            Customer conversion
                                        </span>
                                    </div>

                                    {/* Card 6: Total Customers */}
                                    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                Shoppers
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                                <Users className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-gray-950">
                                            {stats?.totalUsers || 0}
                                        </p>
                                        <span className="mt-2 text-[11px] font-bold text-gray-400 block">
                                            {stats?.totalStaff || 0} staff / admins
                                        </span>
                                    </div>

                                    {/* Card 7: Pending Orders */}
                                    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                Pending Orders
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold text-xs">
                                                <Clock className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-amber-600">
                                            {stats?.pendingOrders || 0}
                                        </p>
                                        <span className="mt-2 text-[11px] font-bold text-amber-700 block">
                                            Awaiting dispatch
                                        </span>
                                    </div>

                                    {/* Card 8: Delivered Orders */}
                                    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                Delivered
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-emerald-600">
                                            {stats?.deliveredOrders || 0}
                                        </p>
                                        <span className="mt-2 text-[11px] font-bold text-emerald-700 block">
                                            Fulfilled checkouts
                                        </span>
                                    </div>

                                    {/* Card 9: Cancelled / Returned */}
                                    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                Cancelled / Ret
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                                <AlertCircle className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-rose-600">
                                            {stats?.cancelledOrders || 0}
                                        </p>
                                        <span className="mt-2 text-[11px] font-bold text-rose-700 block">
                                            Returned orders
                                        </span>
                                    </div>

                                    {/* Card 10: Low Stock Alerts */}
                                    <div
                                        onClick={() => setActiveTab('products')}
                                        className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-md transition cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 group-hover:text-orange-600">
                                                Low Stock Alerts
                                            </span>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                                <AlertTriangle className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black text-rose-600">
                                            {stats?.lowStockCount || 0}
                                        </p>
                                        <span className="mt-2 text-[11px] font-bold text-orange-600 block group-hover:underline">
                                            {stats?.outOfStockProducts || 0} depleted items →
                                        </span>
                                    </div>
                                </div>

                                {/* Multi-Interval Revenue & Performance Comparison Charts */}
                                <AdminAnalyticsCharts stats={stats} />

                                {/* Operations Grid: Live Activity Stream & Critical Stock Depletion */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    {/* Left: Real-Time Live Activity Feed (6 cols) */}
                                    <div className="lg:col-span-6 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-900">
                                                        Recent Business Activities
                                                    </h3>
                                                    <p className="text-[11px] text-gray-500">
                                                        Live database event timeline
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                                                Real-Time
                                            </span>
                                        </div>

                                        <div className="mt-4 divide-y divide-gray-100">
                                            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                                                stats.recentActivities.map((act) => (
                                                    <div key={act.id} className="flex items-start gap-3 py-3">
                                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                                                            {act.type === 'order' && <ShoppingBag className="h-3.5 w-3.5 text-orange-600" />}
                                                            {act.type === 'user' && <Users className="h-3.5 w-3.5 text-blue-600" />}
                                                            {act.type === 'stock' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-xs font-bold text-gray-900 truncate">
                                                                    {act.title}
                                                                </p>
                                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                                                {act.desc}
                                                            </p>
                                                        </div>
                                                        {act.status && (
                                                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                                                act.status === 'Delivered'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : act.status === 'Cancelled'
                                                                    ? 'bg-rose-100 text-rose-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                                {act.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="py-8 text-center text-xs text-gray-400">
                                                    No recent activities logged yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Critical Stock Depletion Table (6 cols) */}
                                    <div className="lg:col-span-6 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                                    <AlertTriangle className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-900">
                                                        Low Stock & Depleted Inventory
                                                    </h3>
                                                    <p className="text-[11px] text-gray-500">
                                                        Items requiring immediate replenishment
                                                    </p>
                                                </div>
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
                                                                className="h-10 w-10 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100"
                                                            />
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-900 line-clamp-1 max-w-[180px]">
                                                                    {p.name}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400">
                                                                    ₹{p.price} • {p.category}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
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
                                                                onClick={() => handleAdjustStock(p, 15)}
                                                                className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                                                            >
                                                                +15
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleStock(p)}
                                                                className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition"
                                                            >
                                                                Toggle
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            {products.filter((p) => p.isOutOfStock || p.countInStock <= 5)
                                                .length === 0 && (
                                                <p className="py-8 text-center text-xs text-gray-400">
                                                    🎉 All inventory items are adequately stocked!
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                {/* Recent Customer Orders Quick View */}
                                <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                                <ShoppingBag className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900">
                                                    Recent Customer Orders
                                                </h3>
                                                <p className="text-[11px] text-gray-500">
                                                    Latest checkouts awaiting or in fulfillment
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('orders')}
                                            className="text-xs font-bold text-orange-600 hover:underline"
                                        >
                                            Manage All ({orders.length}) →
                                        </button>
                                    </div>

                                    <div className="mt-4 divide-y divide-gray-100">
                                        {orders.slice(0, 6).map((o) => (
                                            <div
                                                key={o._id}
                                                className="flex items-center justify-between py-3 hover:bg-gray-50/50 px-2 rounded-xl transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 font-mono text-[11px] font-black text-gray-700">
                                                        #{o._id.substring(o._id.length - 4).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">
                                                            {o.user?.name || 'Customer'}
                                                        </p>
                                                        <p className="font-mono text-[10px] text-gray-400">
                                                            {new Date(o.createdAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}{' '}
                                                            • {o.paymentMethod || 'COD'}
                                                        </p>
                                                    </div>
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
                                                <p className="py-8 text-center text-xs text-gray-400">
                                                    No orders recorded in database yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                            </>
                        )}
                    </div>
                )}

                {/* TAB: AI-POWERED ADMIN ASSISTANT */}
                {activeTab === 'ai_assistant' && <AdminAiTab userToken={user.token} />}

                {/* TAB 2: ADVANCED PRODUCT MANAGEMENT */}
                {activeTab === 'products' && <AdminProductsTab userToken={user.token} />}

                {/* TAB: INVENTORY CONTROL & AUDIT TRAIL */}
                {activeTab === 'inventory' && <AdminInventoryTab userToken={user.token} />}

                {/* TAB 3: CUSTOMER ORDERS & LIFECYCLE MANAGEMENT */}
                {activeTab === 'orders' && <AdminOrdersTab userToken={user?.token} />}

                {/* TAB 4: STORE LOOK & APPEARANCE CUSTOMIZER */}
                {activeTab === 'appearance' && <AdminSettingsTab userToken={user.token} />}
                {false && activeTab === 'appearance' && (
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
                                    style={{
                                        backgroundColor:
                                            appearance.themeColor === 'emerald' ? '#059669' :
                                            appearance.themeColor === 'indigo' ? '#4f46e5' :
                                            appearance.themeColor === 'rose' ? '#e11d48' :
                                            appearance.themeColor === 'blue' ? '#0284c7' : '#f97316'
                                    }}
                                    className="flex items-center gap-2 rounded-xl px-8 py-3 text-xs font-bold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
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
                {activeTab === 'staff' && <AdminSecurityTab userToken={user.token} currentUser={user} />}
                {false && activeTab === 'staff' && (
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

                {/* TAB: PROMOTIONAL COUPONS */}
                {activeTab === 'coupons' && <AdminCouponsTab userToken={user.token} />}

                {/* TAB: ADVERTISEMENT & CAMPAIGN MANAGEMENT */}
                {activeTab === 'campaigns' && <AdminCampaignsTab userToken={user.token} />}

                {/* TAB: HOMEPAGE VISUAL EDITOR */}
                {activeTab === 'visual_editor' && <AdminVisualEditorTab userToken={user.token} />}

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
                {/* Custom Date Range Picker Modal */}
                {showCustomDateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-gray-900">Custom Date Range</h3>
                                        <p className="text-xs text-gray-500">Filter orders & analytics by exact dates</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCustomDateModal(false)}
                                    className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleApplyCustomDate} className="mt-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomDateModal(false)}
                                        className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
                                    >
                                        Apply Range
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
