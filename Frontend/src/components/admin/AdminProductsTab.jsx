import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Copy,
    Star,
    Flame,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Loader2,
    UploadCloud,
    Download,
    Percent,
    DollarSign,
    SlidersHorizontal,
    X,
    Image as ImageIcon,
    Tag,
    Layers,
    Calendar,
    ArrowUpDown,
    CheckSquare,
    Square
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminProductsTab = ({ userToken }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState({ type: '', message: '' });

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [approvalFilter, setApprovalFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('newest');

    // Selection for bulk actions
    const [selectedProductIds, setSelectedProductIds] = useState(new Set());

    // Modals
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [showBulkPricingModal, setShowBulkPricingModal] = useState(false);

    // Form Data for Add / Edit
    const initialFormState = {
        name: '',
        sku: '',
        barcode: '',
        brand: 'DropCart',
        category: 'Electronics',
        price: '',
        costPrice: '',
        originalPrice: '',
        discountPercent: '',
        countInStock: 20,
        lowStockThreshold: 5,
        description: '',
        image: '',
        imagesText: '',
        status: 'active',
        approvalStatus: 'approved',
        approvalNotes: '',
        scheduledPublishDate: '',
        isFeatured: false,
        isBestSeller: false,
        tag: '',
        supplierName: '',
        supplierContact: '',
        supplierLeadDays: 3,
    };
    const [formData, setFormData] = useState(initialFormState);

    // Bulk Upload State
    const [csvParsedRows, setCsvParsedRows] = useState([]);
    const [csvFileName, setCsvFileName] = useState('');

    // Bulk Pricing State
    const [bulkPriceConfig, setBulkPriceConfig] = useState({
        changeType: 'percentage_increase', // 'percentage_increase' | 'percentage_decrease' | 'fixed_increase' | 'fixed_decrease' | 'set_discount'
        value: 10,
        applyTo: 'selected', // 'selected' | 'category'
        targetCategory: 'Electronics'
    });

    const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

    // Fetch Products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/products`);
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            showNotice('error', 'Failed to load products.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const showNotice = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification({ type: '', message: '' }), 5000);
    };

    // Filtered & Sorted Products
    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            !searchTerm ||
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesApproval = approvalFilter === 'All' || (p.approvalStatus || 'approved') === approvalFilter;
        const matchesStatus = statusFilter === 'All' || (p.status || 'active') === statusFilter;

        return matchesSearch && matchesCategory && matchesApproval && matchesStatus;
    }).sort((a, b) => {
        if (sortBy === 'price-low') return (Number(a.price) || 0) - (Number(b.price) || 0);
        if (sortBy === 'price-high') return (Number(b.price) || 0) - (Number(a.price) || 0);
        if (sortBy === 'stock-low') return (Number(a.countInStock) || 0) - (Number(b.countInStock) || 0);
        if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Checkbox selection
    const handleToggleSelectAll = () => {
        if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(filteredProducts.map(p => p._id)));
        }
    };

    const handleToggleSelectProduct = (id) => {
        const next = new Set(selectedProductIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedProductIds(next);
    };

    // Open Add Modal
    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setFormData(initialFormState);
        setShowProductModal(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (p) => {
        setEditingProduct(p);
        setFormData({
            name: p.name || '',
            sku: p.sku || '',
            barcode: p.barcode || '',
            brand: p.brand || 'DropCart',
            category: p.category || 'General',
            price: p.price !== undefined ? p.price : '',
            costPrice: p.costPrice !== undefined ? p.costPrice : '',
            originalPrice: p.originalPrice !== undefined ? p.originalPrice : '',
            discountPercent: p.discountPercent !== undefined ? p.discountPercent : '',
            countInStock: p.countInStock !== undefined ? p.countInStock : 20,
            lowStockThreshold: p.lowStockThreshold || 5,
            description: p.description || '',
            image: p.image || '',
            imagesText: Array.isArray(p.images) ? p.images.join('\n') : (p.image || ''),
            status: p.status || 'active',
            approvalStatus: p.approvalStatus || 'approved',
            approvalNotes: p.approvalNotes || '',
            scheduledPublishDate: p.scheduledPublishDate ? new Date(p.scheduledPublishDate).toISOString().slice(0, 16) : '',
            isFeatured: Boolean(p.isFeatured),
            isBestSeller: Boolean(p.isBestSeller),
            tag: p.tag || '',
            supplierName: p.supplier?.name || '',
            supplierContact: p.supplier?.contact || '',
            supplierLeadDays: p.supplier?.leadTimeDays || 3,
        });
        setShowProductModal(true);
    };

    // Submit Add / Edit
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        const imagesArr = formData.imagesText
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);

        const payload = {
            name: formData.name,
            sku: formData.sku,
            barcode: formData.barcode,
            brand: formData.brand,
            category: formData.category,
            price: Number(formData.price),
            costPrice: Number(formData.costPrice) || Math.round(Number(formData.price) * 0.7),
            originalPrice: Number(formData.originalPrice) || Number(formData.price),
            discountPercent: formData.discountPercent !== '' ? Number(formData.discountPercent) : undefined,
            countInStock: Number(formData.countInStock),
            lowStockThreshold: Number(formData.lowStockThreshold) || 5,
            description: formData.description,
            image: formData.image || imagesArr[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
            images: imagesArr.length > 0 ? imagesArr : [formData.image],
            status: formData.status,
            approvalStatus: formData.approvalStatus,
            approvalNotes: formData.approvalNotes,
            scheduledPublishDate: formData.scheduledPublishDate ? new Date(formData.scheduledPublishDate) : null,
            isFeatured: formData.isFeatured,
            isBestSeller: formData.isBestSeller,
            tag: formData.tag,
            supplier: {
                name: formData.supplierName,
                contact: formData.supplierContact,
                leadTimeDays: Number(formData.supplierLeadDays)
            }
        };

        try {
            if (editingProduct) {
                await axios.put(`${API_BASE_URL}/api/products/${editingProduct._id}`, payload, authConfig);
                showNotice('success', `Product "${payload.name}" updated successfully!`);
            } else {
                await axios.post(`${API_BASE_URL}/api/products`, payload, authConfig);
                showNotice('success', `Product "${payload.name}" created successfully!`);
            }
            setShowProductModal(false);
            await fetchProducts();
        } catch (error) {
            showNotice('error', error.response?.data?.message || 'Failed to save product');
        } finally {
            setActionLoading(false);
        }
    };

    // Duplicate Product
    const handleDuplicate = async (productId, name) => {
        setActionLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/products/${productId}/duplicate`, {}, authConfig);
            if (res.data.success) {
                showNotice('success', res.data.message);
                await fetchProducts();
            }
        } catch (error) {
            showNotice('error', error.response?.data?.message || 'Duplication failed');
        } finally {
            setActionLoading(false);
        }
    };

    // Toggle Featured
    const handleToggleFeatured = async (productId) => {
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/products/${productId}/featured`, {}, authConfig);
            setProducts(prev => prev.map(p => p._id === productId ? { ...p, isFeatured: res.data.isFeatured } : p));
        } catch (err) {
            showNotice('error', 'Failed to toggle featured status');
        }
    };

    // Toggle BestSeller
    const handleToggleBestSeller = async (productId) => {
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/products/${productId}/bestseller`, {}, authConfig);
            setProducts(prev => prev.map(p => p._id === productId ? { ...p, isBestSeller: res.data.isBestSeller } : p));
        } catch (err) {
            showNotice('error', 'Failed to toggle best seller status');
        }
    };

    // Toggle Visibility (Active / Draft)
    const handleToggleVisibility = async (product) => {
        const nextStatus = product.status === 'active' ? 'draft' : 'active';
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/products/${product._id}/visibility`, { status: nextStatus }, authConfig);
            setProducts(prev => prev.map(p => p._id === product._id ? { ...p, status: res.data.status } : p));
            showNotice('success', `Product visibility changed to ${nextStatus}.`);
        } catch (err) {
            showNotice('error', 'Failed to update visibility');
        }
    };

    // Delete Product
    const handleDelete = async (productId, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/products/${productId}`, authConfig);
            showNotice('success', `Product "${name}" deleted.`);
            setProducts(prev => prev.filter(p => p._id !== productId));
        } catch (err) {
            showNotice('error', err.response?.data?.message || 'Delete failed');
        }
    };

    // Quick stock step
    const handleQuickStock = async (product, delta) => {
        const newStock = Math.max(0, product.countInStock + delta);
        try {
            await axios.post(
                `${API_BASE_URL}/api/inventory/adjust`,
                { productId: product._id, newStock, reason: 'Quick table stock adjustment' },
                authConfig
            );
            setProducts(prev => prev.map(p => p._id === product._id ? { ...p, countInStock: newStock, isOutOfStock: newStock === 0 } : p));
        } catch (err) {
            showNotice('error', 'Failed to adjust stock');
        }
    };

    // CSV File Reader
    const handleCsvFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text !== 'string') return;

            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                alert('CSV file must have a header row and at least 1 data row.');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
            const parsed = [];

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
                if (cols.length < 2) continue;

                const row = {};
                headers.forEach((h, idx) => {
                    row[h] = cols[idx] !== undefined ? cols[idx] : '';
                });

                parsed.push({
                    name: row.name || `Bulk Product #${i}`,
                    sku: row.sku || `SKU-BULK-${Date.now().toString().slice(-4)}${i}`,
                    brand: row.brand || 'DropCart',
                    category: row.category || 'General',
                    price: Number(row.price) || 999,
                    costPrice: Number(row.costprice || row.cost) || Math.round((Number(row.price) || 999) * 0.7),
                    originalPrice: Number(row.originalprice || row.mrp) || (Number(row.price) || 999),
                    countInStock: Number(row.stock || row.countinstock) || 20,
                    description: row.description || 'Verified authentic bulk upload product.',
                    image: row.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
                });
            }

            setCsvParsedRows(parsed);
        };
        reader.readAsText(file);
    };

    // Bulk Upload Submit
    const handleExecuteBulkUpload = async () => {
        if (csvParsedRows.length === 0) return;
        setActionLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/products/bulk-upload`, { products: csvParsedRows }, authConfig);
            if (res.data.success) {
                showNotice('success', res.data.message);
                setShowBulkUploadModal(false);
                setCsvParsedRows([]);
                setCsvFileName('');
                await fetchProducts();
            }
        } catch (err) {
            showNotice('error', err.response?.data?.message || 'Bulk upload failed');
        } finally {
            setActionLoading(false);
        }
    };

    // Bulk Price / Discount Execute
    const handleExecuteBulkPricing = async () => {
        setActionLoading(true);
        try {
            const ids = bulkPriceConfig.applyTo === 'selected' ? Array.from(selectedProductIds) : [];
            const cat = bulkPriceConfig.applyTo === 'category' ? bulkPriceConfig.targetCategory : undefined;

            if (bulkPriceConfig.changeType === 'set_discount') {
                const res = await axios.patch(
                    `${API_BASE_URL}/api/products/bulk-discount-update`,
                    { productIds: ids, category: cat, discountPercent: bulkPriceConfig.value },
                    authConfig
                );
                showNotice('success', res.data.message);
            } else {
                const res = await axios.patch(
                    `${API_BASE_URL}/api/products/bulk-price-update`,
                    {
                        productIds: ids,
                        category: cat,
                        changeType: bulkPriceConfig.changeType,
                        value: bulkPriceConfig.value
                    },
                    authConfig
                );
                showNotice('success', res.data.message);
            }

            setShowBulkPricingModal(false);
            setSelectedProductIds(new Set());
            await fetchProducts();
        } catch (err) {
            showNotice('error', err.response?.data?.message || 'Bulk pricing update failed');
        } finally {
            setActionLoading(false);
        }
    };

    // Download CSV Sample Template
    const handleDownloadTemplate = () => {
        const csvContent =
            'name,sku,brand,category,price,costPrice,originalPrice,countInStock,description,image\n' +
            'Apple iPhone 15 Pro,SKU-APL-IP15P,Apple,Mobiles,129900,105000,134900,15,Super Retina XDR titanium finish,https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80\n' +
            'Sony WH-1000XM5 Wireless Headphones,SKU-SNY-XM5,Sony,Electronics,26990,21000,34990,25,Industry leading noise cancellation,https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80\n';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'dropcart_products_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export Catalog CSV
    const handleExportCatalog = () => {
        if (products.length === 0) return;
        const headers = ['ID', 'Name', 'SKU', 'Brand', 'Category', 'Price', 'CostPrice', 'OriginalPrice', 'Stock', 'Status', 'Approval', 'Rating'];
        const rows = products.map(p => [
            p._id,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            p.sku || '',
            p.brand || '',
            p.category || '',
            p.price,
            p.costPrice || '',
            p.originalPrice || '',
            p.countInStock,
            p.status || 'active',
            p.approvalStatus || 'approved',
            p.rating || 4.5
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `dropcart_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* KPI Overview Banner */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Products</span>
                    <p className="mt-1 text-2xl font-black text-gray-900">{products.length}</p>
                    <span className="text-[11px] text-gray-500">Across {new Set(products.map(p => p.category)).size} categories</span>
                </div>

                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Active Live</span>
                    <p className="mt-1 text-2xl font-black text-emerald-700">
                        {products.filter(p => (p.status || 'active') === 'active').length}
                    </p>
                    <span className="text-[11px] text-emerald-600">Available to customers</span>
                </div>

                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Pending Approval</span>
                    <p className="mt-1 text-2xl font-black text-amber-700">
                        {products.filter(p => p.approvalStatus === 'pending_approval').length}
                    </p>
                    <span className="text-[11px] text-amber-600">Awaiting manager review</span>
                </div>

                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">Featured & Bestsellers</span>
                    <p className="mt-1 text-2xl font-black text-purple-700">
                        {products.filter(p => p.isFeatured || p.isBestSeller).length}
                    </p>
                    <span className="text-[11px] text-purple-600">High-priority placements</span>
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

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Add Product */}
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600 shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add New Product</span>
                    </button>

                    {/* Bulk Upload CSV */}
                    <button
                        type="button"
                        onClick={() => setShowBulkUploadModal(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                    >
                        <UploadCloud className="h-4 w-4 text-gray-500" />
                        <span>Bulk Upload CSV</span>
                    </button>

                    {/* Bulk Price / Discount */}
                    <button
                        type="button"
                        onClick={() => setShowBulkPricingModal(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                    >
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span>Bulk Price & Discount</span>
                    </button>

                    {/* Export Catalog */}
                    <button
                        type="button"
                        onClick={handleExportCatalog}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                        title="Download catalog as CSV"
                    >
                        <Download className="h-4 w-4 text-gray-500" />
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search name, brand, SKU..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                    />
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 outline-none"
                    >
                        <option value="All">All Categories</option>
                        {Array.from(new Set(products.map(p => p.category))).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select
                        value={approvalFilter}
                        onChange={(e) => setApprovalFilter(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 outline-none"
                    >
                        <option value="All">All Approvals</option>
                        <option value="approved">Approved</option>
                        <option value="pending_approval">Pending Review</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 outline-none"
                    >
                        <option value="All">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 outline-none"
                    >
                        <option value="newest">Sort: Newest First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="stock-low">Stock: Low to High</option>
                        <option value="rating">Top Rated</option>
                    </select>
                </div>

                {selectedProductIds.size > 0 && (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                        {selectedProductIds.size} selected for bulk actions
                    </span>
                )}
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto rounded-3xl border border-gray-200/80 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        <tr>
                            <th className="p-4 pl-6 w-10">
                                <button type="button" onClick={handleToggleSelectAll} className="text-gray-400 hover:text-gray-700">
                                    {selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                                        <CheckSquare className="h-4 w-4 text-orange-500" />
                                    ) : (
                                        <Square className="h-4 w-4" />
                                    )}
                                </button>
                            </th>
                            <th className="p-4">Product & SKU</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price & Margins</th>
                            <th className="p-4">Stock Level</th>
                            <th className="p-4">Workflow & Status</th>
                            <th className="p-4 text-center">Badges</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProducts.map((p) => {
                            const isSelected = selectedProductIds.has(p._id);
                            const isOutOfStock = p.isOutOfStock || (p.countInStock || 0) <= 0;
                            const isLowStock = !isOutOfStock && (p.countInStock || 0) <= (p.lowStockThreshold || 5);

                            return (
                                <tr key={p._id} className={`transition hover:bg-gray-50/60 ${isSelected ? 'bg-orange-50/20' : ''}`}>
                                    <td className="p-4 pl-6">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleSelectProduct(p._id)}
                                            className="text-gray-400 hover:text-gray-700"
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="h-4 w-4 text-orange-500" />
                                            ) : (
                                                <Square className="h-4 w-4" />
                                            )}
                                        </button>
                                    </td>

                                    {/* Thumbnail + Name + Brand + SKU */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={p.image || p.images?.[0] || 'https://via.placeholder.com/80'}
                                                alt={p.name}
                                                className="h-12 w-12 rounded-xl object-cover shrink-0 border border-gray-100"
                                            />
                                            <div className="max-w-[220px]">
                                                <p className="line-clamp-1 font-bold text-gray-900">{p.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[10px] font-mono text-gray-600">
                                                        {p.sku || 'NO-SKU'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">• {p.brand || 'DropCart'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="p-4">
                                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-700">
                                            {p.category}
                                        </span>
                                    </td>

                                    {/* Pricing & Cost */}
                                    <td className="p-4">
                                        <div>
                                            <span className="font-black text-gray-900">₹{Number(p.price).toLocaleString('en-IN')}</span>
                                            {p.originalPrice && p.originalPrice > p.price && (
                                                <span className="ml-1 text-[10px] text-gray-400 line-through">
                                                    ₹{Number(p.originalPrice).toLocaleString('en-IN')}
                                                </span>
                                            )}
                                            {p.discountPercent > 0 && (
                                                <span className="ml-1.5 text-[10px] font-black text-emerald-600">
                                                    {p.discountPercent}% OFF
                                                </span>
                                            )}
                                            {p.costPrice > 0 && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    Cost: ₹{Number(p.costPrice).toLocaleString('en-IN')}
                                                </p>
                                            )}
                                        </div>
                                    </td>

                                    {/* Stock Level with Quick +/- */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleQuickStock(p, -1)}
                                                className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-black text-gray-900">{p.countInStock}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleQuickStock(p, 1)}
                                                className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                                            >
                                                +
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleQuickStock(p, 10)}
                                                className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-black text-emerald-700 hover:bg-emerald-100"
                                            >
                                                +10
                                            </button>
                                            {isOutOfStock ? (
                                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-700 uppercase">
                                                    Out
                                                </span>
                                            ) : isLowStock ? (
                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 uppercase">
                                                    Low
                                                </span>
                                            ) : null}
                                        </div>
                                    </td>

                                    {/* Workflow Status */}
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleVisibility(p)}
                                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                                    p.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : p.status === 'draft'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {p.status || 'active'}
                                            </button>
                                            <div>
                                                <span className={`text-[10px] font-bold ${
                                                    p.approvalStatus === 'approved' ? 'text-emerald-600' :
                                                    p.approvalStatus === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                                                }`}>
                                                    {p.approvalStatus === 'pending_approval' ? 'Pending Review' : (p.approvalStatus || 'approved')}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Featured & Bestseller Badges */}
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleFeatured(p._id)}
                                                className={`p-1 rounded-md transition ${p.isFeatured ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-gray-500'}`}
                                                title={p.isFeatured ? 'Featured Product (Click to unset)' : 'Mark as Featured'}
                                            >
                                                <Star className="h-4 w-4 fill-current" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleBestSeller(p._id)}
                                                className={`p-1 rounded-md transition ${p.isBestSeller ? 'text-rose-500 bg-rose-50' : 'text-gray-300 hover:text-gray-500'}`}
                                                title={p.isBestSeller ? 'Best Seller (Click to unset)' : 'Mark as Best Seller'}
                                            >
                                                <Flame className="h-4 w-4 fill-current" />
                                            </button>
                                        </div>
                                    </td>

                                    {/* Action Buttons */}
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleDuplicate(p._id, p.name)}
                                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                title="Duplicate Product as Draft"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditModal(p)}
                                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-orange-600"
                                                title="Edit Product Details"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(p._id, p.name)}
                                                className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
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

            {/* MODAL 1: ADD / EDIT PRODUCT */}
            {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">
                                    {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product to Catalog'}
                                </h3>
                                <p className="text-xs text-gray-500">Configure catalog information, SKU, pricing, variants & approval status</p>
                            </div>
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
                            {/* Row 1: Title & Category */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Product Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Category *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. Electronics"
                                    />
                                </div>
                            </div>

                            {/* Row 2: SKU, Barcode & Brand */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">SKU Code</label>
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-mono text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. SKU-SNY-XM5"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Barcode / UPC</label>
                                    <input
                                        type="text"
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-mono text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. 890123456789"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Brand Name</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. Sony"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Pricing & Cost */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Selling Price (₹) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-black text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Cost Price (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.costPrice}
                                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="For profit calculations"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">MRP / Strikethrough (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.originalPrice}
                                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Discount % Override</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={formData.discountPercent}
                                        onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="Auto from MRP"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Stock & Threshold */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Stock Units *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.countInStock}
                                        onChange={(e) => setFormData({ ...formData, countInStock: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-black text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Low-Stock Alert Level</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.lowStockThreshold}
                                        onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Promotional Tag</label>
                                    <input
                                        type="text"
                                        value={formData.tag}
                                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. Festival Bestseller"
                                    />
                                </div>
                            </div>

                            {/* Row 5: Multi-Image Gallery */}
                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">
                                    Primary Image URL *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">
                                    Additional Gallery Images (1 URL per line)
                                </label>
                                <textarea
                                    rows="2"
                                    value={formData.imagesText}
                                    onChange={(e) => setFormData({ ...formData, imagesText: e.target.value })}
                                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-mono text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                    placeholder="https://images.unsplash.com/photo-1&#10;https://images.unsplash.com/photo-2"
                                />
                            </div>

                            {/* Row 6: Description */}
                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Description *</label>
                                <textarea
                                    rows="3"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    placeholder="Product description, features, warranty, and specifications..."
                                />
                            </div>

                            {/* Row 7: Workflow & Visibility Settings */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-gray-100 pt-3">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Visibility Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                                    >
                                        <option value="active">Active (Visible)</option>
                                        <option value="draft">Draft (Hidden)</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Approval Status</label>
                                    <select
                                        value={formData.approvalStatus}
                                        onChange={(e) => setFormData({ ...formData, approvalStatus: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                                    >
                                        <option value="approved">Approved</option>
                                        <option value="pending_approval">Pending Approval</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Scheduled Publishing Date</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduledPublishDate}
                                        onChange={(e) => setFormData({ ...formData, scheduledPublishDate: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-800 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Toggles: Featured & Bestseller */}
                            <div className="flex flex-wrap items-center gap-6 border-t border-gray-100 pt-3">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isFeatured}
                                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                        className="h-4 w-4 rounded text-orange-500"
                                    />
                                    <span>Feature on Homepage Sections</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isBestSeller}
                                        onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                                        className="h-4 w-4 rounded text-orange-500"
                                    />
                                    <span>Mark as Top Best Seller</span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowProductModal(false)}
                                    className="rounded-xl border border-gray-200 px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: BULK UPLOAD CSV */}
            {showBulkUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">Bulk Product Upload (Excel / CSV)</h3>
                                <p className="text-xs text-gray-500">Upload multiple products simultaneously via CSV file</p>
                            </div>
                            <button
                                onClick={() => setShowBulkUploadModal(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {/* Template Download Box */}
                            <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                                <div>
                                    <h4 className="text-xs font-black text-blue-900">Need the CSV Template?</h4>
                                    <p className="text-[11px] text-blue-700">Download the formatted CSV file containing sample products and headers.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Download Template</span>
                                </button>
                            </div>

                            {/* File Upload Drop Area */}
                            <div className="rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-orange-500 transition">
                                <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-xs font-bold text-gray-800">
                                    {csvFileName ? `Selected: ${csvFileName}` : 'Choose a CSV file to upload'}
                                </p>
                                <p className="text-[11px] text-gray-400">Supported format: .csv with comma separation</p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCsvFileChange}
                                    className="mt-3 block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                                />
                            </div>

                            {/* Preview Parsed Rows */}
                            {csvParsedRows.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-gray-900">{csvParsedRows.length} Products Ready to Import</span>
                                        <span className="text-[10px] text-emerald-600 font-bold">Validated OK</span>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 text-xs">
                                        {csvParsedRows.slice(0, 5).map((row, idx) => (
                                            <div key={idx} className="p-2.5 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-900">{row.name}</p>
                                                    <p className="text-[10px] text-gray-400">{row.sku} • {row.category}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-gray-900">₹{row.price}</p>
                                                    <p className="text-[10px] text-gray-400">{row.countInStock} in stock</p>
                                                </div>
                                            </div>
                                        ))}
                                        {csvParsedRows.length > 5 && (
                                            <p className="p-2 text-center text-[10px] text-gray-400 font-bold">
                                                + {csvParsedRows.length - 5} more products...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkUploadModal(false)}
                                    className="rounded-xl border border-gray-200 px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={csvParsedRows.length === 0 || actionLoading}
                                    onClick={handleExecuteBulkUpload}
                                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    <span>Import {csvParsedRows.length} Products</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: BULK PRICING & DISCOUNT */}
            {showBulkPricingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">Bulk Price & Discount Engine</h3>
                                <p className="text-xs text-gray-500">Apply batch percentage or fixed adjustments across catalog</p>
                            </div>
                            <button
                                onClick={() => setShowBulkPricingModal(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Apply Changes To</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, applyTo: 'selected' })}
                                        className={`rounded-xl border p-3 text-xs font-bold transition text-left ${
                                            bulkPriceConfig.applyTo === 'selected'
                                                ? 'border-orange-500 bg-orange-50 text-orange-900'
                                                : 'border-gray-200 text-gray-700'
                                        }`}
                                    >
                                        Selected Products ({selectedProductIds.size})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, applyTo: 'category' })}
                                        className={`rounded-xl border p-3 text-xs font-bold transition text-left ${
                                            bulkPriceConfig.applyTo === 'category'
                                                ? 'border-orange-500 bg-orange-50 text-orange-900'
                                                : 'border-gray-200 text-gray-700'
                                        }`}
                                    >
                                        Specific Category
                                    </button>
                                </div>
                            </div>

                            {bulkPriceConfig.applyTo === 'category' && (
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Select Category</label>
                                    <select
                                        value={bulkPriceConfig.targetCategory}
                                        onChange={(e) => setBulkPriceConfig({ ...bulkPriceConfig, targetCategory: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                                    >
                                        {Array.from(new Set(products.map(p => p.category))).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">Action Type</label>
                                <select
                                    value={bulkPriceConfig.changeType}
                                    onChange={(e) => setBulkPriceConfig({ ...bulkPriceConfig, changeType: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                                >
                                    <option value="percentage_increase">Percentage Increase (+%)</option>
                                    <option value="percentage_decrease">Percentage Decrease (-%)</option>
                                    <option value="fixed_increase">Fixed Amount Increase (+₹)</option>
                                    <option value="fixed_decrease">Fixed Amount Decrease (-₹)</option>
                                    <option value="set_discount">Apply Flat Promotional Discount (%)</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">
                                    Adjustment Value ({bulkPriceConfig.changeType.includes('fixed') ? '₹' : '%'})
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={bulkPriceConfig.changeType.includes('percentage') || bulkPriceConfig.changeType === 'set_discount' ? 95 : 100000}
                                    value={bulkPriceConfig.value}
                                    onChange={(e) => setBulkPriceConfig({ ...bulkPriceConfig, value: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-black text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkPricingModal(false)}
                                    className="rounded-xl border border-gray-200 px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={actionLoading || (bulkPriceConfig.applyTo === 'selected' && selectedProductIds.size === 0)}
                                    onClick={handleExecuteBulkPricing}
                                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    <span>Execute Bulk Update</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProductsTab;
