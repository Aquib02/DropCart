import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Layout,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    ArrowUp,
    ArrowDown,
    Save,
    Send,
    History,
    GitCompare,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Monitor,
    Tablet,
    Smartphone,
    X,
    RotateCcw,
    Calendar,
    Layers,
    Tag,
    ShoppingBag,
    Image as ImageIcon,
    Sliders,
    Search,
    Copy,
    Check
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const SECTION_TYPE_PRESETS = [
    {
        type: 'product_grid',
        label: 'Product Showcase Grid',
        desc: 'Displays catalog products in a responsive grid filtered by category or custom selections.',
        defaultTitle: 'Trending Collection',
        defaultSubtitle: 'Handpicked bestsellers and trending festive favorites',
        defaultCategory: 'All',
        icon: ShoppingBag,
        color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
        type: 'hero_slider',
        label: 'Hero Campaign Showcase',
        desc: 'Main interactive hero banner showcase with promotional slides and CTAs.',
        defaultTitle: 'Homepage Hero Showcase',
        defaultSubtitle: 'Featured campaign highlights and launch specials',
        defaultCategory: 'All',
        icon: Layers,
        color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
        type: 'category_bar',
        label: 'Category Quick-Nav Bar',
        desc: 'Horizontal scrollable pills for fast shopping category navigation.',
        defaultTitle: 'Shop By Category',
        defaultSubtitle: 'Explore all top categories',
        defaultCategory: 'All',
        icon: Tag,
        color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
        type: 'promotional_banner',
        label: 'Promotional Campaign Strip',
        desc: 'Multi-column promotional banner cards for flash deals and seasonal events.',
        defaultTitle: 'Seasonal Deals & Flash Offers',
        defaultSubtitle: 'Exclusive brand partnerships and vouchers',
        defaultCategory: 'All',
        icon: ImageIcon,
        color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
        type: 'assurance_bar',
        label: 'Trust & Enterprise Assurance',
        desc: 'Trust badges highlighting genuine products, 7-day returns, and free delivery.',
        defaultTitle: 'DropCart Enterprise Assurance',
        defaultSubtitle: '100% Genuine, 7-Day Replacement, Free Express Delivery & 24/7 Priority Support',
        defaultCategory: 'All',
        icon: Sliders,
        color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    }
];

const BG_PRESETS = [
    { label: 'Clean White', value: '#ffffff', textColor: 'text-gray-900' },
    { label: 'Cool Slate', value: '#f8fafc', textColor: 'text-gray-900' },
    { label: 'Soft Emerald', value: '#ecfdf5', textColor: 'text-emerald-950' },
    { label: 'Soft Amber', value: '#fffbeb', textColor: 'text-amber-950' },
    { label: 'Soft Rose', value: '#fff1f2', textColor: 'text-rose-950' },
    { label: 'Soft Indigo', value: '#eef2ff', textColor: 'text-indigo-950' },
    { label: 'Midnight Dark', value: '#0f172a', textColor: 'text-white' }
];

const AdminVisualEditorTab = ({ userToken }) => {
    // Draft State
    const [draftLayout, setDraftLayout] = useState(null);
    const [publishedLayout, setPublishedLayout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [statusBanner, setStatusBanner] = useState({ type: '', message: '' });

    // Modals
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [versionsList, setVersionsList] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [compareData, setCompareData] = useState(null);

    // Product Picker Modal
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [pickerSectionIndex, setPickerSectionIndex] = useState(null);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [pickerCategory, setPickerCategory] = useState('All');

    const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

    // Initial Load
    const fetchLayouts = async () => {
        setLoading(true);
        try {
            const [draftRes, pubRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/homepage-layout/draft`, authConfig),
                axios.get(`${API_BASE_URL}/api/homepage-layout/published`)
            ]);
            setDraftLayout(draftRes.data);
            setPublishedLayout(pubRes.data);
        } catch (error) {
            console.error('Error fetching layout data:', error);
            setStatusBanner({
                type: 'error',
                message: 'Failed to load homepage layouts. Please refresh.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLayouts();
    }, []);

    // Save Draft
    const handleSaveDraft = async () => {
        if (!draftLayout) return;
        setActionLoading(true);
        setStatusBanner({ type: '', message: '' });
        try {
            const res = await axios.put(
                `${API_BASE_URL}/api/homepage-layout/draft`,
                {
                    versionName: draftLayout.versionName,
                    sections: draftLayout.sections,
                    scheduledAt: draftLayout.scheduledAt,
                    notes: draftLayout.notes
                },
                authConfig
            );
            if (res.data.success) {
                setDraftLayout(res.data.draft);
                setStatusBanner({
                    type: 'success',
                    message: 'Draft layout saved successfully! Ready for live preview or publishing.'
                });
            }
        } catch (error) {
            setStatusBanner({
                type: 'error',
                message: error.response?.data?.message || 'Failed to save draft layout'
            });
        } finally {
            setActionLoading(false);
            setTimeout(() => setStatusBanner({ type: '', message: '' }), 5000);
        }
    };

    // Publish Draft
    const handlePublish = async () => {
        if (!window.confirm('Are you sure you want to publish this layout to the live customer storefront?')) {
            return;
        }
        setActionLoading(true);
        setStatusBanner({ type: '', message: '' });
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/homepage-layout/publish`,
                {
                    versionName: draftLayout.versionName,
                    notes: draftLayout.notes
                },
                authConfig
            );
            if (res.data.success) {
                setPublishedLayout(res.data.published);
                setStatusBanner({
                    type: 'success',
                    message: `Homepage Layout published live! All online visitors updated immediately via Socket.IO.`
                });
                await fetchLayouts();
            }
        } catch (error) {
            setStatusBanner({
                type: 'error',
                message: error.response?.data?.message || 'Failed to publish layout'
            });
        } finally {
            setActionLoading(false);
            setTimeout(() => setStatusBanner({ type: '', message: '' }), 6000);
        }
    };

    // Version History
    const handleOpenHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/homepage-layout/versions`, authConfig);
            setVersionsList(res.data);
            setShowHistoryModal(true);
        } catch (err) {
            alert('Failed to load version history');
        }
    };

    // Rollback
    const handleRollback = async (versionId, versionNumber) => {
        if (!window.confirm(`Roll back the live storefront to version #${versionNumber}?`)) {
            return;
        }
        setActionLoading(true);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/homepage-layout/rollback/${versionId}`,
                {},
                authConfig
            );
            if (res.data.success) {
                setShowHistoryModal(false);
                setStatusBanner({
                    type: 'success',
                    message: res.data.message
                });
                await fetchLayouts();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Rollback failed');
        } finally {
            setActionLoading(false);
            setTimeout(() => setStatusBanner({ type: '', message: '' }), 6000);
        }
    };

    // Compare Draft vs Published
    const handleOpenCompare = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/homepage-layout/compare`, authConfig);
            setCompareData(res.data);
            setShowCompareModal(true);
        } catch (err) {
            alert('Failed to load compare data');
        }
    };

    // Section Mutations
    const handleMoveSection = (index, direction) => {
        if (!draftLayout || !draftLayout.sections) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= draftLayout.sections.length) return;

        const updated = [...draftLayout.sections];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);

        const reordered = updated.map((sec, idx) => ({ ...sec, order: idx }));
        setDraftLayout({ ...draftLayout, sections: reordered });
    };

    const handleToggleVisibility = (index) => {
        const updated = [...draftLayout.sections];
        updated[index].isVisible = !updated[index].isVisible;
        setDraftLayout({ ...draftLayout, sections: updated });
    };

    const handleDeleteSection = (index) => {
        const secTitle = draftLayout.sections[index]?.title || 'this section';
        if (!window.confirm(`Delete "${secTitle}" from draft layout?`)) return;

        const updated = draftLayout.sections.filter((_, idx) => idx !== index);
        const reordered = updated.map((sec, idx) => ({ ...sec, order: idx }));
        setDraftLayout({ ...draftLayout, sections: reordered });
    };

    const handleDuplicateSection = (index) => {
        const target = draftLayout.sections[index];
        const copy = {
            ...target,
            id: 'sec_' + Math.random().toString(36).substring(2, 9),
            title: `${target.title} (Copy)`,
            order: index + 1
        };
        const updated = [...draftLayout.sections];
        updated.splice(index + 1, 0, copy);
        const reordered = updated.map((sec, idx) => ({ ...sec, order: idx }));
        setDraftLayout({ ...draftLayout, sections: reordered });
    };

    const handleUpdateSectionField = (index, field, value) => {
        const updated = [...draftLayout.sections];
        updated[index] = { ...updated[index], [field]: value };
        setDraftLayout({ ...draftLayout, sections: updated });
    };

    // Add Section Modal
    const handleAddSectionFromPreset = (preset) => {
        const newSec = {
            id: 'sec_' + Math.random().toString(36).substring(2, 9),
            type: preset.type,
            title: preset.defaultTitle,
            subtitle: preset.defaultSubtitle,
            badgeText: preset.type === 'product_grid' ? 'FEATURED' : '',
            category: preset.defaultCategory,
            selectedProductIds: [],
            limit: 4,
            order: (draftLayout?.sections?.length || 0),
            isVisible: true,
            backgroundColor: '#ffffff',
            ctaText: preset.type === 'product_grid' ? 'Explore Collection' : '',
            ctaLink: '/shop',
            layoutStyle: 'grid_4'
        };

        const updated = [...(draftLayout?.sections || []), newSec];
        setDraftLayout({ ...draftLayout, sections: updated });
        setShowAddSectionModal(false);
    };

    // Product Picker Modal
    const handleOpenProductPicker = async (sectionIndex) => {
        setPickerSectionIndex(sectionIndex);
        setShowProductPicker(true);
        if (availableProducts.length === 0) {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/products`);
                setAvailableProducts(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Failed to load products for picker:', err);
            }
        }
    };

    const handleToggleProductSelection = (productId) => {
        if (pickerSectionIndex === null || !draftLayout?.sections) return;
        const currentSec = draftLayout.sections[pickerSectionIndex];
        const currentIds = (currentSec.selectedProductIds || []).map(p => typeof p === 'object' ? p._id : p);

        let newIds;
        if (currentIds.includes(productId)) {
            newIds = currentIds.filter(id => id !== productId);
        } else {
            newIds = [...currentIds, productId];
        }

        const updated = [...draftLayout.sections];
        updated[pickerSectionIndex] = { ...currentSec, selectedProductIds: newIds };
        setDraftLayout({ ...draftLayout, sections: updated });
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <p className="text-xs font-bold text-gray-500">Loading Homepage Visual Editor...</p>
                </div>
            </div>
        );
    }

    const sections = draftLayout?.sections || [];

    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 shrink-0">
                        <Layout className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black tracking-tight text-gray-900">Homepage Visual Editor</h2>
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                                Working Draft
                            </span>
                            {publishedLayout && (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                                    Live v{publishedLayout.versionNumber}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Add, reorder, customize, and publish homepage sections with live preview & version history
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleOpenCompare}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                        title="Compare Draft vs Live Published"
                    >
                        <GitCompare className="h-3.5 w-3.5 text-gray-500" />
                        <span>Compare</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenHistory}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                        title="View Version History & Rollback"
                    >
                        <History className="h-3.5 w-3.5 text-gray-500" />
                        <span>History & Rollback</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 shadow-2xs"
                    >
                        <Monitor className="h-3.5 w-3.5 text-blue-600" />
                        <span>Live Preview</span>
                    </button>

                    <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleSaveDraft}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50 shadow-2xs"
                    >
                        {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        <span>Save Draft</span>
                    </button>

                    <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handlePublish}
                        className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                        {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span>Publish Live Layout</span>
                    </button>
                </div>
            </div>

            {/* Status Feedback Banner */}
            {statusBanner.message && (
                <div
                    className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-bold animate-in fade-in ${
                        statusBanner.type === 'success'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border border-red-200 bg-red-50 text-red-800'
                    }`}
                >
                    {statusBanner.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <span>{statusBanner.message}</span>
                </div>
            )}

            {/* Layout Meta Card: Name, Scheduled Date & Notes */}
            <div className="grid grid-cols-1 gap-4 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xs sm:grid-cols-3">
                <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Layout Version Name
                    </label>
                    <input
                        type="text"
                        value={draftLayout?.versionName || ''}
                        onChange={(e) => setDraftLayout({ ...draftLayout, versionName: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                        placeholder="e.g. Diwali Mega Sale 2026 Layout"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Scheduled Launch (Optional)
                    </label>
                    <div className="relative">
                        <input
                            type="datetime-local"
                            value={draftLayout?.scheduledAt ? new Date(draftLayout.scheduledAt).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setDraftLayout({ ...draftLayout, scheduledAt: e.target.value ? new Date(e.target.value) : null })}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-medium text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Release Notes
                    </label>
                    <input
                        type="text"
                        value={draftLayout?.notes || ''}
                        onChange={(e) => setDraftLayout({ ...draftLayout, notes: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                        placeholder="e.g. Reordered tech above winter specials and picked flagship deals"
                    />
                </div>
            </div>

            {/* Sections Canvas List Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-800">
                        Homepage Canvas Sections ({sections.length})
                    </h3>
                    <p className="text-xs text-gray-500">
                        Sections render top-to-bottom on the customer storefront. Use arrows to change display order.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowAddSectionModal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-black shadow-xs"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Section</span>
                </button>
            </div>

            {/* Sections Canvas List */}
            <div className="space-y-4">
                {sections.map((section, index) => {
                    const preset = SECTION_TYPE_PRESETS.find(p => p.type === section.type) || SECTION_TYPE_PRESETS[0];
                    const IconComp = preset.icon;
                    const selectedCount = (section.selectedProductIds || []).length;

                    return (
                        <div
                            key={section.id || index}
                            className={`rounded-3xl border transition-all ${
                                section.isVisible
                                    ? 'border-gray-200/80 bg-white shadow-xs'
                                    : 'border-dashed border-gray-300 bg-gray-50/70 opacity-75'
                            } p-5`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-xs font-black text-gray-700">
                                        #{index + 1}
                                    </div>
                                    <span className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${preset.color}`}>
                                        <IconComp className="h-3 w-3" />
                                        {preset.label}
                                    </span>
                                    <span className="text-xs font-black text-gray-800">
                                        {section.title}
                                    </span>
                                    {!section.isVisible && (
                                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                            Hidden from Storefront
                                        </span>
                                    )}
                                </div>

                                {/* Reorder, Visibility & Action Controls */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => handleMoveSection(index, -1)}
                                        className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                                        title="Move Up"
                                    >
                                        <ArrowUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === sections.length - 1}
                                        onClick={() => handleMoveSection(index, 1)}
                                        className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                                        title="Move Down"
                                    >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleVisibility(index)}
                                        className={`rounded-lg border p-1.5 transition ${
                                            section.isVisible
                                                ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                                                : 'border-amber-200 bg-amber-50 text-amber-700'
                                        }`}
                                        title={section.isVisible ? 'Hide Section' : 'Show Section'}
                                    >
                                        {section.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDuplicateSection(index)}
                                        className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 transition hover:bg-gray-100"
                                        title="Duplicate Section"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSection(index)}
                                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100"
                                        title="Delete Section"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Section Configuration Fields */}
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                                        Section Heading Title
                                    </label>
                                    <input
                                        type="text"
                                        value={section.title}
                                        onChange={(e) => handleUpdateSectionField(index, 'title', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                                        Subheading / Description
                                    </label>
                                    <input
                                        type="text"
                                        value={section.subtitle || ''}
                                        onChange={(e) => handleUpdateSectionField(index, 'subtitle', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="Brief promotional description"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                                        Badge Text (e.g. FESTIVE DEAL)
                                    </label>
                                    <input
                                        type="text"
                                        value={section.badgeText || ''}
                                        onChange={(e) => handleUpdateSectionField(index, 'badgeText', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                        placeholder="e.g. LIMITED OFFER"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                                        Target Category
                                    </label>
                                    <select
                                        value={section.category || 'All'}
                                        onChange={(e) => handleUpdateSectionField(index, 'category', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-orange-500 focus:bg-white"
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="Mobiles">Mobiles & Flagships</option>
                                        <option value="Electronics">Electronics & Laptops</option>
                                        <option value="Fashion">Fashion & Footwear</option>
                                        <option value="Home">Home & Living</option>
                                        <option value="Appliances">Kitchen & Appliances</option>
                                        <option value="Beauty">Beauty & Personal Care</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Background, Limit, CTA, and Custom Product Picker */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-3">
                                {/* Background Selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Background:</span>
                                    <div className="flex items-center gap-1.5">
                                        {BG_PRESETS.map((bg) => (
                                            <button
                                                key={bg.value}
                                                type="button"
                                                onClick={() => handleUpdateSectionField(index, 'backgroundColor', bg.value)}
                                                className={`h-5 w-5 rounded-full border transition ${
                                                    section.backgroundColor === bg.value
                                                        ? 'ring-2 ring-orange-500 ring-offset-1 scale-110'
                                                        : 'border-gray-300'
                                                }`}
                                                style={{ backgroundColor: bg.value }}
                                                title={bg.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Products Picker (for product_grid) */}
                                {section.type === 'product_grid' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenProductPicker(index)}
                                            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                                        >
                                            <ShoppingBag className="h-3 w-3 text-orange-500" />
                                            <span>
                                                {selectedCount > 0
                                                    ? `${selectedCount} Custom Product${selectedCount === 1 ? '' : 's'} Selected`
                                                    : 'Pick Specific Products (Auto Category)'}
                                            </span>
                                        </button>
                                        {selectedCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateSectionField(index, 'selectedProductIds', [])}
                                                className="text-[10px] font-bold text-red-500 hover:underline"
                                            >
                                                Reset to Auto
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* CTA Link & Text */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={section.ctaText || ''}
                                        onChange={(e) => handleUpdateSectionField(index, 'ctaText', e.target.value)}
                                        placeholder="Button Text"
                                        className="w-28 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-800 outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={section.ctaLink || ''}
                                        onChange={(e) => handleUpdateSectionField(index, 'ctaLink', e.target.value)}
                                        placeholder="Link (/shop)"
                                        className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-800 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL 1: ADD NEW SECTION */}
            {showAddSectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">Add New Homepage Section</h3>
                                <p className="text-xs text-gray-500">Choose a section component preset to add to your layout</p>
                            </div>
                            <button
                                onClick={() => setShowAddSectionModal(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            {SECTION_TYPE_PRESETS.map((preset) => {
                                const IconComp = preset.icon;
                                return (
                                    <button
                                        key={preset.type}
                                        type="button"
                                        onClick={() => handleAddSectionFromPreset(preset)}
                                        className="flex w-full items-start gap-4 rounded-2xl border border-gray-200 p-4 text-left transition hover:border-orange-500 hover:bg-orange-50/30 group"
                                    >
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${preset.color}`}>
                                            <IconComp className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600">
                                                {preset.label}
                                            </h4>
                                            <p className="mt-0.5 text-xs text-gray-500">{preset.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: LIVE PREVIEW MODAL */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/90 backdrop-blur-md">
                    {/* Preview Topbar */}
                    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-3.5 text-white">
                        <div className="flex items-center gap-3">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="text-sm font-black text-white">Homepage Layout Live Preview</h3>
                            <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-black text-orange-400">
                                Draft Viewport
                            </span>
                        </div>

                        {/* Viewport Switcher */}
                        <div className="flex items-center gap-1 rounded-xl bg-gray-800 p-1">
                            <button
                                type="button"
                                onClick={() => setPreviewViewport('desktop')}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                    previewViewport === 'desktop' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Monitor className="h-3.5 w-3.5" /> Desktop
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewViewport('tablet')}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                    previewViewport === 'tablet' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Tablet className="h-3.5 w-3.5" /> Tablet
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewViewport('mobile')}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                    previewViewport === 'mobile' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Smartphone className="h-3.5 w-3.5" /> Mobile
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowPreviewModal(false)}
                            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Preview Viewport Frame */}
                    <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-gray-900/50">
                        <div
                            className={`transition-all duration-300 bg-white rounded-3xl shadow-2xl overflow-y-auto ${
                                previewViewport === 'desktop'
                                    ? 'w-full max-w-6xl'
                                    : previewViewport === 'tablet'
                                    ? 'w-[768px]'
                                    : 'w-[375px]'
                            }`}
                            style={{ minHeight: '80vh' }}
                        >
                            {/* Simulated Storefront Sections */}
                            <div className="space-y-6 p-4 sm:p-6">
                                {sections
                                    .filter(s => s.isVisible)
                                    .map((sec, idx) => (
                                        <div
                                            key={sec.id || idx}
                                            className="rounded-2xl border border-gray-200 p-5 shadow-xs"
                                            style={{ backgroundColor: sec.backgroundColor || '#ffffff' }}
                                        >
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                                <div>
                                                    {sec.badgeText && (
                                                        <span className="inline-block rounded-full bg-orange-500 px-2.5 py-0.5 text-[9px] font-black uppercase text-white mb-1">
                                                            {sec.badgeText}
                                                        </span>
                                                    )}
                                                    <h4 className="text-base font-black text-gray-900">{sec.title}</h4>
                                                    {sec.subtitle && <p className="text-xs text-gray-500">{sec.subtitle}</p>}
                                                </div>
                                                {sec.ctaText && (
                                                    <span className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700">
                                                        {sec.ctaText} →
                                                    </span>
                                                )}
                                            </div>

                                            {/* Section Preview Body */}
                                            {sec.type === 'hero_slider' && (
                                                <div className="rounded-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-8 text-white">
                                                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase">
                                                        {sec.badgeText || 'HERO SHOWCASE'}
                                                    </span>
                                                    <h3 className="mt-3 text-2xl font-black">{sec.title}</h3>
                                                    <p className="mt-1 text-xs text-gray-300">{sec.subtitle}</p>
                                                    <div className="mt-4 inline-block rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white">
                                                        {sec.ctaText || 'Shop Collection'}
                                                    </div>
                                                </div>
                                            )}

                                            {sec.type === 'category_bar' && (
                                                <div className="flex flex-wrap gap-2">
                                                    {['Mobiles', 'Laptops', 'Fashion', 'Audio', 'Home', 'Appliances'].map(cat => (
                                                        <span key={cat} className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-bold text-gray-700">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {sec.type === 'product_grid' && (
                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                    {[1, 2, 3, 4].map(num => (
                                                        <div key={num} className="rounded-xl border border-gray-100 bg-white p-3 shadow-2xs">
                                                            <div className="aspect-square w-full rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                                <ShoppingBag className="h-6 w-6" />
                                                            </div>
                                                            <div className="mt-2 space-y-1">
                                                                <div className="h-3 w-3/4 rounded bg-gray-200" />
                                                                <div className="h-3 w-1/2 rounded bg-orange-200" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {sec.type === 'promotional_banner' && (
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                    {[1, 2, 3].map(bannerIdx => (
                                                        <div key={bannerIdx} className="rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-white">
                                                            <span className="text-[10px] font-black text-amber-300 uppercase">Flash Deal</span>
                                                            <h5 className="mt-1 text-sm font-bold">Campaign Banner #{bannerIdx}</h5>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {sec.type === 'assurance_bar' && (
                                                <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold text-gray-700 sm:grid-cols-4">
                                                    <div className="rounded-lg bg-gray-50 p-2">100% Authentic</div>
                                                    <div className="rounded-lg bg-gray-50 p-2">7-Day Return</div>
                                                    <div className="rounded-lg bg-gray-50 p-2">Express Delivery</div>
                                                    <div className="rounded-lg bg-gray-50 p-2">24/7 Support</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: VERSION HISTORY & ROLLBACK */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">Homepage Layout Version History</h3>
                                <p className="text-xs text-gray-500">Restore any previous layout version with one-click rollback</p>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            {versionsList.map((ver) => (
                                <div
                                    key={ver._id}
                                    className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                                        ver.status === 'published'
                                            ? 'border-emerald-200 bg-emerald-50/50'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-gray-900 text-sm">
                                                Version #{ver.versionNumber}: {ver.versionName}
                                            </span>
                                            {ver.status === 'published' ? (
                                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 uppercase">
                                                    Currently Live
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600 uppercase">
                                                    Archived
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Published: {ver.publishedAt ? new Date(ver.publishedAt).toLocaleString() : 'N/A'} • {ver.sectionCount} sections • By {ver.createdBy}
                                        </p>
                                        {ver.notes && <p className="mt-0.5 text-[11px] text-gray-400 italic">{ver.notes}</p>}
                                    </div>

                                    {ver.status !== 'published' && (
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => handleRollback(ver._id, ver.versionNumber)}
                                            className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-100 shadow-2xs"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            <span>Rollback to v{ver.versionNumber}</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: COMPARE DRAFT VS PUBLISHED */}
            {showCompareModal && compareData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">Compare: Live Storefront vs. Draft Layout</h3>
                                <p className="text-xs text-gray-500">Inspect differences before pushing to production</p>
                            </div>
                            <button
                                onClick={() => setShowCompareModal(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                            {/* Live Published Column */}
                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                    <span className="text-xs font-black uppercase text-emerald-700">
                                        Live Published (v{compareData.published?.versionNumber || 1})
                                    </span>
                                    <span className="text-[11px] text-gray-500">
                                        {compareData.published?.sections?.length || 0} sections
                                    </span>
                                </div>
                                {(compareData.published?.sections || []).map((sec, idx) => (
                                    <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-800">#{idx + 1} {sec.title}</span>
                                            <span className="text-[10px] text-gray-400">{sec.type}</span>
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-gray-500">{sec.category} • {sec.isVisible ? 'Visible' : 'Hidden'}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Working Draft Column */}
                            <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
                                <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                                    <span className="text-xs font-black uppercase text-orange-700">
                                        Working Draft ({compareData.draft?.versionName || 'Draft'})
                                    </span>
                                    <span className="text-[11px] text-gray-500">
                                        {compareData.draft?.sections?.length || 0} sections
                                    </span>
                                </div>
                                {(compareData.draft?.sections || []).map((sec, idx) => (
                                    <div key={idx} className="rounded-xl border border-orange-200 bg-white p-3 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-800">#{idx + 1} {sec.title}</span>
                                            <span className="text-[10px] text-orange-600 font-bold">{sec.type}</span>
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-gray-500">{sec.category} • {sec.isVisible ? 'Visible' : 'Hidden'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 5: PRODUCT PICKER FOR CUSTOM PRODUCT GRIDS */}
            {showProductPicker && pickerSectionIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">
                                    Select Featured Products for "{draftLayout.sections[pickerSectionIndex]?.title}"
                                </h3>
                                <p className="text-xs text-gray-500">Pick specific catalog items to feature in this section</p>
                            </div>
                            <button
                                onClick={() => setShowProductPicker(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search & Category Filter */}
                        <div className="mt-4 flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="Search products by name or brand..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>
                            <select
                                value={pickerCategory}
                                onChange={(e) => setPickerCategory(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 outline-none"
                            >
                                <option value="All">All Categories</option>
                                <option value="Mobiles">Mobiles</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Home">Home</option>
                            </select>
                        </div>

                        {/* Product Grid Selection */}
                        <div className="mt-4 grid grid-cols-1 gap-2.5 max-h-[50vh] overflow-y-auto pr-1 sm:grid-cols-2">
                            {availableProducts
                                .filter(p => {
                                    const matchCat = pickerCategory === 'All' || p.category === pickerCategory;
                                    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.brand || '').toLowerCase().includes(productSearch.toLowerCase());
                                    return matchCat && matchSearch;
                                })
                                .map((product) => {
                                    const currentSec = draftLayout.sections[pickerSectionIndex];
                                    const currentIds = (currentSec.selectedProductIds || []).map(p => typeof p === 'object' ? p._id : p);
                                    const isSelected = currentIds.includes(product._id);

                                    return (
                                        <div
                                            key={product._id}
                                            onClick={() => handleToggleProductSelection(product._id)}
                                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                                                isSelected
                                                    ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <img
                                                src={product.image || product.images?.[0] || 'https://via.placeholder.com/80'}
                                                alt={product.name}
                                                className="h-12 w-12 rounded-xl object-cover shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h5 className="truncate text-xs font-bold text-gray-900">{product.name}</h5>
                                                <p className="text-[11px] font-black text-orange-600">₹{Number(product.price).toLocaleString('en-IN')}</p>
                                                <span className="text-[10px] text-gray-400">{product.category}</span>
                                            </div>
                                            <div className={`flex h-5 w-5 items-center justify-center rounded-md border shrink-0 ${
                                                isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 bg-white'
                                            }`}>
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                            <span className="text-xs text-gray-500">
                                {(draftLayout.sections[pickerSectionIndex]?.selectedProductIds || []).length} products selected
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowProductPicker(false)}
                                className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white hover:bg-orange-600 transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVisualEditorTab;
