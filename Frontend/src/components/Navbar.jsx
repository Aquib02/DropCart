import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const logoutHandler = () => {
        logout();
        navigate('/login');
    };

    const isAdminPage = location.pathname === '/admin';

    // User ke naam ka pehla letter nikalne ke liye (Avatar ke liye)
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between">

                {/* Logo */}
                <Link
                    to="/"
                    className="group flex items-center gap-2"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#171717] transition-transform duration-200 group-hover:scale-105">
                        <svg
                            viewBox="0 0 64 64"
                            className="h-7 w-7"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Cart handle */}
                            <path
                                d="M10 14H15L19 38C19.5 41 22 43 25 43H48"
                                stroke="#F97316"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Cart basket */}
                            <path
                                d="M17 19H53L48 37H21L17 19Z"
                                stroke="#E5E7EB"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Basket grid */}
                            <path
                                d="M25 20L27 36M33 20V36M41 20V36M49 20L46 36"
                                stroke="#9CA3AF"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />

                            {/* Bottom bar */}
                            <path
                                d="M24 43H48"
                                stroke="#E5E7EB"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            {/* Wheels */}
                            <circle
                                cx="27"
                                cy="50"
                                r="4"
                                fill="#171717"
                                stroke="#F97316"
                                strokeWidth="2.5"
                            />

                            <circle
                                cx="45"
                                cy="50"
                                r="4"
                                fill="#171717"
                                stroke="#F97316"
                                strokeWidth="2.5"
                            />
                        </svg>
                    </span>

                    <span className="text-xl font-black tracking-tight text-gray-900">
                        Drop<span className="text-orange-500">Cart</span>
                    </span>
                </Link>

                <div className="flex items-center gap-1 sm:gap-2">
                    {!isAdminPage && (
                        <>
                            <Link
                                to="/"
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                    location.pathname === '/'
                                        ? 'bg-orange-50 text-orange-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-orange-600'
                                }`}
                            >
                                Home
                            </Link>

                            <Link
                                to="/shop"
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                    location.pathname === '/shop'
                                        ? 'bg-orange-50 text-orange-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-orange-600'
                                }`}
                            >
                                Shop
                            </Link>

                            <Link
                                to="/cart"
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                    location.pathname === '/cart'
                                        ? 'bg-orange-50 text-orange-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-orange-600'
                                }`}
                            >
                                Cart
                            </Link>
                        </>
                    )}

                    {user ? (
                        <div className="relative ml-1">
                            {/* Profile Button */}
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] text-sm font-bold text-orange-500 shadow-sm transition-all duration-200 hover:bg-black hover:ring-4 hover:ring-orange-100 focus:outline-none"
                            >
                                {initial}
                            </button>

                            {/* Dropdown */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                                    <div className="border-b border-gray-100 bg-[#171717] px-4 py-4">
                                        <p className="text-xs text-gray-400">
                                            Signed in as
                                        </p>

                                        <p className="mt-1 truncate text-sm font-bold text-white">
                                            {user.name}
                                        </p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                                    >
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                            👤
                                        </span>
                                        My Profile
                                    </Link>

                                    <Link
                                        to="/my-orders"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                                    >
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                            📦
                                        </span>
                                        My Orders
                                    </Link>

                                    <div className="border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                logoutHandler();
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                                        >
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                                                ↪
                                            </span>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="ml-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;