import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { X, Sparkles, ArrowRight, Tag } from 'lucide-react';
import { API_BASE_URL } from '../config';

const PromotionalPopup = () => {
    const [popup, setPopup] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const fetchPopup = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/campaigns?type=popup`);
                if (Array.isArray(data) && data.length > 0) {
                    const activePopup = data[0]; // Highest priority active popup
                    const dismissedKey = `dismissed_popup_${activePopup._id}`;

                    if (activePopup.popupConfig?.frequency === 'once_per_session') {
                        if (sessionStorage.getItem(dismissedKey)) return;
                    } else if (activePopup.popupConfig?.frequency === 'once_per_day') {
                        const dismissedDate = localStorage.getItem(dismissedKey);
                        if (dismissedDate) {
                            const diffHours = (Date.now() - Number(dismissedDate)) / (1000 * 60 * 60);
                            if (diffHours < 24) return;
                        }
                    }

                    setPopup(activePopup);

                    const delay = (activePopup.popupConfig?.delaySeconds || 2) * 1000;
                    const timer = setTimeout(() => {
                        setVisible(true);
                        // Record impression
                        axios.post(`${API_BASE_URL}/api/campaigns/${activePopup._id}/impression`, {}).catch(() => {});
                    }, delay);

                    return () => clearTimeout(timer);
                }
            } catch {
                // Ignore popup error
            }
        };

        fetchPopup();
    }, []);

    const handleDismiss = () => {
        setVisible(false);
        if (popup) {
            const dismissedKey = `dismissed_popup_${popup._id}`;
            sessionStorage.setItem(dismissedKey, 'true');
            localStorage.setItem(dismissedKey, Date.now().toString());
        }
    };

    const handleClick = () => {
        if (popup) {
            axios.post(`${API_BASE_URL}/api/campaigns/${popup._id}/click`, {}).catch(() => {});
            handleDismiss();
        }
    };

    if (!popup || !visible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100">
                {/* Dismiss button */}
                <button
                    onClick={handleDismiss}
                    className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/75 hover:scale-105"
                    title="Close promotion"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Banner Visual Cover */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-900 sm:h-56">
                    <img
                        src={popup.desktopImage}
                        alt={popup.title}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
                    {popup.badge && (
                        <span className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full bg-orange-500/90 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                            <Sparkles className="h-3 w-3" /> {popup.badge}
                        </span>
                    )}
                </div>

                {/* Content & Action */}
                <div className="p-6 text-center sm:p-8">
                    <h3 className="text-xl font-black text-gray-900 sm:text-2xl leading-tight">
                        {popup.title}
                    </h3>

                    {popup.subtitle && (
                        <p className="mt-2 text-xs sm:text-sm font-medium text-gray-600 max-w-md mx-auto leading-relaxed">
                            {popup.subtitle}
                        </p>
                    )}

                    {popup.offerText && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-orange-50 border border-orange-200/80 px-4 py-2 text-xs font-black text-orange-800">
                            <Tag className="h-3.5 w-3.5 text-orange-600" />
                            {popup.offerText}
                        </div>
                    )}

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to={popup.ctaLink || '/shop'}
                            onClick={handleClick}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-7 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 transition hover:scale-105 active:scale-95"
                        >
                            {popup.ctaText || 'Claim Offer'} <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                            onClick={handleDismiss}
                            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition"
                        >
                            No thanks, continue browsing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromotionalPopup;