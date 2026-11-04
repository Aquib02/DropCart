import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Shield,
    Key,
    Lock,
    Users,
    Activity,
    Plus,
    Trash2,
    Edit2,
    CheckCircle2,
    AlertCircle,
    X,
    Search,
    RefreshCw,
    Check,
    Eye,
    ShieldCheck,
    ShieldAlert,
    Clock,
    Terminal
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const ROLE_PRESETS = [
    {
        role: 'super_admin',
        title: 'Super Admin',
        description: 'Complete unrestricted access across all systems, database, and financial configuration.',
        permissions: ['manage_products', 'manage_inventory', 'manage_orders', 'manage_coupons', 'manage_campaigns', 'manage_appearance', 'manage_customers', 'manage_reviews', 'manage_staff']
    },
    {
        role: 'admin',
        title: 'Store Administrator',
        description: 'Store operations, catalog management, campaigns, and customer support.',
        permissions: ['manage_products', 'manage_inventory', 'manage_orders', 'manage_coupons', 'manage_campaigns', 'manage_appearance', 'manage_customers', 'manage_reviews']
    },
    {
        role: 'product_manager',
        title: 'Product Catalog Manager',
        description: 'Create and update products, bulk CSV imports, categories, and inventory sync.',
        permissions: ['manage_products', 'manage_inventory']
    },
    {
        role: 'inventory_manager',
        title: 'Inventory & Warehouse Manager',
        description: 'Adjust stock quantities, view runout velocity, and maintain stock valuations.',
        permissions: ['manage_inventory']
    },
    {
        role: 'order_manager',
        title: 'Order Fulfillment Lead',
        description: 'Manage order dispatch lifecycle, print shipping labels, and handle return/refund workflows.',
        permissions: ['manage_orders']
    },
    {
        role: 'marketing_manager',
        title: 'Marketing & Promotions Lead',
        description: 'Manage advertisement banners, hero carousels, coupons, popups, and discounts.',
        permissions: ['manage_campaigns', 'manage_coupons', 'manage_appearance']
    },
    {
        role: 'customer_support',
        title: 'Customer Support Agent',
        description: 'Manage customer accounts, review moderation, and customer communications.',
        permissions: ['manage_customers', 'manage_reviews']
    }
];

const AVAILABLE_PERMISSIONS = [
    { id: 'manage_products', label: 'Products & Catalog' },
    { id: 'manage_inventory', label: 'Inventory & Stock' },
    { id: 'manage_orders', label: 'Orders & Dispatches' },
    { id: 'manage_coupons', label: 'Coupons & Discounts' },
    { id: 'manage_campaigns', label: 'Ads & Banners' },
    { id: 'manage_appearance', label: 'Appearance & Themes' },
    { id: 'manage_customers', label: 'Customers & CRM' },
    { id: 'manage_reviews', label: 'Customer Reviews' },
    { id: 'manage_staff', label: 'Staff & Security' },
];

const AdminSecurityTab = ({ userToken, currentUser }) => {
    const [subTab, setSubTab] = useState('staff'); // 'staff' | 'audit_logs' | 'two_factor'
    const [staffList, setStaffList] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    // Modals
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // New/Edit Staff Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        permissions: ['manage_orders']
    });

    // 2FA state
    const [twoFactorActive, setTwoFactorActive] = useState(false);

    // Fetch staff and audit logs
    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffRes, auditRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/users/staff`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                }),
                axios.get(`${API_BASE_URL}/api/users/audit-logs`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                })
            ]);

            setStaffList(staffRes.data || []);
            setAuditLogs(auditRes.data || []);
        } catch (err) {
            console.error('Error fetching security data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Toggle 2FA
    const handleToggle2FA = async () => {
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/users/toggle-2fa`,
                {},
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            if (res.data.success) {
                setTwoFactorActive(res.data.twoFactorEnabled);
                setStatusMessage({ type: 'success', text: res.data.message });
                fetchData();
                setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Error toggling 2FA' });
        }
    };

    // Open Add Modal
    const handleOpenAddModal = () => {
        setEditingStaff(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'product_manager',
            permissions: ['manage_products', 'manage_inventory']
        });
        setShowStaffModal(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (staff) => {
        setEditingStaff(staff);
        setFormData({
            name: staff.name,
            email: staff.email,
            password: '',
            role: staff.role,
            permissions: staff.permissions || []
        });
        setShowStaffModal(true);
    };

    // Select Role Preset
    const handleSelectRolePreset = (presetRole) => {
        const preset = ROLE_PRESETS.find(p => p.role === presetRole);
        if (preset) {
            setFormData(prev => ({
                ...prev,
                role: preset.role,
                permissions: [...preset.permissions]
            }));
        }
    };

    // Toggle Permission Checkbox
    const handleTogglePermission = (permId) => {
        setFormData(prev => {
            const current = new Set(prev.permissions);
            if (current.has(permId)) current.delete(permId);
            else current.add(permId);
            return { ...prev, permissions: Array.from(current) };
        });
    };

    // Save Staff Form
    const handleSaveStaff = async (e) => {
        e.preventDefault();
        try {
            if (editingStaff) {
                await axios.put(
                    `${API_BASE_URL}/api/users/staff/${editingStaff._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${userToken}` } }
                );
                setStatusMessage({ type: 'success', text: `Staff account "${formData.name}" updated successfully.` });
            } else {
                await axios.post(
                    `${API_BASE_URL}/api/users/staff`,
                    formData,
                    { headers: { Authorization: `Bearer ${userToken}` } }
                );
                setStatusMessage({ type: 'success', text: `New staff member "${formData.name}" onboarded successfully.` });
            }
            setShowStaffModal(false);
            fetchData();
            setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save staff record' });
        }
    };

    // Delete Staff
    const handleDeleteStaff = async (id, name) => {
        if (!window.confirm(`Are you sure you want to revoke access for ${name}?`)) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/users/staff/${id}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setStatusMessage({ type: 'success', text: `Access revoked for ${name}.` });
            fetchData();
            setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to revoke staff access' });
        }
    };

    // Filter staff
    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-black text-gray-900">
                        Admin Security, Staff RBAC & Audit Trails
                    </h2>
                    <p className="text-xs text-gray-500">
                        Granular role-based permissions, two-factor authentication, and tamper-proof administrative audit logs
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh Logs</span>
                    </button>

                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2 text-xs font-black text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Staff Member</span>
                    </button>
                </div>
            </div>

            {/* Notification alert */}
            {statusMessage.text && (
                <div
                    className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold ${
                        statusMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                >
                    {statusMessage.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Sub-tab Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2">
                <button
                    onClick={() => setSubTab('staff')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        subTab === 'staff'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <Users className="h-3.5 w-3.5" />
                    <span>Staff Members & Roles ({staffList.length})</span>
                </button>

                <button
                    onClick={() => setSubTab('audit_logs')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        subTab === 'audit_logs'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Administrative Audit Trails ({auditLogs.length})</span>
                </button>

                <button
                    onClick={() => setSubTab('two_factor')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        subTab === 'two_factor'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <Key className="h-3.5 w-3.5" />
                    <span>2FA & Session Security</span>
                </button>
            </div>

            {/* TAB 1: STAFF & RBAC TABLE */}
            {subTab === 'staff' && (
                <div className="space-y-4">
                    {/* Search bar */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, email, or role..."
                                className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-gray-900 outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="p-4 sm:px-6">Staff Member</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Assigned Role</th>
                                    <th className="p-4">Granted Permissions</th>
                                    <th className="p-4 text-right sm:px-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStaff.map((s) => (
                                    <tr key={s._id} className="transition hover:bg-gray-50/50">
                                        <td className="p-4 font-bold text-gray-900 sm:px-6">
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-xs font-bold text-orange-400">
                                                    {s.name.charAt(0).toUpperCase()}
                                                </span>
                                                <div>
                                                    <p>{s.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-normal">ID: #{s._id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4 text-gray-600 font-mono text-[11px]">{s.email}</td>

                                        <td className="p-4">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                                    s.role.includes('admin')
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : s.role.includes('product')
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : s.role.includes('order')
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {s.role.replace('_', ' ')}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {s.role.includes('admin') || s.isAdmin ? (
                                                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                                                        Full Access (Super Admin)
                                                    </span>
                                                ) : (s.permissions || []).length > 0 ? (
                                                    s.permissions.map(perm => (
                                                        <span
                                                            key={perm}
                                                            className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700"
                                                        >
                                                            {perm.replace('manage_', '')}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">No active permissions</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-4 text-right sm:px-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleOpenEditModal(s)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                                                    title="Edit Permissions"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>

                                                {s._id !== currentUser?._id && (
                                                    <button
                                                        onClick={() => handleDeleteStaff(s._id, s.name)}
                                                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                                                        title="Revoke Access"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: AUDIT LOGS */}
            {subTab === 'audit_logs' && (
                <div className="space-y-4">
                    <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="p-4 sm:px-6">Timestamp</th>
                                    <th className="p-4">Admin / Operator</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Resource</th>
                                    <th className="p-4">Activity Details</th>
                                    <th className="p-4 text-right sm:px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                                {auditLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-xs text-gray-400 font-sans">
                                            No administrative audit logs recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    auditLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50/50 transition">
                                            <td className="p-4 text-gray-500 sm:px-6 font-sans">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4 font-bold text-gray-900 font-sans">
                                                {log.userName}
                                                <span className="block text-[10px] text-gray-400 font-normal">
                                                    {log.userRole}
                                                </span>
                                            </td>
                                            <td className="p-4 font-black text-purple-700">
                                                {log.action}
                                            </td>
                                            <td className="p-4 text-gray-700 font-sans">
                                                {log.resource}
                                            </td>
                                            <td className="p-4 text-gray-600 font-sans max-w-xs truncate">
                                                {log.details || 'Operational update executed'}
                                            </td>
                                            <td className="p-4 text-right sm:px-6">
                                                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-700 font-sans">
                                                    {log.status || 'Success'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: 2FA & SECURITY SETTINGS */}
            {subTab === 'two_factor' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <ShieldCheck className="h-6 w-6 text-purple-600" />
                            <div>
                                <h3 className="text-sm font-black text-gray-900">
                                    Two-Factor Authentication (2FA)
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Require an extra verification factor when accessing the administrative portal
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between rounded-2xl bg-gray-50 p-4 border border-gray-200/60">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Enforce 2FA on Admin Account</p>
                                <p className="text-[11px] text-gray-500">Status: {twoFactorActive ? 'Active & Enforced' : 'Optional / Disabled'}</p>
                            </div>
                            <button
                                onClick={handleToggle2FA}
                                className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
                                    twoFactorActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-800 hover:bg-gray-900'
                                }`}
                            >
                                {twoFactorActive ? '2FA Enabled ✓' : 'Enable 2FA'}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <Clock className="h-6 w-6 text-orange-500" />
                            <div>
                                <h3 className="text-sm font-black text-gray-900">
                                    Session Management & Security Policy
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Automatic session invalidation and brute-force protection
                                </p>
                            </div>
                        </div>

                        <ul className="mt-4 space-y-3 text-xs text-gray-600">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span>JWT Bearer signature with HS256 encryption</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span>Express Rate Limiter: 1000 requests per 15-minute window</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span>Automatic session timeout after 30 days inactivity</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Modal: Add/Edit Staff */}
            {showStaffModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">
                                    {editingStaff ? 'Update Staff Permissions' : 'Onboard New Staff Member'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Select an enterprise role preset or assign granular capability flags
                                </p>
                            </div>
                            <button
                                onClick={() => setShowStaffModal(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveStaff} className="mt-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={!!editingStaff}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {!editingStaff && (
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">Initial Password *</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min 6 characters"
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                            )}

                            {/* Preset Role Picker */}
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Enterprise Role Preset</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => handleSelectRolePreset(e.target.value)}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                >
                                    {ROLE_PRESETS.map(p => (
                                        <option key={p.role} value={p.role}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Granular Permission Checkboxes */}
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Granular Permission Matrix</label>
                                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {AVAILABLE_PERMISSIONS.map(p => (
                                        <label
                                            key={p.id}
                                            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-[11px] font-bold transition ${
                                                formData.permissions.includes(p.id)
                                                    ? 'border-orange-500 bg-orange-50/40 text-orange-950'
                                                    : 'border-gray-200 bg-gray-50/40 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(p.id)}
                                                onChange={() => handleTogglePermission(p.id)}
                                                className="rounded text-orange-600"
                                            />
                                            <span>{p.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowStaffModal(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-orange-500 px-6 py-2 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
                                >
                                    {editingStaff ? 'Update Permissions' : 'Create Staff User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSecurityTab;
