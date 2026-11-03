import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    ShoppingBag,
    Heart,
    Search,
    User as UserIcon,
    ShieldCheck,
    LogOut,
    ChevronDown,
    MapPin,
    Coins,
    Plane,
    X,
    Sparkles,
    Scale,
    Bell,
    Camera,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { CompareContext } from '../context/CompareContext';
import { useSocket } from '../context/SocketContext';
import VisualSearchModal from './VisualSearchModal';
import { API_BASE_URL } from '../config';

const Navbar = () => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const { totalCount } = useContext(CartContext);
    const { wishlistCount } = useContext(WishlistContext);
    const { compareItems, setIsCompareModalOpen } = useContext(CompareContext) || { compareItems: [] };
    const { socket, notifications = [], unreadCount = 0, markAllAsRead, clearNotifications } = useSocket() || {};
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [showVisualSearch, setShowVisualSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [bannerActive, setBannerActive] = useState(true);

    // Location selector state
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [pincode, setPincode] = useState(user?.deliveryPincode || '400001');
    const [city, setCity] = useState(user?.deliveryCity || 'Mumbai');

    // Debounced search suggestions
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSuggestions({ products: [], categories: [] });
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const { data } = await axios.get(
                    `${API_BASE_URL}/api/products/suggestions?q=${encodeURIComponent(searchQuery.trim())}`
                );
                setSuggestions(data || { products: [], categories: [] });
                setShowSuggestions(true);
            } catch {
                setSuggestions({ products: [], categories: [] });
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/settings`);
                if (data) {
                    setAnnouncement(data.announcement || '');
                    setBannerActive(data.bannerActive !== undefined ? data.bannerActive : true);
                }
            } catch {
                setBannerActive(false);
            }
        };
        fetchSettings();
    }, []);

    // Real-Time Socket.IO: Live update when admin publishes announcement or banner changes
    useEffect(() => {
        if (!socket) return;
        const handleSettingsUpdate = (data) => {
            if (data) {
                if (data.announcement !== undefined) setAnnouncement(data.announcement);
                if (data.bannerActive !== undefined) setBannerActive(data.bannerActive);
            }
        };
        socket.on('settingsUpdated', handleSettingsUpdate);
        return () => socket.off('settingsUpdated', handleSettingsUpdate);
    }, [socket]);

    const logoutHandler = () => {
        setDropdownOpen(false);
        logout();
        navigate('/login');
    };

    const searchHandler = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?keyword=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/shop');
        }
    };

    const handleSaveLocation = (e) => {
        e.preventDefault();
        if (user) {
            updateUser({ deliveryPincode: pincode, deliveryCity: city });
        }
        setShowLocationModal(false);
    };

    const isStaffOrAdmin = user && (user.isAdmin || user.role === 'admin' || user.role === 'staff');
    const userCoins = user?.coins !== undefined ? user.coins : 50;

    return (
        <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
            {/* Top Festive Announcement Bar */}
            {bannerActive && announcement && (
                <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 px-4 py-1.5 text-center text-xs font-bold text-white shadow-sm">
                    <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse text-amber-200" />
                        <span className="truncate">{announcement}</span>
                    </div>
                </div>
            )}

            {/* Main Modern DropCart Navbar */}
            <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-6">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3">
                        <Link to="/" className="group flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black shadow-md shadow-orange-500/20 transition-transform group-hover:scale-105">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <div className="leading-none">
                                <span className="text-xl font-black tracking-tight text-gray-900">
                                    Drop<span className="text-orange-500">Cart</span>
                                </span>
                                <span className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
                                    AI STORE
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Search Bar with Live Suggestions Dropdown */}
                    <div className="relative flex-1 max-w-xl">
                        <form
                            onSubmit={searchHandler}
                            className="flex items-center rounded-2xl border border-gray-200 bg-gray-50/80 px-3.5 py-2 text-xs transition focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/10"
                        >
                            <Search className="mr-2.5 h-4 w-4 shrink-0 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products, brands, categories..."
                                value={searchQuery}
                                onFocus={() => suggestions.products.length > 0 && setShowSuggestions(true)}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-500 outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setShowSuggestions(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}

                            {/* AI Visual Search Button */}
                            <button
                                type="button"
                                onClick={() => setShowVisualSearch(true)}
                                className="ml-1 p-1 text-gray-400 hover:text-amber-600 transition"
                                title="Visual Search with Image"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </form>

                        {/* Floating Live Autocomplete Dropdown */}
                        {showSuggestions && (suggestions.products.length > 0 || suggestions.categories.length > 0) && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                                {/* Categories quick pills */}
                                {suggestions.categories.length > 0 && (
                                    <div className="border-b border-gray-100 bg-gray-50/70 px-3 py-2">
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Categories</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {suggestions.categories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => {
                                                        setShowSuggestions(false);
                                                        setSearchQuery('');
                                                        navigate(`/shop?category=${encodeURIComponent(cat)}`);
                                                    }}
                                                    className="rounded-lg bg-white border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition"
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Matching Products */}
                                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 p-1">
                                    {suggestions.products.map((item) => (
                                        <div
                                            key={item._id}
                                            onClick={() => {
                                                setShowSuggestions(false);
                                                setSearchQuery('');
                                                navigate(`/product/${item._id}`);
                                            }}
                                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/50 cursor-pointer transition"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-9 w-9 rounded-lg object-contain bg-gray-50 p-0.5 border border-gray-100"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                                                <p className="text-[10px] text-gray-400">{item.brand || item.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-gray-950">₹{item.price.toLocaleString('en-IN')}</span>
                                                {item.discountPercent > 0 && (
                                                    <span className="block text-[9px] font-bold text-emerald-600">
                                                        {item.discountPercent}% off
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSuggestions(false);
                                        navigate(`/shop?keyword=${encodeURIComponent(searchQuery)}`);
                                    }}
                                    className="w-full border-t border-gray-100 bg-gray-50/80 py-2 text-center text-xs font-bold text-blue-600 hover:bg-gray-100 transition"
                                >
                                    See all results for &ldquo;{searchQuery}&rdquo; →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Delivery Location Selector (Matching Screenshot) */}
                    <button
                        onClick={() => setShowLocationModal(true)}
                        className="hidden items-center gap-1.5 text-left text-xs font-semibold text-gray-700 transition hover:text-orange-600 lg:flex"
                    >
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <div>
                            <span className="block text-[10px] text-gray-400">Deliver to</span>
                            <span className="font-bold text-gray-900">
                                {city} {pincode}
                            </span>
                        </div>
                    </button>

                    {/* Right Nav Actions: User Account, Compare, Wishlist, Cart */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Compare Icon Button */}
                        {setIsCompareModalOpen && (
                            <button
                                onClick={() => setIsCompareModalOpen(true)}
                                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 hover:text-blue-600"
                                title="Compare Products"
                            >
                                <Scale className="h-5 w-5" />
                                {compareItems && compareItems.length > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white shadow-sm">
                                        {compareItems.length}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Wishlist Icon */}
                        <Link
                            to={user ? '/customer/dashboard?tab=wishlist' : '/login?redirect=customer/dashboard'}
                            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 hover:text-rose-600"
                            title="My Wishlist"
                        >
                            <Heart className="h-5 w-5" />
                            {wishlistCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-sm">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Real-Time Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setNotifOpen(!notifOpen);
                                    if (unreadCount > 0 && markAllAsRead) markAllAsRead();
                                }}
                                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 hover:text-amber-600"
                                title="Live Notifications"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white shadow-sm animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                            <span>Live Alerts</span>
                                            {notifications.length > 0 && (
                                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-black">
                                                    {notifications.length}
                                                </span>
                                            )}
                                        </h4>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={clearNotifications}
                                                className="text-[10px] text-gray-400 hover:text-red-500 font-semibold"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                        {notifications.length === 0 ? (
                                            <div className="py-6 text-center text-xs text-gray-400">
                                                No new notifications
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    className="p-2.5 rounded-xl bg-gray-50 hover:bg-amber-50/60 border border-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold text-gray-900">{n.title}</span>
                                                        <span className="text-[9px] text-gray-400">{n.time}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-600 mt-1 leading-snug">{n.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cart Button */}
                        <Link
                            to="/cart"
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3.5 py-2 text-xs font-bold shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition hover:scale-105 active:scale-95"
                        >
                            <div className="relative">
                                <ShoppingBag className="h-4 w-4" />
                                {totalCount > 0 && (
                                    <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white text-orange-600 px-1 text-[9px] font-black shadow-sm">
                                        {totalCount}
                                    </span>
                                )}
                            </div>
                            <span className="hidden font-bold sm:inline">Cart</span>
                        </Link>

                        {/* User Account Dropdown */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 transition hover:bg-gray-50 focus:outline-none"
                                >
                                    <UserIcon className="h-4 w-4 text-gray-500" />
                                    <span className="max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5">
                                        <div className="border-b border-gray-100 bg-[#171717] p-4 text-white">
                                            <div className="flex items-center justify-between">
                                                <p className="truncate text-sm font-bold">{user.name}</p>
                                                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-gray-950">
                                                    {user.isAdmin ? 'Admin' : user.role === 'staff' ? 'Staff' : 'Customer'}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-xs text-gray-400">{user.email}</p>
                                        </div>

                                        <div className="p-2 text-xs text-gray-700">
                                            {isStaffOrAdmin && (
                                                <Link
                                                    to="/admin/dashboard"
                                                    onClick={() => setDropdownOpen(false)}
                                                    className="mb-1 flex items-center gap-2.5 rounded-xl bg-orange-50 px-3 py-2.5 font-bold text-orange-700 transition hover:bg-orange-100"
                                                >
                                                    <ShieldCheck className="h-4 w-4" />
                                                    Admin Control Hub
                                                </Link>
                                            )}

                                            <Link
                                                to="/customer/dashboard"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition hover:bg-gray-100"
                                            >
                                                <UserIcon className="h-4 w-4 text-gray-400" />
                                                Customer Profile
                                            </Link>

                                            <Link
                                                to="/customer/dashboard?tab=orders"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition hover:bg-gray-100"
                                            >
                                                <ShoppingBag className="h-4 w-4 text-gray-400" />
                                                Orders & Live Tracker
                                            </Link>

                                            <Link
                                                to="/customer/dashboard?tab=wishlist"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition hover:bg-gray-100"
                                            >
                                                <Heart className="h-4 w-4 text-gray-400" />
                                                Wishlist ({wishlistCount})
                                            </Link>
                                        </div>

                                        <div className="border-t border-gray-100 p-2">
                                            <button
                                                onClick={logoutHandler}
                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-700"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Delivery Location Pincode Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-black text-gray-900">Select Delivery Location</h3>
                            <button
                                onClick={() => setShowLocationModal(false)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLocation} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-gray-700">Enter City</label>
                                <input
                                    type="text"
                                    required
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white"
                                    placeholder="e.g. Bengaluru, Mumbai, Delhi"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-gray-700">6-Digit Pincode</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white"
                                    placeholder="e.g. 560001"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                            >
                                Set Location
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Visual Search Modal */}
            <VisualSearchModal
                isOpen={showVisualSearch}
                onClose={() => setShowVisualSearch(false)}
            />
        </header>
    );
};

export default Navbar;
