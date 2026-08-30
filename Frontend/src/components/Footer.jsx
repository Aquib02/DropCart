const Footer = () => {
    return (
        <footer className="mt-auto border-t border-gray-800 bg-[#171717] text-white">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
                    <div>
                        <div className="flex items-center justify-center gap-2 sm:justify-start">

                            {/* Logo */}
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f0f0f]">
                                <svg
                                    viewBox="0 0 64 64"
                                    className="h-6 w-6"
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

                            <p className="text-xl font-extrabold">
                                Drop<span className="text-orange-500">Cart</span>
                            </p>
                        </div>

                        <p className="mt-3 text-sm text-gray-400">
                            Your everyday shopping destination.
                        </p>
                    </div>

                    <div className="text-sm text-gray-500">
                        <p>
                            &copy; {new Date().getFullYear()} All rights reserved.
                        </p>

                        <p className="mt-1">
                            Built with MERN Stack
                        </p>
                    </div>
                </div>

                <div className="mt-8 h-px bg-gray-800" />

                <p className="mt-6 text-center text-xs text-gray-600">
                    Made with <span className="text-orange-500">♥</span> for a better shopping experience
                </p>
            </div>
        </footer>
    );
};

export default Footer;