import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Package, Flame, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ToastNotification = () => {
    const { notifications } = useSocket() || {};
    const [currentToast, setCurrentToast] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (notifications && notifications.length > 0) {
            const latest = notifications[0];
            // Only trigger toast for items within the last 10 seconds
            setCurrentToast(latest);
            const timer = setTimeout(() => {
                setCurrentToast(null);
            }, 5500);
            return () => clearTimeout(timer);
        }
    }, [notifications]);

    if (!currentToast) return null;

    const getIcon = () => {
        switch (currentToast.type) {
            case 'order':
                return <Package className="w-5 h-5 text-blue-600" />;
            case 'price_drop':
                return <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />;
            case 'low_stock':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            default:
                return <Package className="w-5 h-5 text-gray-600" />;
        }
    };

    return (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-4 shadow-2xl flex items-start gap-3 relative">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 shadow-2xs">
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                    <p className="text-xs font-black text-gray-900 truncate">{currentToast.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-snug">{currentToast.message}</p>
                    <span className="block text-[10px] text-gray-400 mt-1">{currentToast.time}</span>
                </div>

                <button
                    onClick={() => setCurrentToast(null)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1 rounded-lg transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ToastNotification;
