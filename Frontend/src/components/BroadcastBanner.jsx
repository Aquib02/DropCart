import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, X, ArrowRight, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const BroadcastBanner = () => {
    const { socket } = useSocket();
    const [broadcast, setBroadcast] = useState(null);

    useEffect(() => {
        if (!socket) return;

        const handleBroadcast = (data) => {
            if (data && data.title) {
                setBroadcast(data);
            }
        };

        socket.on('storeBroadcast', handleBroadcast);
        return () => socket.off('storeBroadcast', handleBroadcast);
    }, [socket]);

    if (!broadcast) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 max-w-sm rounded-3xl bg-gradient-to-r from-orange-600 via-rose-600 to-purple-600 p-4 text-white shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-white">
                        <Sparkles className="h-4 w-4 animate-spin" />
                    </span>
                    <div>
                        <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-xs">
                            {broadcast.badge || 'Store Alert'}
                        </span>
                        <h4 className="mt-1 text-xs font-black leading-tight">
                            {broadcast.title}
                        </h4>
                    </div>
                </div>

                <button
                    onClick={() => setBroadcast(null)}
                    className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white transition"
                    title="Dismiss"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            <p className="mt-2 text-[11px] text-white/90 leading-relaxed font-medium">
                {broadcast.message}
            </p>

            {broadcast.link && (
                <div className="mt-3 flex justify-end">
                    <Link
                        to={broadcast.link}
                        onClick={() => setBroadcast(null)}
                        className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[11px] font-black text-gray-900 shadow-sm hover:bg-gray-100 transition"
                    >
                        <span>Check Deals</span>
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            )}
        </div>
    );
};

export default BroadcastBanner;
