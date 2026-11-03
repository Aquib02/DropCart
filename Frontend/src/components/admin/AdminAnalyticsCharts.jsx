import { BarChart3, TrendingUp, Award, Layers } from 'lucide-react';

const AdminAnalyticsCharts = ({ stats }) => {
    if (!stats) return null;

    const weeklySales = stats.weeklySales || [];
    const monthlySales = stats.monthlySales || [];
    const topProducts = stats.topProducts || [];
    const categorySales = stats.categorySales || {};

    // Find highest revenue day for scaling bar heights
    const maxDayRevenue = Math.max(...weeklySales.map((d) => d.revenue), 1000);
    const categoryEntries = Object.entries(categorySales);
    const totalCatRevenue = categoryEntries.reduce((sum, [, val]) => sum + val, 0) || 1;

    return (
        <div className="space-y-6">
            {/* ROW 1: 7-Day Revenue Bar Chart & Monthly Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 7-Day Interactive Daily Revenue Bar Chart (7 cols) */}
                <div className="lg:col-span-7 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                <BarChart3 className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">7-Day Revenue Trend</h3>
                                <p className="text-[11px] text-gray-500">Daily earnings and completed checkout volume</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                            Live Performance
                        </span>
                    </div>

                    <div className="mt-6 flex h-48 items-end justify-between gap-2 sm:gap-4 pt-4">
                        {weeklySales.map((day, idx) => {
                            const barHeightPercent = Math.max(12, Math.round((day.revenue / maxDayRevenue) * 100));
                            return (
                                <div key={idx} className="flex flex-1 flex-col items-center gap-2 group">
                                    {/* Tooltip on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center text-[10px] font-black text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap">
                                        ₹{day.revenue.toLocaleString('en-IN')}
                                    </div>
                                    <div className="w-full max-w-[42px] h-36 rounded-2xl bg-gray-100/70 p-1 flex items-end">
                                        <div
                                            style={{ height: `${barHeightPercent}%` }}
                                            className="w-full rounded-xl bg-gradient-to-t from-orange-600 to-amber-400 transition-all duration-500 group-hover:from-orange-500 group-hover:to-amber-300"
                                        />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-600">{day.day}</span>
                                    <span className="text-[9px] text-gray-400">{day.orders} ord</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Monthly Performance Trend (5 cols) */}
                <div className="lg:col-span-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">Monthly Sales Summary</h3>
                                <p className="text-[11px] text-gray-500">6-Month revenue milestones</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {monthlySales.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition">
                                <div>
                                    <p className="text-xs font-bold text-gray-900">{m.month} {m.year}</p>
                                    <p className="text-[10px] text-gray-400">{m.orders} Completed Orders</p>
                                </div>
                                <span className="font-mono text-xs font-black text-gray-950">
                                    ₹{m.revenue.toLocaleString('en-IN')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ROW 2: Top Selling Products Leaderboard & Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Selling Products (7 cols) */}
                <div className="lg:col-span-7 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Award className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Top Performing Products</h3>
                            <p className="text-[11px] text-gray-500">Best-sellers by sales volume & revenue</p>
                        </div>
                    </div>

                    <div className="mt-4 divide-y divide-gray-100">
                        {topProducts.length > 0 ? (
                            topProducts.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-700">
                                            #{idx + 1}
                                        </span>
                                        <img
                                            src={p.image}
                                            alt={p.name}
                                            className="h-10 w-10 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100"
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 line-clamp-1 max-w-xs">{p.name}</p>
                                            <p className="text-[10px] text-gray-400">{p.unitsSold} units sold</p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-xs font-black text-emerald-700">
                                        ₹{p.revenue.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 py-6 text-center">No sales records yet.</p>
                        )}
                    </div>
                </div>

                {/* Category Revenue Distribution (5 cols) */}
                <div className="lg:col-span-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Layers className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Category Revenue Split</h3>
                            <p className="text-[11px] text-gray-500">Sales share across product categories</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-4">
                        {categoryEntries.length > 0 ? (
                            categoryEntries.map(([cat, val]) => {
                                const percent = Math.round((val / totalCatRevenue) * 100);
                                return (
                                    <div key={cat} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-gray-700">{cat}</span>
                                            <span className="text-gray-900">₹{val.toLocaleString('en-IN')} ({percent}%)</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                style={{ width: `${percent}%` }}
                                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-xs text-gray-500 py-6 text-center">No category data recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsCharts;
