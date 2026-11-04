import { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Phone, MapPin, ShieldCheck, Share2, Globe } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Footer = () => {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/settings`)
            .then(res => {
                if (res.data) setSettings(res.data);
            })
            .catch(() => {});
    }, []);

    const contact = settings?.contact || {
        supportEmail: 'support@dropcart.in',
        supportPhone: '+91 1800-202-9898',
        physicalAddress: 'DropCart Towers, 4th Block, Koramangala, Bangalore - 560034, India'
    };

    const tax = settings?.tax || {
        legalBusinessName: 'DropCart Retail Technologies Pvt Ltd',
        gstinNumber: '29AABCT1332L1ZV'
    };

    const social = settings?.socialLinks || {};

    return (
        <footer className="mt-auto border-t border-gray-800 bg-[#171717] text-white">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    {/* Col 1: Store Brand & Identity */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f0f0f]">
                                <svg
                                    viewBox="0 0 64 64"
                                    className="h-6 w-6"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M10 14H15L19 38C19.5 41 22 43 25 43H48"
                                        stroke="#F97316"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M17 19H53L48 37H21L17 19Z"
                                        stroke="#E5E7EB"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <circle cx="27" cy="50" r="4" fill="#171717" stroke="#F97316" strokeWidth="2.5" />
                                    <circle cx="45" cy="50" r="4" fill="#171717" stroke="#F97316" strokeWidth="2.5" />
                                </svg>
                            </span>
                            <p className="text-xl font-extrabold">
                                Drop<span className="text-orange-500">Cart</span>
                            </p>
                        </div>
                        <p className="mt-3 text-xs text-gray-400 leading-relaxed font-medium">
                            {settings?.tagline || 'India’s favorite online shopping destination for electronics, mobiles, and fashion essentials.'}
                        </p>

                        <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
                            <ShieldCheck className="h-4 w-4" />
                            <span>100% Genuine & Verified Products</span>
                        </div>
                    </div>

                    {/* Col 2: Customer Care & Helpline */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-300">Customer Support</h4>
                        <ul className="mt-3 space-y-2 text-xs text-gray-400">
                            <li className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                <span>{contact.supportPhone}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                <span className="truncate">{contact.supportEmail}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{contact.physicalAddress}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Col 3: Legal & GST Invoicing */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-300">Corporate & Invoicing</h4>
                        <div className="mt-3 space-y-1.5 text-xs text-gray-400">
                            <p className="font-bold text-gray-200">{tax.legalBusinessName}</p>
                            <p className="font-mono text-[11px]">GSTIN: {tax.gstinNumber}</p>
                            <p className="text-[11px] text-gray-500">Authorized GST Tax Invoicing Entity</p>
                        </div>
                    </div>

                    {/* Col 4: Social Channels & Policies */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-300">Connect With Us</h4>
                        <p className="mt-3 text-xs text-gray-400">Follow our social channels for flash deals and new arrivals:</p>
                        <div className="mt-3 flex items-center gap-2.5">
                            {social.instagram && (
                                <a
                                    href={social.instagram}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-orange-600 transition"
                                    title="Instagram"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                    </svg>
                                </a>
                            )}
                            {social.facebook && (
                                <a
                                    href={social.facebook}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-orange-600 transition"
                                    title="Facebook"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                                    </svg>
                                </a>
                            )}
                            {social.twitter && (
                                <a
                                    href={social.twitter}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-orange-600 transition"
                                    title="X / Twitter"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                </a>
                            )}
                            {social.youtube && (
                                <a
                                    href={social.youtube}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-orange-600 transition"
                                    title="YouTube"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-10 h-px bg-gray-800" />

                <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs text-gray-500 sm:flex-row">
                    <p>&copy; {new Date().getFullYear()} DropCart Enterprise E-Commerce. All rights reserved.</p>
                    <p className="text-gray-600">Enterprise MERN Architecture • Socket.IO Real-Time Sync • Razorpay Gateway</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
