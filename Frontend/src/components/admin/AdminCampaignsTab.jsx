import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Sparkles,
    Plus,
    Trash2,
    Edit2,
    Eye,
    TrendingUp,
    Smartphone,
    Monitor,
    Calendar,
    ArrowUp,
    ArrowDown,
    GripVertical,
    CheckCircle2,
    XCircle,
    Layers,
    Sliders,
    MessageSquare,
    Bell,
    Percent,
    ExternalLink,
    AlertCircle,
    X,
    Image,
    MousePointerClick,
    BarChart2,
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminCampaignsTab = ({ userToken }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('all'); // 'all' | 'hero_slider' | 'secondary_banner' | 'category_banner' | 'popup' | 'announcement_bar'
    const [previewCampaign, setPreviewCampaign] = useState(null);
    const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'

    // Form Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState('');

    const initialFormData = {
        title: '',
        subtitle: '',
        badge: 'SPECIAL OFFER',
        type: 'hero_slider',
        desktopImage: '',
        mobileImage: '',
        priceText: '',
        offerText: '',
        ctaText: 'Shop Now',
        ctaLink: '/shop',
        bgGradient: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e293b 100%)',
        category: '',
        targetAudience: 'all',
        targetDevice: 'all',
        priority: 5,
        isActive: true,
        startDate: '',
        endDate: '',
        abTest: {
            isEnabled: false,
            variantB: {
                title: '',
                desktopImage: '',
                ctaText: 'Explore More',
                ctaLink: '/shop',
            },
        },
        popupConfig: {
            frequency: 'once_per_session',
            delaySeconds: 2,
        },
    };

    const [formData, setFormData] = useState(initialFormData);

    const config = { headers: { Authorization: `Bearer ${userToken}` } };

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_BASE_URL}/api/campaigns/admin`, config);
            setCampaigns(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load campaigns:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [userToken]);

    const handleOpenCreateModal = (type = 'hero_slider') => {
        setEditingCampaign(null);
        setFormData({ ...initialFormData, type });
        setFormMessage('');
        setShowModal(true);
    };

    const handleOpenEditModal = (c) => {
        setEditingCampaign(c);
        setFormData({
            title: c.title || '',
            subtitle: c.subtitle || '',
            badge: c.badge || 'SPECIAL OFFER',
            type: c.type || 'hero_slider',
            desktopImage: c.desktopImage || '',
            mobileImage: c.mobileImage || '',
            priceText: c.priceText || '',
            offerText: c.offerText || '',
            ctaText: c.ctaText || 'Shop Now',
            ctaLink: c.ctaLink || '/shop',
            bgGradient: c.bgGradient || 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e293b 100%)',
            category: c.category || '',
            targetAudience: c.targetAudience || 'all',
            targetDevice: c.targetDevice || 'all',
            priority: c.priority || 5,
            isActive: c.isActive !== undefined ? c.isActive : true,
            startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 16) : '',
            endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 16) : '',
            abTest: {
                isEnabled: c.abTest?.isEnabled || false,
                variantB: {
                    title: c.abTest?.variantB?.title || '',
                    desktopImage: c.abTest?.variantB?.desktopImage || '',
                    ctaText: c.abTest?.variantB?.ctaText || 'Explore More',
                    ctaLink: c.abTest?.variantB?.ctaLink || '/shop',
                },
            },
            popupConfig: {
                frequency: c.popupConfig?.frequency || 'once_per_session',
                delaySeconds: c.popupConfig?.delaySeconds || 2,
            },
        });
        setFormMessage('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormMessage('');

        try {
            const payload = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate) : null,
                endDate: formData.endDate ? new Date(formData.endDate) : null,
            };

            if (editingCampaign) {
                await axios.put(`${API_BASE_URL}/api/campaigns/${editingCampaign._id}`, payload, config);
            } else {
                await axios.post(`${API_BASE_URL}/api/campaigns`, payload, config);
            }

            setShowModal(false);
            fetchCampaigns();
        } catch (err) {
            setFormMessage(err.response?.data?.message || 'Error saving campaign');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (id) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/campaigns/${id}/toggle`, {}, config);
            setCampaigns((prev) =>
                prev.map((c) => (c._id === id ? { ...c, isActive: !c.isActive } : c))
            );
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to toggle status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this promotional banner?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/campaigns/${id}`, config);
            setCampaigns((prev) => prev.filter((c) => c._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete banner');
        }
    };

    // Reorder Handlers (Up / Down position swap)
    const handleMoveOrder = async (index, direction) => {
        const heroBanners = campaigns.filter((c) => c.type === 'hero_slider');
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= heroBanners.length) return;

        // Swap order
        const reordered = [...heroBanners];
        const temp = reordered[index];
        reordered[index] = reordered[targetIndex];
        reordered[targetIndex] = temp;

        // Assign numeric order index
        const payloadItems = reordered.map((item, idx) => ({
            id: item._id,
            order: idx,
        }));

        // Optimistically update local UI state
        setCampaigns((prev) => {
            const others = prev.filter((c) => c.type !== 'hero_slider');
            const updatedHeroes = reordered.map((item, idx) => ({ ...item, order: idx }));
            return [...updatedHeroes, ...others];
        });

        // Persist to MongoDB
        try {
            await axios.patch(`${API_BASE_URL}/api/campaigns/reorder`, { items: payloadItems }, config);
        } catch (err) {
            console.error('Failed to save ordering:', err);
            fetchCampaigns();
        }
    };

    const filteredCampaigns = campaigns.filter((c) => {
        if (selectedType === 'all') return true;
        return c.type === selectedType;
    });

    const heroSliders = campaigns.filter((c) => c.type === 'hero_slider');
    const popups = campaigns.filter((c) => c.type === 'popup');
    const announcements = campaigns.filter((c) => c.type === 'announcement_bar');
    const secondaryBanners = campaigns.filter((c) => c.type === 'secondary_banner');

    // Aggregate Analytics
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.analytics?.impressions || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.analytics?.clicks || 0), 0);
    const avgCTR = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0;

    return (
        <div className="space-y-6">
            {/* Header Title & Top Controls */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">
                                Advertisement & Campaign Manager
                            </h2>
                            <p className="text-xs text-gray-500">
                                Hero sliders, secondary promotional posters, popups, and A/B campaign analytics
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => handleOpenCreateModal('hero_slider')}
                        className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Add Hero Banner
                    </button>
                    <button
                        onClick={() => handleOpenCreateModal('popup')}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-orange-600 transition"
                    >
                        <Bell className="h-4 w-4 text-purple-600" /> New Popup
                    </button>
                </div>
            </div>

            {/* Campaign Analytics KPI Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-[10px] font-black uppercase tracking-wider">Active Campaigns</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-gray-900">
                        {campaigns.filter((c) => c.isActive).length} / {campaigns.length}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-600 mt-1 block">Live on storefront</span>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-[10px] font-black uppercase tracking-wider">Total Impressions</span>
                        <Eye className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-gray-900">
                        {totalImpressions.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] font-bold text-blue-600 mt-1 block">Banner views served</span>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-[10px] font-black uppercase tracking-wider">Total Clicks</span>
                        <MousePointerClick className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-gray-900">
                        {totalClicks.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] font-bold text-orange-600 mt-1 block">Direct CTA engagements</span>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-[10px] font-black uppercase tracking-wider">Avg Click-Through (CTR)</span>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-purple-700">{avgCTR}%</p>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 block">Conversion efficiency</span>
                </div>
            </div>

            {/* Sub-Navigation Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
                {[
                    { id: 'all', label: `All Ads (${campaigns.length})` },
                    { id: 'hero_slider', label: `Hero Sliders (${heroSliders.length})` },
                    { id: 'secondary_banner', label: `Secondary Posters (${secondaryBanners.length})` },
                    { id: 'popup', label: `Popups (${popups.length})` },
                    { id: 'announcement_bar', label: `Announcements (${announcements.length})` },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedType(tab.id)}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                            selectedType === tab.id
                                ? 'bg-gray-900 text-white shadow-xs'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* SECTION: Hero Sliders with Drag-and-Drop / Move Ordering */}
            {(selectedType === 'all' || selectedType === 'hero_slider') && heroSliders.length > 0 && (
                <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                        <div className="flex items-center gap-2.5">
                            <Sliders className="h-5 w-5 text-orange-500" />
                            <div>
                                <h3 className="text-sm font-black text-gray-900">
                                    Homepage Hero Slider Showcase Order
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Rearrange position order. Changes persist to MongoDB and sync in real-time to customers.
                                </p>
                            </div>
                        </div>
                        <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-black text-orange-700">
                            Drag & Move Enabled
                        </span>
                    </div>

                    <div className="space-y-3">
                        {heroSliders.map((slide, index) => (
                            <div
                                key={slide._id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200/70 bg-gray-50/50 p-3.5 transition hover:bg-white hover:shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Move controls */}
                                    <div className="flex flex-col items-center gap-1 text-gray-400">
                                        <button
                                            disabled={index === 0}
                                            onClick={() => handleMoveOrder(index, 'up')}
                                            className="rounded p-1 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                            title="Move Up"
                                        >
                                            <ArrowUp className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="font-mono text-[10px] font-black text-gray-600">
                                            #{index + 1}
                                        </span>
                                        <button
                                            disabled={index === heroSliders.length - 1}
                                            onClick={() => handleMoveOrder(index, 'down')}
                                            className="rounded p-1 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                            title="Move Down"
                                        >
                                            <ArrowDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {/* Thumbnail */}
                                    <img
                                        src={slide.desktopImage}
                                        alt={slide.title}
                                        className="h-14 w-20 rounded-xl object-cover border border-gray-200 bg-gray-100 shrink-0"
                                    />

                                    {/* Details */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase text-orange-800">
                                                {slide.badge || 'PROMO'}
                                            </span>
                                            <p className="text-xs font-black text-gray-900 line-clamp-1">
                                                {slide.title}
                                            </p>
                                        </div>
                                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                            {slide.subtitle || slide.offerText || 'No subtitle specified'}
                                        </p>
                                        <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-400">
                                            <span>CTA: <strong>{slide.ctaText}</strong></span>
                                            <span>Link: <strong>{slide.ctaLink}</strong></span>
                                            <span>Priority: <strong>{slide.priority}/10</strong></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Analytics, Status Toggle, Actions */}
                                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                                    {/* CTR Stats */}
                                    <div className="text-right">
                                        <span className="text-xs font-mono font-black text-gray-900 block">
                                            {slide.analytics?.clicks || 0} clks / {slide.analytics?.impressions || 0} views
                                        </span>
                                        <span className="text-[10px] font-bold text-purple-600">
                                            {slide.ctr || 0}% CTR
                                        </span>
                                    </div>

                                    {/* Active Toggle Switch */}
                                    <button
                                        onClick={() => handleToggleActive(slide._id)}
                                        className={`rounded-full px-2.5 py-1 text-[10px] font-black transition ${
                                            slide.isActive
                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        {slide.isActive ? 'Active' : 'Disabled'}
                                    </button>

                                    {/* Preview Button */}
                                    <button
                                        onClick={() => setPreviewCampaign(slide)}
                                        className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        title="Live Preview"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>

                                    {/* Edit Button */}
                                    <button
                                        onClick={() => handleOpenEditModal(slide)}
                                        className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                                        title="Edit Campaign"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDelete(slide._id)}
                                        className="rounded-xl border border-gray-200 p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                                        title="Delete Banner"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION: All Campaigns Cards Table */}
            <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                    <div>
                        <h3 className="text-sm font-black text-gray-900">All Registered Advertisements</h3>
                        <p className="text-[11px] text-gray-500">
                            Targeting rules, A/B variants, schedules, and active promotional banners
                        </p>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                        Showing {filteredCampaigns.length} campaigns
                    </span>
                </div>

                <div className="divide-y divide-gray-100">
                    {filteredCampaigns.map((c) => (
                        <div key={c._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:bg-gray-50/50 px-2 rounded-2xl transition">
                            <div className="flex items-center gap-3">
                                <img
                                    src={c.desktopImage}
                                    alt={c.title}
                                    className="h-14 w-20 rounded-xl object-cover border border-gray-200 bg-gray-100 shrink-0"
                                />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase text-gray-700">
                                            {c.type.replace('_', ' ')}
                                        </span>
                                        {c.badge && (
                                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">
                                                {c.badge}
                                            </span>
                                        )}
                                        {c.abTest?.isEnabled && (
                                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase text-purple-800">
                                                A/B Test Active
                                            </span>
                                        )}
                                        <p className="text-xs font-black text-gray-900 line-clamp-1">{c.title}</p>
                                    </div>
                                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{c.subtitle || c.offerText || '—'}</p>
                                    <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-400 flex-wrap">
                                        <span>Target: <strong>{c.targetAudience}</strong></span>
                                        <span>Device: <strong>{c.targetDevice}</strong></span>
                                        {c.startDate && <span>Starts: {new Date(c.startDate).toLocaleDateString()}</span>}
                                        {c.endDate && <span>Expires: {new Date(c.endDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                                <div className="text-right">
                                    <span className="text-xs font-mono font-black text-gray-900 block">
                                        {c.analytics?.clicks || 0} clks / {c.analytics?.impressions || 0} views
                                    </span>
                                    <span className="text-[10px] font-bold text-purple-600">
                                        {c.ctr || 0}% CTR
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleToggleActive(c._id)}
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-black transition ${
                                        c.isActive
                                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                >
                                    {c.isActive ? 'Active' : 'Disabled'}
                                </button>

                                <button
                                    onClick={() => setPreviewCampaign(c)}
                                    className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
                                    title="Preview"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => handleOpenEditModal(c)}
                                    className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                                    title="Edit"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => handleDelete(c._id)}
                                    className="rounded-xl border border-gray-200 p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredCampaigns.length === 0 && (
                        <p className="py-12 text-center text-xs text-gray-400">
                            No campaigns match the selected category. Click "Add Hero Banner" or "New Popup" to create one.
                        </p>
                    )}
                </div>
            </div>

            {/* MODAL: Create / Edit Campaign */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl my-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">
                                    {editingCampaign ? 'Edit Advertisement' : 'Create New Campaign'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Configure banner assets, targeting, schedule and A/B test variants
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {formMessage && (
                            <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
                                {formMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            {/* Row 1: Type & Priority */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Campaign / Ad Type
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    >
                                        <option value="hero_slider">Homepage Hero Slider</option>
                                        <option value="secondary_banner">Secondary Promotional Banner</option>
                                        <option value="category_banner">Category-Specific Banner</option>
                                        <option value="popup">Promotional Pop-up</option>
                                        <option value="announcement_bar">Announcement Bar</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Campaign Priority (1 to 10)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Headline & Badge */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Main Headline / Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Core Ultra AI Performance Laptops"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Badge Label
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. MEGA SALE"
                                        value={formData.badge}
                                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Subtitle & Offer Text */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Subtitle / Tagline
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Detailed features or specifications"
                                        value={formData.subtitle}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Offer / Discount Highlight
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Instant 10% Bank Discount"
                                        value={formData.offerText}
                                        onChange={(e) => setFormData({ ...formData, offerText: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Desktop & Mobile Banner Images */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Desktop Banner Image URL *
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://images.unsplash.com/..."
                                        value={formData.desktopImage}
                                        onChange={(e) => setFormData({ ...formData, desktopImage: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Mobile-Optimized Banner Image URL (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="Leave empty to use desktop image"
                                        value={formData.mobileImage}
                                        onChange={(e) => setFormData({ ...formData, mobileImage: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Row 5: CTA Text & Link */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        CTA Button Text
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Shop Collection"
                                        value={formData.ctaText}
                                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Destination Redirect URL / Path
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="/shop?category=Mobiles"
                                        value={formData.ctaLink}
                                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Row 6: Targeting (Audience & Device) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Target Audience
                                    </label>
                                    <select
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    >
                                        <option value="all">All Visitors & Customers</option>
                                        <option value="new_customers">New Shoppers Only</option>
                                        <option value="returning_customers">Returning Shoppers Only</option>
                                        <option value="vip">VIP / High LTV Customers</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Device Targeting
                                    </label>
                                    <select
                                        value={formData.targetDevice}
                                        onChange={(e) => setFormData({ ...formData, targetDevice: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    >
                                        <option value="all">All Devices (Desktop & Mobile)</option>
                                        <option value="desktop">Desktop Only</option>
                                        <option value="mobile">Mobile Devices Only</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 7: Schedule Activation & Expiration */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Start / Activation Date (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        End / Expiration Date (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* A/B Testing Section */}
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4">
                                <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.abTest.isEnabled}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                abTest: { ...formData.abTest, isEnabled: e.target.checked },
                                            })
                                        }
                                        className="h-4 w-4 rounded text-orange-500"
                                    />
                                    <span className="text-xs font-bold text-gray-900">
                                        Enable A/B Testing (Split Traffic with Variant B)
                                    </span>
                                </label>

                                {formData.abTest.isEnabled && (
                                    <div className="space-y-3 pt-2">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                Variant B Headline
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Alternative headline to test conversion"
                                                value={formData.abTest.variantB.title}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        abTest: {
                                                            ...formData.abTest,
                                                            variantB: {
                                                                ...formData.abTest.variantB,
                                                                title: e.target.value,
                                                            },
                                                        },
                                                    })
                                                }
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                Variant B Image URL
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="Alternative image URL"
                                                value={formData.abTest.variantB.desktopImage}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        abTest: {
                                                            ...formData.abTest,
                                                            variantB: {
                                                                ...formData.abTest.variantB,
                                                                desktopImage: e.target.value,
                                                            },
                                                        },
                                                    })
                                                }
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingCampaign ? 'Save Changes' : 'Create Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Live Banner Preview (Desktop & Mobile Viewport) */}
            {previewCampaign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
                    <div className="w-full max-w-4xl rounded-3xl bg-gray-900 text-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-orange-500/20 px-2.5 py-1 text-[10px] font-black uppercase text-orange-400 border border-orange-500/30">
                                    {previewCampaign.type.replace('_', ' ')}
                                </span>
                                <h3 className="text-sm font-black text-white">{previewCampaign.title}</h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex rounded-xl bg-white/10 p-1 text-xs font-bold">
                                    <button
                                        onClick={() => setPreviewDevice('desktop')}
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 transition ${
                                            previewDevice === 'desktop'
                                                ? 'bg-orange-500 text-white shadow-xs'
                                                : 'text-gray-300 hover:text-white'
                                        }`}
                                    >
                                        <Monitor className="h-3.5 w-3.5" /> Desktop
                                    </button>
                                    <button
                                        onClick={() => setPreviewDevice('mobile')}
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 transition ${
                                            previewDevice === 'mobile'
                                                ? 'bg-orange-500 text-white shadow-xs'
                                                : 'text-gray-300 hover:text-white'
                                        }`}
                                    >
                                        <Smartphone className="h-3.5 w-3.5" /> Mobile
                                    </button>
                                </div>

                                <button
                                    onClick={() => setPreviewCampaign(null)}
                                    className="rounded-xl p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Responsive Preview Canvas */}
                        <div className="flex items-center justify-center py-6 bg-black/40 rounded-2xl overflow-hidden">
                            <div
                                className={`transition-all duration-300 overflow-hidden rounded-2xl shadow-2xl border border-white/10 ${
                                    previewDevice === 'desktop' ? 'w-full max-w-3xl' : 'w-[340px]'
                                }`}
                                style={{ background: previewCampaign.bgGradient }}
                            >
                                <div className={`p-6 sm:p-8 flex ${previewDevice === 'desktop' ? 'flex-row items-center gap-6' : 'flex-col gap-4'}`}>
                                    <div className="flex-1 space-y-3">
                                        {previewCampaign.badge && (
                                            <span className="inline-block rounded-full bg-white/15 px-3 py-0.5 text-[10px] font-black uppercase text-orange-400 border border-white/20">
                                                {previewCampaign.badge}
                                            </span>
                                        )}
                                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                                            {previewCampaign.title}
                                        </h2>
                                        {previewCampaign.subtitle && (
                                            <p className="text-xs text-gray-300 line-clamp-2">
                                                {previewCampaign.subtitle}
                                            </p>
                                        )}
                                        {previewCampaign.offerText && (
                                            <span className="inline-block rounded-lg bg-orange-500/20 px-2.5 py-1 text-xs font-bold text-orange-300 border border-orange-500/30">
                                                {previewCampaign.offerText}
                                            </span>
                                        )}
                                        <div className="pt-2">
                                            <span className="inline-block rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md">
                                                {previewCampaign.ctaText || 'Shop Now'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={previewDevice === 'desktop' ? 'w-64 shrink-0' : 'w-full'}>
                                        <img
                                            src={
                                                previewDevice === 'mobile' && previewCampaign.mobileImage
                                                    ? previewCampaign.mobileImage
                                                    : previewCampaign.desktopImage
                                            }
                                            alt={previewCampaign.title}
                                            className="h-44 w-full rounded-xl object-cover border border-white/20 shadow-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCampaignsTab;