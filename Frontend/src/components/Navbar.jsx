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
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { API_BASE_URL } from '../config';

const Navbar = () => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const { totalCount } = useContext(CartContext);
    const { wishlistCount } = useContext(WishlistContext);
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [announcement, setAnnouncement] = useState('');
    const [bannerActive, setBannerActive] = useState(true);

    // Location selector state
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [pincode, setPincode] = useState(user?.deliveryPincode || '400001');
    const [city, setCity] = useState(user?.deliveryCity || 'Mumbai');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/settings`);
                if (data && data.bannerActive) {
                    setAnnouncement(data.announcement);
                    setBannerActive(true);
                }
            } catch {
                setBannerActive(false);
            }
        };
        fetchSettings();
    }, []);

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

            {/* Main Flipkart-Style Navbar */}
            <nav className="border-b border-gray-100 bg-white px-4 py-2.5 sm:px-6">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-6">
                    {/* Brand Logo & Flipkart/Travel Pill Switches */}
                    <div className="flex items-center gap-3">
                        <Link to="/" className="group flex items-center gap-2">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 font-black text-gray-950 shadow-sm transition-transform group-hover:scale-105">
                                🛍️
                            </span>
                            <div className="leading-tight">
                                <span className="text-xl font-black italic tracking-tight text-blue-600">
                                    Drop<span className="text-amber-500">Cart</span>
                                </span>
                                <span className="block text-[9px] font-black italic tracking-widest text-gray-400">
                                    Explore <span className="text-amber-500 font-bold">Plus ✦</span>
                                </span>
                            </div>
                        </Link>

                        {/* Travel Quick Switch (Matching Screenshot) */}
                        <Link
                            to="/shop?category=Electronics"
                            className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-orange-50 hover:text-orange-600 md:flex"
                        >
                            <Plane className="h-3.5 w-3.5 text-orange-500" />
                            <span>Travel & Flights</span>
                        </Link>
                    </div>

                    {/* Search Bar (Prominent, matching screenshot) */}
                    <form
                        onSubmit={searchHandler}
                        className="flex flex-1 max-w-xl items-center rounded-2xl border border-blue-500/30 bg-blue-50/30 px-3.5 py-2 text-xs transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100"
                    >
                        <Search className="mr-2.5 h-4 w-4 shrink-0 text-blue-500" />
                        <input
                            type="text"
                            placeholder="Search for Products, Brands and More"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-500 outline-none"
                        />
                    </form>

                    {/* Delivery Location Selector (Matching Screenshot) */}
                    <button
                        onClick={() => setShowLocationModal(true)}
                        className="hidden items-center gap-1.5 text-left text-xs font-semibold text-gray-700 transition hover:text-blue-600 lg:flex"
                    >
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <div>
                            <span className="block text-[10px] text-gray-400">Deliver to</span>
                            <span className="font-bold text-gray-900">
                                {city} {pincode}
                            </span>
                        </div>
                    </button>

                    {/* SuperCoins Badge (Matching Screenshot) */}
                    <div className="hidden items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-black text-amber-700 sm:flex">
                        <Coins className="h-3.5 w-3.5 text-amber-500 fill-current" />
                        <span>{userCoins}</span>
                    </div>

                    {/* Right Nav Actions: User Account, Wishlist, Cart */}
                    <div className="flex items-center gap-2 sm:gap-3">
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

                        {/* Cart Button with Count Badge (Matching Screenshot) */}
                        <Link
                            to="/cart"
                            className="flex items-center gap-2 rounded-xl bg-blue-50/50 px-3 py-2 text-xs font-bold text-gray-800 transition hover:bg-blue-100/60"
                        >
                            <div className="relative">
                                <ShoppingBag className="h-5 w-5 text-blue-600" />
                                {totalCount > 0 && (
                                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white shadow-sm">
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
        </header>
    );
};

export default Navbar;
