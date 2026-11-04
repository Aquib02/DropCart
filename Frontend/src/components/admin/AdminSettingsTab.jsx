import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Settings,
    Globe,
    Shield,
    CreditCard,
    Truck,
    Percent,
    Phone,
    Share2,
    Power,
    CheckCircle2,
    AlertCircle,
    Save,
    RefreshCw,
    Image,
    Layers,
    FileText,
    ExternalLink
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminSettingsTab = ({ userToken }) => {
    const [settings, setSettings] = useState({
        storeName: 'DropCart',
        tagline: 'India’s Favorite Online Shopping Destination',
        logoUrl: '',
        faviconUrl: '',
        themeColor: 'orange',
        announcement: '🔥 BIG BANG SALE LIVE: Up to 70% Off + Extra 10% Bank Discount on Credit/Debit Cards!',
        bannerActive: true,
        heroTitle: 'India’s Favorite Online Shopping Destination',
        heroSubtitle: 'Mobiles, Fashion, Electronics, Home Appliances, and Lifestyle at Unmatched Deals.',
        heroBadge: 'Mega Festive Deals 2026',
        seo: {
            metaTitle: 'DropCart - Online Shopping for Electronics, Fashion, Mobiles & More',
            metaDescription: 'Shop genuine electronics, mobile phones, fashion, and appliances at India’s premier e-commerce store with express shipping and secure payments.',
            ogImage: '',
            googleAnalyticsId: 'G-DROPCART2026'
        },
        shipping: {
            standardShippingFee: 49,
            freeShippingThreshold: 499,
            expressShippingFee: 99,
            estimatedStandardDays: '2 - 4 Business Days',
            estimatedExpressDays: '24 - 48 Hours Express'
        },
        tax: {
            taxRatePercent: 18,
            pricesIncludeTax: true,
            gstinNumber: '29AABCT1332L1ZV',
            legalBusinessName: 'DropCart Retail Technologies Pvt Ltd'
        },
        paymentMethods: {
            razorpayEnabled: true,
            codEnabled: true,
            upiEnabled: true,
            stripeEnabled: false,
            codFee: 0
        },
        contact: {
            supportEmail: 'support@dropcart.in',
            supportPhone: '+91 1800-202-9898',
            whatsappNumber: '+91 98765 43210',
            physicalAddress: 'DropCart Towers, 4th Block, Koramangala, Bangalore - 560034, India'
        },
        socialLinks: {
            instagram: 'https://instagram.com/dropcart',
            facebook: 'https://facebook.com/dropcart',
            twitter: 'https://x.com/dropcart',
            youtube: 'https://youtube.com/dropcart',
            linkedin: 'https://linkedin.com/company/dropcart'
        },
        maintenanceMode: {
            enabled: false,
            message: 'We are performing scheduled improvements to bring you a faster shopping experience. DropCart will return shortly!'
        }
    });

    const [activeSection, setActiveSection] = useState('branding');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    // Fetch live settings
    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/settings`);
            if (res.data) {
                setSettings(prev => ({
                    ...prev,
                    ...res.data,
                    seo: { ...prev.seo, ...(res.data.seo || {}) },
                    shipping: { ...prev.shipping, ...(res.data.shipping || {}) },
                    tax: { ...prev.tax, ...(res.data.tax || {}) },
                    paymentMethods: { ...prev.paymentMethods, ...(res.data.paymentMethods || {}) },
                    contact: { ...prev.contact, ...(res.data.contact || {}) },
                    socialLinks: { ...prev.socialLinks, ...(res.data.socialLinks || {}) },
                    maintenanceMode: { ...prev.maintenanceMode, ...(res.data.maintenanceMode || {}) },
                }));
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Save settings
    const handleSave = async (e) => {
        e?.preventDefault();
        setSaving(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const res = await axios.put(`${API_BASE_URL}/api/settings`, settings, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            if (res.data) {
                setStatusMessage({
                    type: 'success',
                    text: 'Store settings and live configuration successfully synchronized across MongoDB and storefront.'
                });
                setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
            }
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to update store configuration.'
            });
        } finally {
            setSaving(false);
        }
    };

    const sections = [
        { id: 'branding', label: 'Identity & Theme', icon: Globe },
        { id: 'announcements', label: 'Announcement Bar', icon: Layers },
        { id: 'seo', label: 'SEO & Analytics', icon: FileText },
        { id: 'logistics', label: 'Shipping & Delivery', icon: Truck },
        { id: 'taxes', label: 'Taxes & GST Invoicing', icon: Percent },
        { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
        { id: 'support', label: 'Contact & Support', icon: Phone },
        { id: 'social', label: 'Social Channels', icon: Share2 },
        { id: 'maintenance', label: 'Maintenance Mode', icon: Power },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-black text-gray-900">
                        Website Configuration & Store Architecture
                    </h2>
                    <p className="text-xs text-gray-500">
                        Manage store branding, SEO meta tags, shipping fees, GST invoices, payment methods, and maintenance mode
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchSettings}
                        disabled={loading || saving}
                        className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Reload</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2 text-xs font-black text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Publishing...' : 'Save Configuration'}</span>
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

            {/* Navigation tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2">
                {sections.map(s => {
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                                activeSection === s.id
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{s.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content card */}
            <form onSubmit={handleSave} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                {/* 1. IDENTITY & BRANDING */}
                {activeSection === 'branding' && (
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Brand Identity & Visual Style</h3>
                            <p className="text-xs text-gray-500">Configure logo, favicon, store title, and master theme accent</p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Store Name</label>
                                <input
                                    type="text"
                                    value={settings.storeName}
                                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Store Tagline</label>
                                <input
                                    type="text"
                                    value={settings.tagline}
                                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Website Logo URL</label>
                                <input
                                    type="url"
                                    value={settings.logoUrl}
                                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                    placeholder="https://yourdomain.com/logo.png"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Favicon URL (.ico / .png)</label>
                                <input
                                    type="url"
                                    value={settings.faviconUrl}
                                    onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                                    placeholder="https://yourdomain.com/favicon.png"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Primary Brand Accent</label>
                                <select
                                    value={settings.themeColor}
                                    onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                >
                                    <option value="orange">Sunset Orange (Default)</option>
                                    <option value="blue">Sapphire Blue</option>
                                    <option value="emerald">Emerald Green</option>
                                    <option value="purple">Royal Purple</option>
                                    <option value="rose">Crimson Rose</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ANNOUNCEMENT BAR & HERO */}
                {activeSection === 'announcements' && (
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Announcement Bar & Hero Headlines</h3>
                            <p className="text-xs text-gray-500">Control the top promotional bar and hero landing content</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-2xl bg-gray-50/70 p-4 border border-gray-200/60">
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Announcement Bar Status</p>
                                    <p className="text-[11px] text-gray-500">Toggle visibility of top header alert</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.bannerActive}
                                        onChange={(e) => setSettings({ ...settings, bannerActive: e.target.checked })}
                                        className="peer sr-only"
                                    />
                                    <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Announcement Text</label>
                                <input
                                    type="text"
                                    value={settings.announcement}
                                    onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">Hero Main Title</label>
                                    <input
                                        type="text"
                                        value={settings.heroTitle}
                                        onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">Hero Badge</label>
                                    <input
                                        type="text"
                                        value={settings.heroBadge}
                                        onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Hero Subtitle</label>
                                <textarea
                                    rows={2}
                                    value={settings.heroSubtitle}
                                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. SEO & ANALYTICS */}
                {activeSection === 'seo' && (
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Search Engine Optimization (SEO)</h3>
                            <p className="text-xs text-gray-500">Manage Google meta titles, descriptions, and tracking measurement IDs</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Global Meta Title (50-60 chars)</label>
                                <input
                                    type="text"
                                    value={settings.seo?.metaTitle || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seo: { ...settings.seo, metaTitle: e.target.value }
                                    })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Global Meta Description (under 160 chars)</label>
                                <textarea
                                    rows={3}
                                    value={settings.seo?.metaDescription || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seo: { ...settings.seo, metaDescription: e.target.value }
                                    })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">OpenGraph Social Share Image URL</label>
                                    <input
                                        type="url"
                                        value={settings.seo?.ogImage || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            seo: { ...settings.seo, ogImage: e.target.value }
                                        })}
                                        placeholder="https://yourdomain.com/og-banner.jpg"
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">Google Analytics 4 ID (e.g. G-XXXXXXX)</label>
                                    <input
                                        type="text"
                                        value={settings.seo?.googleAnalyticsId || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            seo: { ...settings.seo, googleAnalyticsId: e.target.value }
                                        })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. LOGISTICS & SHIPPING */}
                {activeSection === 'logistics' && (
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Shipping Rates & Delivery Rules</h3>
                            <p className="text-xs text-gray-500">Define standard delivery charges, free shipping thresholds, and express surcharges</p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4">
                                <label className="text-[11px] font-bold uppercase text-gray-500">Standard Delivery Fee (₹)</label>
                                <input
                                    type="number"
                                    value={settings.shipping?.standardShippingFee || 0}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        shipping: { ...settings.shipping, standardShippingFee: Number(e.target.value) }
                                    })}
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-base font-black text-gray-900 outline-none focus:border-orange-500"
                                />
                                <p className="mt-1 text-[10px] text-gray-400">Charged on orders below free shipping limit</p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4">
                                <label className="text-[11px] font-bold uppercase text-gray-500">Free Delivery Threshold (₹)</label>
                                <input
                                    type="number"
                                    value={settings.shipping?.freeShippingThreshold || 0}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        shipping: { ...settings.shipping, freeShippingThreshold: Number(e.target.value) }
                                    })}
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-base font-black text-emerald-600 outline-none focus:border-orange-500"
                                />
                                <p className="mt-1 text-[10px] text-gray-400">Orders equal to or above this amount get free shipping</p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4">
                                <label className="text-[11px] font-bold uppercase text-gray-500">Express Delivery Fee (₹)</label>
                                <input
                                    type="number"
                                    value={settings.shipping?.expressShippingFee || 0}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        shipping: { ...settings.shipping, expressShippingFee: Number(e.target.value) }
                                    })}
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-base font-black text-purple-700 outline-none focus:border-orange-500"
                                />
                                <p className="mt-1 text-[10px] text-gray-400">Optional surcharge for guaranteed 24-48h dispatch</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Standard Estimated Transit</label>
                                <input
                                    type="text"
                                    value={settings.shipping?.estimatedStandardDays || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        shipping: { ...settings.shipping, estimatedStandardDays: e.target.value }
                                    })}
                                    placeholder="2 - 4 Business Days"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Express Estimated Transit</label>
                                <input
                                    type="text"
                                    value={settings.shipping?.estimatedExpressDays || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        shipping: { ...settings.shipping, estimatedExpressDays: e.target.value }
                                    })}
                                    placeholder="24 - 48 Hours Express"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. TAXES & GST */}
                {activeSection === 'taxes' && (
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Taxes, GST & Legal Invoicing</h3>
                            <p className="text-xs text-gray-500">Configure Indian GST rates, company legal entity name, and tax display rules</p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Standard GST Rate (%)</label>
                                <input
                                    type="number"
                                    value={settings.tax?.taxRatePercent || 18}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        tax: { ...settings.tax, taxRatePercent: Number(e.target.value) }
                                    })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-black text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Official GSTIN Number</label>
                                <input
                                    type="text"
                                    value={settings.tax?.gstinNumber || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        tax: { ...settings.tax, gstinNumber: e.target.value.toUpperCase() }
                                    })}
                                    placeholder="29AABCT1332L1ZV"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-mono font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[11px] font-bold uppercase text-gray-500">Legal Business Entity Name</label>
                                <input
                                    type="text"
                                    value={settings.tax?.legalBusinessName || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        tax: { ...settings.tax, legalBusinessName: e.target.value }
                                    })}
                                    placeholder="DropCart Retail Technologies Pvt Ltd"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. PAYMENT METHODS */}
                {activeSection === 'payments' && (
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Supported Payment Methods</h3>
                            <p className="text-xs text-gray-500">Enable or disable checkout payment gateways in real-time</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Razorpay */}
                            <div className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4">
                                <div>
                                    <p className="text-xs font-black text-gray-900">Razorpay Payment Gateway</p>
                                    <p className="text-[11px] text-gray-500">Credit/Debit Cards, NetBanking, Wallets</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.paymentMethods?.razorpayEnabled}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            paymentMethods: { ...settings.paymentMethods, razorpayEnabled: e.target.checked }
                                        })}
                                        className="peer sr-only"
                                    />
                                    <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>

                            {/* Cash on Delivery */}
                            <div className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4">
                                <div>
                                    <p className="text-xs font-black text-gray-900">Cash On Delivery (COD)</p>
                                    <p className="text-[11px] text-gray-500">Pay cash/card at the doorstep</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.paymentMethods?.codEnabled}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            paymentMethods: { ...settings.paymentMethods, codEnabled: e.target.checked }
                                        })}
                                        className="peer sr-only"
                                    />
                                    <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>

                            {/* Instant UPI */}
                            <div className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4">
                                <div>
                                    <p className="text-xs font-black text-gray-900">Instant UPI Direct (GPay/PhonePe)</p>
                                    <p className="text-[11px] text-gray-500">Zero surcharge instant QR scan</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.paymentMethods?.upiEnabled}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            paymentMethods: { ...settings.paymentMethods, upiEnabled: e.target.checked }
                                        })}
                                        className="peer sr-only"
                                    />
                                    <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>

                            {/* Stripe Global */}
                            <div className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4">
                                <div>
                                    <p className="text-xs font-black text-gray-900">Stripe Global (International Cards)</p>
                                    <p className="text-[11px] text-gray-500">USD/EUR multi-currency payments</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.paymentMethods?.stripeEnabled}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            paymentMethods: { ...settings.paymentMethods, stripeEnabled: e.target.checked }
                                        })}
                                        className="peer sr-only"
                                    />
                                    <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. CONTACT & SUPPORT */}
                {activeSection === 'support' && (
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Customer Support & Helpline</h3>
                            <p className="text-xs text-gray-500">Visible on invoices, order emails, and footer</p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Support Email</label>
                                <input
                                    type="email"
                                    value={settings.contact?.supportEmail || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        contact: { ...settings.contact, supportEmail: e.target.value }
                                    })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Helpline Toll-Free Phone</label>
                                <input
                                    type="text"
                                    value={settings.contact?.supportPhone || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        contact: { ...settings.contact, supportPhone: e.target.value }
                                    })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">WhatsApp Support Number</label>
                                <input
                                    type="text"
                                    value={settings.contact?.whatsappNumber || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        contact: { ...settings.contact, whatsappNumber: e.target.value }
                                    })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Headquarters Physical Address</label>
                                <input
                                    type="text"
                                    value={settings.contact?.physicalAddress || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        contact: { ...settings.contact, physicalAddress: e.target.value }
                                    })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 8. SOCIAL CHANNELS */}
                {activeSection === 'social' && (
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Social Media Links</h3>
                            <p className="text-xs text-gray-500">Displayed in footer and customer outreach campaigns</p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {['instagram', 'facebook', 'twitter', 'youtube', 'linkedin'].map(channel => (
                                <div key={channel}>
                                    <label className="text-[11px] font-bold uppercase text-gray-500 capitalize">{channel} URL</label>
                                    <input
                                        type="url"
                                        value={settings.socialLinks?.[channel] || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            socialLinks: { ...settings.socialLinks, [channel]: e.target.value }
                                        })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 9. MAINTENANCE MODE */}
                {activeSection === 'maintenance' && (
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Store Maintenance Mode</h3>
                            <p className="text-xs text-gray-500">Temporarily disable storefront for visitors while retaining admin access</p>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
                            <div>
                                <p className="text-sm font-black text-rose-900">Enable Maintenance Mode</p>
                                <p className="text-xs text-rose-700">When active, shoppers will see your maintenance announcement</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode?.enabled}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        maintenanceMode: { ...settings.maintenanceMode, enabled: e.target.checked }
                                    })}
                                    className="peer sr-only"
                                />
                                <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-rose-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500">Downtime Message Displayed to Visitors</label>
                            <textarea
                                rows={3}
                                value={settings.maintenanceMode?.message || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    maintenanceMode: { ...settings.maintenanceMode, message: e.target.value }
                                })}
                                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                            />
                        </div>
                    </div>
                )}

                {/* Save button footer */}
                <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Publishing Changes...' : 'Save Configuration'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSettingsTab;
