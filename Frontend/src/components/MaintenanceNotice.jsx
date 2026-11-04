import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

const MaintenanceNotice = ({ message }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 p-6 text-white">
            <div className="w-full max-w-lg rounded-3xl border border-gray-800 bg-[#171717] p-8 text-center shadow-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/30 mb-6">
                    <AlertTriangle className="h-8 w-8 animate-pulse" />
                </div>

                <span className="inline-block rounded-full bg-orange-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-orange-400">
                    Scheduled Store Maintenance
                </span>

                <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                    We'll Be Right Back!
                </h1>

                <p className="mt-3 text-sm text-gray-400 leading-relaxed font-medium">
                    {message || 'We are performing scheduled improvements and database enhancements to bring you a faster and smoother shopping experience. DropCart will return shortly!'}
                </p>

                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Estimated Completion: Today</span>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-black text-gray-900 shadow-md hover:bg-gray-100 transition"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Check Store Status</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceNotice;
