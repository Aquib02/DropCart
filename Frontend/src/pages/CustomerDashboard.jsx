import { useState, useEffect, useContext } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ShoppingBag,
    Heart,
    User,
    Package,
    Clock,
    CheckCircle2,
    Truck,
    MapPin,
    ArrowRight,
    Trash2,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { API_BASE_URL } from '../config';

const CustomerDashboard = () => {
    const { user, updateUser } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const { wishlist, toggleWishlist } = useContext(WishlistContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // Active tab: 'orders' | 'wishlist' | 'profile'
    const currentTab = searchParams.get('tab') || 'orders';

    // Orders state
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // Profile state
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [city, setCity] = useState(user?.city || '');
    const [postalCode, setPostalCode] = useState(user?.postalCode || '');
    const [country, setCountry] = useState(user?.country || '');
    const [password, setPassword] = useState('');
    const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    // Redirect to login if visitor is not signed in
    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=customer/dashboard');
        }
    }, [user, navigate]);

    // Fetch orders and profile details
    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            try {
                setLoadingOrders(true);
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get(`${API_BASE_URL}/api/orders/myorders`, config);
                setOrders(data);
                setLoadingOrders(false);
            } catch (err) {
                console.error('Failed to load orders', err);
                setLoadingOrders(false);
            }
        };

        const fetchProfile = async () => {
            if (!user) return;
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get(`${API_BASE_URL}/api/users/profile`, config);
                setName(data.name || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
                setCity(data.city || '');
                setPostalCode(data.postalCode || '');
                setCountry(data.country || '');
            } catch (err) {
                console.error('Failed to load profile', err);
            }
        };

        fetchOrders();
        fetchProfile();
    }, [user]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMessage({ text: '', type: '' });

        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };

            const payload = {
                name,
                phone,
                address,
                city,
                postalCode,
                country,
            };

            if (password) {
                payload.password = password;
            }

            const { data } = await axios.put(`${API_BASE_URL}/api/users/profile`, payload, config);
            updateUser(data);
            setSavingProfile(false);
            setPassword('');
            setProfileMessage({ text: 'Profile information updated successfully!', type: 'success' });
        } catch (error) {
            setSavingProfile(false);
            setProfileMessage({
                text: error.response?.data?.message || 'Failed to update profile',
                type: 'error',
            });
        }
    };

    const handleMoveToCart = async (product) => {
        addToCart(product, 1);
        await toggleWishlist(product);
    };

    if (!user) {
        return null;
    }

    const activeOrders = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');

    // Visual Order Tracker Helper
    const getStageIndex = (status) => {
        switch (status) {
            case 'Pending':
                return 0;
            case 'Processing':
                return 1;
            case 'Shipped':
                return 2;
            case 'Delivered':
                return 3;
            default:
                return 0;
        }
    };

    const stages = [
        { label: 'Order Placed', icon: Package },
        { label: 'Processing', icon: Clock },
        { label: 'Out for Delivery', icon: Truck },
        { label: 'Delivered', icon: CheckCircle2 },
    ];

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Customer Greeting Header */}
                <div className="mb-8 overflow-hidden rounded-3xl bg-[#171717] p-6 text-white shadow-xl sm:p-8">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black text-white shadow-lg">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-black sm:text-3xl">
                                        Welcome, {user.name}
                                    </h1>
                                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-orange-400">
                                        Customer
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-400">{user.email}</p>
                            </div>
                        </div>

                        {/* Quick Stats Banner */}
                        <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 md:border-t-0 md:pt-0">
                            <div className="rounded-xl bg-white/5 p-3 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Total Orders
                                </p>
                                <p className="mt-1 text-xl font-black text-white">{orders.length}</p>
                            </div>

                            <div className="rounded-xl bg-white/5 p-3 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Active Orders
                                </p>
                                <p className="mt-1 text-xl font-black text-orange-400">
                                    {activeOrders.length}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/5 p-3 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Wishlist Items
                                </p>
                                <p className="mt-1 text-xl font-black text-rose-400">{wishlist.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                        <button
                            onClick={() => setSearchParams({ tab: 'orders' })}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                currentTab === 'orders'
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <ShoppingBag className="h-4 w-4" />
                            My Orders & Tracking ({orders.length})
                        </button>

                        <button
                            onClick={() => setSearchParams({ tab: 'wishlist' })}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                currentTab === 'wishlist'
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <Heart className="h-4 w-4" />
                            Saved Wishlist ({wishlist.length})
                        </button>

                        <button
                            onClick={() => setSearchParams({ tab: 'profile' })}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                currentTab === 'profile'
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <User className="h-4 w-4" />
                            Profile & Addresses
                        </button>
                    </div>
                </div>

                {/* TAB 1: ORDERS & LIVE TRACKER */}
                {currentTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Your Orders</h2>
                                <p className="text-xs text-gray-500">
                                    Real-time tracking and purchase history
                                </p>
                            </div>
                            <Link
                                to="/shop"
                                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline"
                            >
                                Continue Shopping <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        {loadingOrders ? (
                            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
                                <p className="mt-4 text-xs font-bold text-gray-500">
                                    Loading your shipments...
                                </p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-3xl">
                                    📦
                                </div>
                                <h3 className="mt-4 text-lg font-black text-gray-900">
                                    No Orders Placed Yet
                                </h3>
                                <p className="mx-auto mt-2 max-w-sm text-xs text-gray-500">
                                    You have not placed any orders yet. Browse our collections and discover something you love!
                                </p>
                                <Link
                                    to="/shop"
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                                >
                                    Browse Products
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {orders.map((order) => {
                                    const currentStageIndex = getStageIndex(order.status);

                                    return (
                                        <div
                                            key={order._id}
                                            className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                                        >
                                            {/* Order Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/70 p-5 sm:px-6">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                        Order ID
                                                    </span>
                                                    <p className="font-mono text-xs font-bold text-gray-900">
                                                        #{order._id}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-gray-500">
                                                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                                                            order.isPaid
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {order.isPaid ? 'Paid' : `Unpaid (${order.paymentMethod})`}
                                                    </span>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                            Total
                                                        </span>
                                                        <p className="text-base font-black text-gray-900">
                                                            ₹{order.totalPrice}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* VISUAL 4-STEP TRACKER */}
                                            <div className="border-b border-gray-100 bg-white p-6 sm:px-8">
                                                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                                                    Live Delivery Tracking
                                                </p>
                                                <div className="relative">
                                                    {/* Progress bar line */}
                                                    <div className="absolute left-6 right-6 top-5 -z-0 h-1 bg-gray-200 sm:left-10 sm:right-10">
                                                        <div
                                                            className="h-full bg-emerald-500 transition-all duration-500"
                                                            style={{
                                                                width: `${(currentStageIndex / 3) * 100}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Steps */}
                                                    <div className="relative z-10 flex justify-between">
                                                        {stages.map((stage, idx) => {
                                                            const isCompleted = idx <= currentStageIndex;
                                                            const isCurrent = idx === currentStageIndex;
                                                            const Icon = stage.icon;

                                                            return (
                                                                <div
                                                                    key={stage.label}
                                                                    className="flex flex-col items-center text-center"
                                                                >
                                                                    <div
                                                                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                                                                            isCompleted
                                                                                ? 'bg-emerald-500 text-white shadow-md'
                                                                                : 'border-2 border-gray-200 bg-white text-gray-400'
                                                                        } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                                                                    >
                                                                        <Icon className="h-5 w-5" />
                                                                    </div>
                                                                    <p
                                                                        className={`mt-2 text-[11px] font-bold ${
                                                                            isCompleted
                                                                                ? 'text-gray-900'
                                                                                : 'text-gray-400'
                                                                        }`}
                                                                    >
                                                                        {stage.label}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Products In Order */}
                                            <div className="divide-y divide-gray-100 p-5 sm:px-6">
                                                {order.orderItems.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between py-3"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="h-14 w-14 rounded-xl object-cover shadow-sm"
                                                            />
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">
                                                                    {item.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Qty: {item.qty} × ₹{item.price}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-black text-gray-900">
                                                            ₹{item.price * item.qty}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Shipping Address Footer */}
                                            <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/50 p-4 text-xs text-gray-600 sm:px-6">
                                                <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
                                                <span>
                                                    Delivering to: {order.shippingAddress.address},{' '}
                                                    {order.shippingAddress.city},{' '}
                                                    {order.shippingAddress.postalCode},{' '}
                                                    {order.shippingAddress.country}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: MY WISHLIST */}
                {currentTab === 'wishlist' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Saved Wishlist</h2>
                                <p className="text-xs text-gray-500">
                                    Products you love and plan to purchase
                                </p>
                            </div>
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">
                                {wishlist.length} Items Saved
                            </span>
                        </div>

                        {wishlist.length === 0 ? (
                            <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-3xl">
                                    ❤️
                                </div>
                                <h3 className="mt-4 text-lg font-black text-gray-900">
                                    Your Wishlist is Empty
                                </h3>
                                <p className="mx-auto mt-2 max-w-sm text-xs text-gray-500">
                                    Save your favorite items by tapping the heart icon on any product in our shop!
                                </p>
                                <Link
                                    to="/shop"
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                                >
                                    Explore Products
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {wishlist.map((item) => {
                                    const isOutOfStock =
                                        item.isOutOfStock ||
                                        (item.countInStock !== undefined && item.countInStock <= 0);

                                    return (
                                        <div
                                            key={item._id}
                                            className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                                        >
                                            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                                <button
                                                    onClick={() => toggleWishlist(item)}
                                                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm transition hover:bg-white"
                                                    title="Remove from Wishlist"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="mt-3 flex flex-1 flex-col">
                                                <span className="text-[10px] font-bold uppercase text-orange-600">
                                                    {item.category}
                                                </span>
                                                <h4 className="line-clamp-1 text-sm font-bold text-gray-900">
                                                    {item.name}
                                                </h4>
                                                <p className="mt-1 text-base font-black text-gray-900">
                                                    ₹{item.price}
                                                </p>

                                                <div className="mt-auto pt-4">
                                                    <button
                                                        onClick={() => handleMoveToCart(item)}
                                                        disabled={isOutOfStock}
                                                        className={`w-full rounded-xl py-2.5 text-xs font-bold transition ${
                                                            isOutOfStock
                                                                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                                                                : 'bg-orange-500 text-white shadow-sm hover:bg-orange-600'
                                                        }`}
                                                    >
                                                        {isOutOfStock ? 'Out of Stock' : 'Move to Cart →'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: PROFILE & ADDRESSES */}
                {currentTab === 'profile' && (
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-black text-gray-900">Customer Profile & Shipping Address</h2>
                            <p className="text-xs text-gray-500">
                                Manage your contact details and default delivery address for instant 1-click checkout
                            </p>
                        </div>

                        {profileMessage.text && (
                            <div
                                className={`mb-6 rounded-xl p-4 text-xs font-bold ${
                                    profileMessage.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-rose-50 text-rose-700'
                                }`}
                            >
                                {profileMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+91 9876543210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                            </div>

                            {/* Delivery Address Section */}
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="mb-4 text-sm font-black text-gray-900">Default Shipping Address</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                            Street Address / Flat No
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 102 Green Heights, M.G. Road"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Mumbai"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                                Postal Code / PIN
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="400001"
                                                value={postalCode}
                                                onChange={(e) => setPostalCode(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="India"
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Password Update */}
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="mb-4 text-sm font-black text-gray-900">Update Password (Optional)</h3>
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-700">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Leave blank to keep current password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="rounded-xl bg-orange-500 px-8 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
                            >
                                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDashboard;
