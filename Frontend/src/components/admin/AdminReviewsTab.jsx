import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    MessageSquare,
    Star,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Send,
    LifeBuoy,
    BellRing,
    ShoppingCart,
    Clock,
    User,
    Mail,
    Phone,
    Tag,
    X,
    Search,
    RefreshCw,
    Check,
    Megaphone,
    Percent,
    Sparkles,
    Loader2,
    Gift
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminReviewsTab = ({ userToken }) => {
    // Sub-tab: 'tickets' | 'reviews' | 'broadcasts' | 'abandoned_carts'
    const [activeSection, setActiveSection] = useState('tickets');

    // 1. Support Tickets State
    const [tickets, setTickets] = useState([]);
    const [ticketCounts, setTicketCounts] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    const [ticketLoading, setTicketLoading] = useState(true);
    const [ticketFilter, setTicketFilter] = useState('All');
    const [ticketSearch, setTicketSearch] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketReply, setTicketReply] = useState('');
    const [ticketStatusUpdate, setTicketStatusUpdate] = useState('In Progress');
    const [replyLoading, setReplyLoading] = useState(false);

    // 2. Reviews State
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [ratingFilter, setRatingFilter] = useState('All');
    const [reviewSearch, setReviewSearch] = useState('');

    // 3. Broadcasts State
    const [broadcasts, setBroadcasts] = useState([]);
    const [broadcastForm, setBroadcastForm] = useState({
        title: '⚡ Weekend Flash Mega Sale is Live!',
        message: 'Enjoy up to 50% discount on Mobiles and Electronics with free express shipping across India.',
        badge: 'Limited Time Deal',
        targetAudience: 'All',
        channel: 'In-App Push',
        link: '/shop'
    });
    const [broadcastLoading, setBroadcastLoading] = useState(false);

    // 4. Abandoned Carts State
    const [abandonedLeads, setAbandonedLeads] = useState([]);
    const [abandonedLoading, setAbandonedLoading] = useState(false);
    const [recoveryStats, setRecoveryStats] = useState({ totalLeads: 0, totalPotentialRecoveryValue: 0 });
    const [dispatchingLeadId, setDispatchingLeadId] = useState(null);

    // Notification
    const [notification, setNotification] = useState({ type: '', text: '' });

    // Show temporary toast notification
    const showToast = (type, text) => {
        setNotification({ type, text });
        setTimeout(() => setNotification({ type: '', text: '' }), 4000);
    };

    // 1. Fetch Tickets
    const fetchTickets = async () => {
        setTicketLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/engagement/tickets`, {
                headers: { Authorization: `Bearer ${userToken}` },
                params: {
                    status: ticketFilter !== 'All' ? ticketFilter : undefined,
                    search: ticketSearch || undefined
                }
            });
            if (res.data.success) {
                setTickets(res.data.tickets || []);
                setTicketCounts(res.data.counts || { total: 0, open: 0, inProgress: 0, resolved: 0 });
            }
        } catch (err) {
            console.error('Error fetching support tickets:', err);
        } finally {
            setTicketLoading(false);
        }
    };

    // 2. Fetch Reviews
    const fetchReviews = async () => {
        setReviewsLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/products/reviews/all`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setReviews(data || []);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    // 3. Fetch Broadcasts
    const fetchBroadcasts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/engagement/broadcasts`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (res.data.success) {
                setBroadcasts(res.data.broadcasts || []);
            }
        } catch (err) {
            console.error('Error fetching broadcasts:', err);
        }
    };

    // 4. Fetch Abandoned Carts
    const fetchAbandonedCarts = async () => {
        setAbandonedLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/engagement/abandoned-carts`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (res.data.success) {
                setAbandonedLeads(res.data.targets || []);
                setRecoveryStats({
                    totalLeads: res.data.totalLeads,
                    totalPotentialRecoveryValue: res.data.totalPotentialRecoveryValue
                });
            }
        } catch (err) {
            console.error('Error fetching abandoned carts:', err);
        } finally {
            setAbandonedLoading(false);
        }
    };

    useEffect(() => {
        if (userToken) {
            fetchTickets();
            fetchReviews();
            fetchBroadcasts();
            fetchAbandonedCarts();
        }
    }, [userToken, ticketFilter]);

    // Handle Ticket Reply & Status Update
    const handleUpdateTicket = async (e) => {
        e?.preventDefault();
        if (!selectedTicket) return;
        setReplyLoading(true);

        try {
            const res = await axios.patch(
                `${API_BASE_URL}/api/engagement/tickets/${selectedTicket._id}`,
                {
                    status: ticketStatusUpdate,
                    replyMessage: ticketReply,
                    assignedToName: 'DropCart Support Desk'
                },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            if (res.data.success) {
                showToast('success', `Ticket ${selectedTicket.ticketNumber} updated successfully.`);
                setSelectedTicket(res.data.ticket);
                setTicketReply('');
                fetchTickets();
            }
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to update ticket');
        } finally {
            setReplyLoading(false);
        }
    };

    // Handle Delete Review
    const handleDeleteReview = async (productId, reviewId) => {
        if (!window.confirm('Delete this customer review permanently?')) return;
        try {
            await axios.delete(
                `${API_BASE_URL}/api/products/${productId}/reviews/${reviewId}`,
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            setReviews(prev => prev.filter(r => r._id !== reviewId));
            showToast('success', 'Review deleted successfully.');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to delete review');
        }
    };

    // Handle Broadcast Submit
    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        setBroadcastLoading(true);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/engagement/broadcasts`,
                broadcastForm,
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            if (res.data.success) {
                showToast('success', res.data.message);
                fetchBroadcasts();
            }
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to publish broadcast');
        } finally {
            setBroadcastLoading(false);
        }
    };

    // Handle 1-Click Recovery Offer
    const handleSendRecoveryOffer = async (lead) => {
        setDispatchingLeadId(lead.userId);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/engagement/abandoned-carts/recovery-offer`,
                {
                    userId: lead.userId,
                    couponCode: 'COMEBACK15',
                    discountPercent: 15
                },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            if (res.data.success) {
                showToast('success', res.data.message);
            }
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to dispatch offer');
        } finally {
            setDispatchingLeadId(null);
        }
    };

    // Filter Reviews
    const filteredReviews = reviews.filter(r => {
        const matchesRating = ratingFilter === 'All'
            ? true
            : ratingFilter === '5'
            ? r.rating === 5
            : ratingFilter === 'Critical'
            ? r.rating <= 2
            : r.rating === Number(ratingFilter);

        const matchesSearch = !reviewSearch
            ? true
            : (r.productName?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
               r.comment?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
               r.name?.toLowerCase().includes(reviewSearch.toLowerCase()));

        return matchesRating && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-black text-gray-900">
                        Customer Engagement, Support & Reviews Hub
                    </h2>
                    <p className="text-xs text-gray-500">
                        Manage helpdesk tickets, moderate verified buyer reviews, trigger recovery offers, and broadcast store alerts
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            fetchTickets();
                            fetchReviews();
                            fetchBroadcasts();
                            fetchAbandonedCarts();
                        }}
                        className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Refresh Hub</span>
                    </button>
                </div>
            </div>

            {/* Notification alert */}
            {notification.text && (
                <div
                    className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                >
                    {notification.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{notification.text}</span>
                </div>
            )}

            {/* Executive KPI Strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-2xs">
                    <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <LifeBuoy className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Open Tickets</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{ticketCounts.open}</p>
                    <p className="mt-1 text-[10px] text-gray-400 font-medium">{ticketCounts.inProgress} in progress • {ticketCounts.total} total</p>
                </div>

                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-2xs">
                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                        <Star className="h-4 w-4 fill-amber-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Reviews Logged</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{reviews.length}</p>
                    <p className="mt-1 text-[10px] text-emerald-600 font-bold">Verified Buyer Ratings</p>
                </div>

                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-2xs">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Recoverable Carts</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">₹{recoveryStats.totalPotentialRecoveryValue.toLocaleString('en-IN')}</p>
                    <p className="mt-1 text-[10px] text-purple-700 font-bold">{recoveryStats.totalLeads} inactive prospect leads</p>
                </div>

                <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-2xs">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <BellRing className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Store Broadcasts</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{broadcasts.length}</p>
                    <p className="mt-1 text-[10px] text-blue-700 font-bold">Live Socket.IO Dispatched</p>
                </div>
            </div>

            {/* Sub-module Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2">
                <button
                    onClick={() => setActiveSection('tickets')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSection === 'tickets'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <LifeBuoy className="h-3.5 w-3.5" />
                    <span>Support Tickets ({ticketCounts.total})</span>
                </button>

                <button
                    onClick={() => setActiveSection('reviews')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSection === 'reviews'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <Star className="h-3.5 w-3.5" />
                    <span>Customer Reviews ({reviews.length})</span>
                </button>

                <button
                    onClick={() => setActiveSection('abandoned_carts')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSection === 'abandoned_carts'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Abandoned Cart Recovery ({abandonedLeads.length})</span>
                </button>

                <button
                    onClick={() => setActiveSection('broadcasts')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeSection === 'broadcasts'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <Megaphone className="h-3.5 w-3.5" />
                    <span>Announcements & Broadcasts</span>
                </button>
            </div>

            {/* SECTION 1: SUPPORT TICKETS */}
            {activeSection === 'tickets' && (
                <div className="space-y-4">
                    {/* Filter and Search Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-1.5">
                            {['All', 'Open', 'In Progress', 'Resolved'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setTicketFilter(st)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                        ticketFilter === st
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={ticketSearch}
                                onChange={(e) => setTicketSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                                placeholder="Search ticket #, name, or subject..."
                                className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-gray-900 outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* Tickets Table */}
                    <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="p-4 sm:px-6">Ticket ID & Subject</th>
                                    <th className="p-4">Customer Details</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Priority</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right sm:px-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                                            No support tickets found matching this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((t) => (
                                        <tr key={t._id} className="hover:bg-gray-50/50 transition">
                                            <td className="p-4 sm:px-6 max-w-xs">
                                                <span className="font-mono text-[11px] font-black text-purple-700">
                                                    {t.ticketNumber}
                                                </span>
                                                <p className="mt-0.5 font-bold text-gray-900 truncate">
                                                    {t.subject}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    Created: {new Date(t.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>

                                            <td className="p-4">
                                                <p className="font-bold text-gray-900">{t.customerName}</p>
                                                <p className="text-[11px] text-gray-500">{t.customerEmail}</p>
                                                {t.customerPhone && (
                                                    <p className="text-[10px] text-gray-400">{t.customerPhone}</p>
                                                )}
                                            </td>

                                            <td className="p-4 text-gray-600 font-medium">{t.category}</td>

                                            <td className="p-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                                        t.priority === 'Urgent' || t.priority === 'High'
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : t.priority === 'Medium'
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {t.priority}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                                        t.status === 'Open'
                                                            ? 'bg-orange-500 text-white'
                                                            : t.status === 'In Progress'
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-emerald-600 text-white'
                                                    }`}
                                                >
                                                    {t.status}
                                                </span>
                                            </td>

                                            <td className="p-4 text-right sm:px-6">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(t);
                                                        setTicketStatusUpdate(t.status);
                                                    }}
                                                    className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-orange-500 hover:text-orange-600 transition"
                                                >
                                                    View Conversation
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SECTION 2: CUSTOMER REVIEWS */}
            {activeSection === 'reviews' && (
                <div className="space-y-4">
                    {/* Review Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-1.5">
                            {['All', '5', '4', 'Critical'].map(rf => (
                                <button
                                    key={rf}
                                    onClick={() => setRatingFilter(rf)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                        ratingFilter === rf
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                >
                                    {rf === 'All' ? 'All Reviews' : rf === 'Critical' ? 'Critical (1-2★)' : `${rf} Stars ★`}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={reviewSearch}
                                onChange={(e) => setReviewSearch(e.target.value)}
                                placeholder="Search by customer or product..."
                                className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-gray-900 outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredReviews.length === 0 ? (
                            <div className="col-span-2 py-12 text-center text-xs text-gray-400">
                                No reviews found matching your search.
                            </div>
                        ) : (
                            filteredReviews.map((r) => (
                                <div
                                    key={r._id}
                                    className="rounded-3xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-sm transition"
                                >
                                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            {r.productImage && (
                                                <img
                                                    src={r.productImage}
                                                    alt={r.productName}
                                                    className="h-10 w-10 rounded-xl object-cover border border-gray-100 shrink-0"
                                                />
                                            )}
                                            <div>
                                                <p className="line-clamp-1 text-xs font-black text-gray-900">
                                                    {r.productName}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium">
                                                    Category: {r.category || 'General'}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteReview(r.productId, r._id)}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                            title="Delete Review"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-amber-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-3.5 w-3.5 ${
                                                        i < (r.rating || 5)
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-gray-200'
                                                    }`}
                                                />
                                            ))}
                                            <span className="ml-1 text-xs font-black text-gray-800">
                                                {r.rating}★
                                            </span>
                                        </div>

                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
                                            Verified Buyer
                                        </span>
                                    </div>

                                    <p className="mt-3 text-xs text-gray-700 leading-relaxed font-medium italic">
                                        "{r.comment}"
                                    </p>

                                    <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
                                        <span className="font-bold text-gray-600">Reviewer: {r.name || 'Verified Customer'}</span>
                                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* SECTION 3: ABANDONED CARTS */}
            {activeSection === 'abandoned_carts' && (
                <div className="space-y-4">
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-black text-gray-900">
                                    Abandoned Cart & Wishlist Recovery Engine
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Target prospects who left items behind with 1-click incentive discounts (+15% Off Code + 50 SuperCoins)
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <tr>
                                        <th className="py-3 px-3">Customer Prospect</th>
                                        <th className="py-3 px-3">Items Left Behind</th>
                                        <th className="py-3 px-3">Estimated Cart Value</th>
                                        <th className="py-3 px-3">Days Inactive</th>
                                        <th className="py-3 px-3">Lead Status</th>
                                        <th className="py-3 px-3 text-right">Recovery Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {abandonedLeads.map((lead) => (
                                        <tr key={lead.userId} className="hover:bg-gray-50/50 transition">
                                            <td className="py-3 px-3 font-bold text-gray-900">
                                                {lead.name}
                                                <span className="block text-[11px] text-gray-400 font-normal">{lead.email}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="font-bold text-gray-800">{lead.sampleItem}</span>
                                                {lead.itemsCount > 1 && (
                                                    <span className="text-gray-400"> +{lead.itemsCount - 1} more</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 font-black text-gray-900">
                                                ₹{lead.estimatedCartValue.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-3 px-3 text-gray-600 font-medium">
                                                {lead.daysInactive} days ago
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-black text-purple-700">
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <button
                                                    onClick={() => handleSendRecoveryOffer(lead)}
                                                    disabled={dispatchingLeadId === lead.userId}
                                                    className="flex items-center gap-1.5 ml-auto rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-black text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50"
                                                >
                                                    {dispatchingLeadId === lead.userId ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Gift className="h-3.5 w-3.5" />
                                                    )}
                                                    <span>Send Offer (15% Off)</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION 4: BROADCASTS & ANNOUNCEMENTS */}
            {activeSection === 'broadcasts' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Broadcast Form */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                            <Megaphone className="h-5 w-5 text-orange-500" />
                            <div>
                                <h3 className="text-base font-black text-gray-900">
                                    Push Real-Time Announcement
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Broadcast live flash sale notifications directly to all online customer browsers via Socket.IO
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSendBroadcast} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Announcement Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={broadcastForm.title}
                                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">Badge Tag</label>
                                    <input
                                        type="text"
                                        value={broadcastForm.badge}
                                        onChange={(e) => setBroadcastForm({ ...broadcastForm, badge: e.target.value })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500">Target Audience</label>
                                    <select
                                        value={broadcastForm.targetAudience}
                                        onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                    >
                                        <option value="All">All Shoppers</option>
                                        <option value="VIP Customers">VIP Shoppers</option>
                                        <option value="New Customers">New Registrations</option>
                                        <option value="At Risk Customers">At Risk Customers</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Notification Message *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={broadcastForm.message}
                                    onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-medium text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-500">Redirect Link URL</label>
                                <input
                                    type="text"
                                    value={broadcastForm.link}
                                    onChange={(e) => setBroadcastForm({ ...broadcastForm, link: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={broadcastLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-50"
                            >
                                <Megaphone className="h-4 w-4" />
                                <span>{broadcastLoading ? 'Dispatching Broadcast...' : 'Broadcast to Storefront Now'}</span>
                            </button>
                        </form>
                    </div>

                    {/* Broadcasts History */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">
                                Dispatched Announcements Log
                            </h3>
                            <p className="text-xs text-gray-400">
                                Historical real-time broadcasts pushed to customers
                            </p>
                        </div>

                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                            {broadcasts.map((b) => (
                                <div
                                    key={b._id}
                                    className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition hover:bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-black uppercase text-orange-700">
                                            {b.badge || 'Alert'}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(b.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <h4 className="mt-1.5 text-xs font-black text-gray-900">
                                        {b.title}
                                    </h4>
                                    <p className="mt-1 text-[11px] text-gray-600 leading-relaxed font-medium">
                                        {b.message}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                                        <span>Audience: <b>{b.targetAudience}</b></span>
                                        <span className="font-bold text-emerald-600">Reached ~{b.reachCount} shoppers</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Interactive Support Ticket Conversation Thread */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="flex h-[600px] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-black text-purple-700">
                                        {selectedTicket.ticketNumber}
                                    </span>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                            selectedTicket.status === 'Open'
                                                ? 'bg-orange-500 text-white'
                                                : selectedTicket.status === 'In Progress'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-emerald-600 text-white'
                                        }`}
                                    >
                                        {selectedTicket.status}
                                    </span>
                                </div>
                                <h3 className="mt-1 text-sm font-black text-gray-900">
                                    {selectedTicket.subject}
                                </h3>
                                <p className="text-[11px] text-gray-400">
                                    Customer: <b>{selectedTicket.customerName}</b> ({selectedTicket.customerEmail})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages Timeline */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {(selectedTicket.messages || []).map((m, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 ${m.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-2xs ${
                                            m.sender === 'agent'
                                                ? 'bg-orange-500 text-white rounded-br-xs'
                                                : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-xs'
                                        }`}
                                    >
                                        <p className="text-[10px] font-black opacity-80 mb-1">
                                            {m.senderName} ({m.sender === 'agent' ? 'Support Agent' : 'Customer'})
                                        </p>
                                        <p className="font-medium whitespace-pre-line">{m.message}</p>
                                        <p className="mt-2 text-right text-[9px] opacity-70">
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Form Footer */}
                        <form onSubmit={handleUpdateTicket} className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50 rounded-b-3xl">
                            <div className="flex items-center gap-3">
                                <label className="text-[11px] font-bold uppercase text-gray-500">Set Ticket Status:</label>
                                <select
                                    value={ticketStatusUpdate}
                                    onChange={(e) => setTicketStatusUpdate(e.target.value)}
                                    className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 outline-none"
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={ticketReply}
                                    onChange={(e) => setTicketReply(e.target.value)}
                                    placeholder="Type your official response to customer..."
                                    className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-orange-500"
                                />
                                <button
                                    type="submit"
                                    disabled={replyLoading}
                                    className="flex items-center gap-1.5 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    <span>Send & Update</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviewsTab;
