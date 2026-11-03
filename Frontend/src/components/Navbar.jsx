import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShoppingBag, Heart, Search, User, ShieldCheck, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { API_BASE_URL } from '../config';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { totalCount } = useContext(CartContext);
    const { wishlistCount } = useContext(WishlistContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [announcement, setAnnouncement] = useState('');
    const [bannerActive, setBannerActive] = useState(false);

    // Fetch store appearance settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/settings`);
                if (data && data.bannerActive) {
                    setAnnouncement(data.announcement);
                    setBannerActive(true);
                }
            } catch {
                // Fallback gracefully
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

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
    const isStaffOrAdmin = user && (user.isAdmin || user.role === 'admin' || user.role === 'staff');

    return (
        <header className="sticky top-0 z-50 w-full bg-white shadow-sm transition-all duration-200">
            {/* Top Announcement Bar */}
            {bannerActive && announcement && (
                <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 px-4 py-1.5 text-center text-xs font-semibold text-white">
                    <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse text-amber-200" />
                        <span className="truncate">{announcement}</span>
                    </div>
                </div>
            )}

            {/* Main Navbar */}
            <nav className="border-b border-gray-100 px-4 py-3 sm:px-6">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                    {/* Brand Logo */}
                    <Link to="/" className="group flex items-center gap-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171717] text-white shadow-md transition-transform duration-200 group-hover:scale-105">
                            <ShoppingBag className="h-5 w-5 text-orange-500" />
                        </span>
                        <span className="text-xl font-black tracking-tight text-gray-900">
                            Drop<span className="text-orange-500">Cart</span>
                        </span>
                    </Link>

                    {/* Search Bar */}
                    <form
                        onSubmit={searchHandler}
                        className="hidden flex-1 max-w-md items-center rounded-full border border-gray-200 bg-gray-50/80 px-4 py-2 text-sm transition focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 md:flex"
                    >
                        <Search className="mr-2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products, brands, essentials..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                        />
                    </form>

                    {/* Nav Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            to="/shop"
                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                location.pathname === '/shop'
                                    ? 'bg-orange-50 text-orange-600'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-orange-600'
                            }`}
                        >
                            Shop
                        </Link>

                        {/* Customer Dashboard / Wishlist Link */}
                        <Link
                            to={user ? '/customer/dashboard?tab=wishlist' : '/login?redirect=customer/dashboard'}
                            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-orange-600"
                            title="My Wishlist"
                        >
                            <Heart className="h-5 w-5" />
                            {wishlistCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Cart Button */}
                        <Link
                            to="/cart"
                            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-orange-600"
                            title="Shopping Cart"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {totalCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white shadow">
                                    {totalCount}
                                </span>
                            )}
                        </Link>

                        {/* User Account Controls */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1 pr-2.5 transition hover:bg-gray-100 focus:outline-none"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-xs font-bold text-orange-400">
                                        {initial}
                                    </span>
                                    <span className="hidden max-w-[100px] truncate text-xs font-bold text-gray-800 sm:block">
                                        {user.name.split(' ')[0]}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                </button>

                                {/* Dropdown Menu */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5">
                                        {/* User Info Header */}
                                        <div className="border-b border-gray-100 bg-[#171717] p-4 text-white">
                                            <div className="flex items-center justify-between">
                                                <p className="truncate text-sm font-bold">{user.name}</p>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                        user.isAdmin || user.role === 'admin'
                                                            ? 'bg-orange-500 text-white'
                                                            : user.role === 'staff'
                                                            ? 'bg-amber-400 text-gray-900'
                                                            : 'bg-white/20 text-gray-200'
                                                    }`}
                                                >
                                                    {user.isAdmin || user.role === 'admin'
                                                        ? 'Admin'
                                                        : user.role === 'staff'
                                                        ? 'Staff'
                                                        : 'Customer'}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-xs text-gray-400">{user.email}</p>
                                        </div>

                                        {/* Links */}
                                        <div className="p-2 text-sm text-gray-700">
                                            {/* Staff / Admin Dashboard Link */}
                                            {isStaffOrAdmin && (
                                                <Link
                                                    to="/admin/dashboard"
                                                    onClick={() => setDropdownOpen(false)}
                                                    className="mb-1 flex items-center gap-2.5 rounded-xl bg-orange-500/10 px-3 py-2.5 font-bold text-orange-600 transition hover:bg-orange-500 hover:text-white"
                                                >
                                                    <ShieldCheck className="h-4 w-4" />
                                                    Admin Control Hub
                                                </Link>
                                            )}

                                            {/* Customer Dashboard Link */}
                                            <Link
                                                to="/customer/dashboard"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition hover:bg-gray-100 hover:text-orange-600"
                                            >
                                                <User className="h-4 w-4 text-gray-400" />
                                                Customer Dashboard
                                            </Link>

                                            <Link
                                                to="/customer/dashboard?tab=orders"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition hover:bg-gray-100 hover:text-orange-600"
                                            >
                                                <ShoppingBag className="h-4 w-4 text-gray-400" />
                                                My Orders & Tracking
                                            </Link>

                                            <Link
                                                to="/customer/dashboard?tab=wishlist"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition hover:bg-gray-100 hover:text-orange-600"
                                            >
                                                <Heart className="h-4 w-4 text-gray-400" />
                                                My Wishlist
                                                {wishlistCount > 0 && (
                                                    <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                                        {wishlistCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </div>

                                        {/* Logout Button */}
                                        <div className="border-t border-gray-100 p-2">
                                            <button
                                                onClick={logoutHandler}
                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="rounded-lg px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-orange-600"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
