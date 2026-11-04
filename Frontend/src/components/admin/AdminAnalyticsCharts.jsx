import { useState } from 'react';
import {
    BarChart3,
    TrendingUp,
    Award,
    Layers,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ShoppingBag,
    Percent,
} from 'lucide-react';

const AdminAnalyticsCharts = ({ stats }) => {
    // Comparison Timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly'
    const [timeframe, setTimeframe] = useState('daily');
    // Metric Mode: 'revenue' | 'profit' | 'orders'
    const [metricMode, setMetricMode] = useState('revenue');

    if (!stats) return null;

    // Source arrays from backend
    const dailyData = stats.dailyComparison || stats.weeklySales || [];
    const weeklyData = stats.weeklyComparison || [];
    const monthlyData = stats.monthlyComparison || stats.monthlySales || [];
    const yearlyData = stats.yearlyComparison || [];
    const topProducts = stats.topProducts || [];
    const categorySales = stats.categorySales || {};

    // Select active dataset based on timeframe
    let activeData = [];
    if (timeframe === 'daily') activeData = dailyData;
    else if (timeframe === 'weekly') activeData = weeklyData;
    else if (timeframe === 'monthly') activeData = monthlyData;
    else if (timeframe === 'yearly') activeData = yearlyData;

    // Helper to get active metric value
    const getValue = (item) => {
        if (metricMode === 'revenue') return item.revenue || 0;
        if (metricMode === 'profit') return item.profit || Math.round((item.revenue || 0) * 0.35);
        if (metricMode === 'orders') return item.orders || 0;
        return 0;
    };

    const getLabel = (item) => {
        if (timeframe === 'daily') return item.day || item.date || '';
        if (timeframe === 'weekly') return item.week || item.label || '';
        if (timeframe === 'monthly') return item.month || item.label || '';
        if (timeframe === 'yearly') return item.year || '';
        return '';
    };

    const getSubLabel = (item) => {
        if (timeframe === 'daily') return item.date || '';
        if (timeframe === 'weekly') return item.orders ? `${item.orders} ord` : '';
        if (timeframe === 'monthly') return item.year ? `${item.year}` : '';
        if (timeframe === 'yearly') return `${item.orders || 0} ord`;
        return '';
    };

    const maxValue = Math.max(...activeData.map((d) => getValue(d)), 1);
    const categoryEntries = Object.entries(categorySales);
    const totalCatRevenue = categoryEntries.reduce((sum, [, val]) => sum + val, 0) || 1;

    // Quick calculations for the summary badge
    const totalSelectedSum = activeData.reduce((sum, d) => sum + getValue(d), 0);
    const avgSelectedValue = activeData.length > 0 ? Math.round(totalSelectedSum / activeData.length) : 0;

    return (
        <div className="space-y-6">
            {/* ROW 1: Enterprise Multi-Period Performance Chart */}
            <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-gray-900">
                                    Revenue & Performance Comparison
                                </h3>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                                    Live Mongo Aggregation
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">
                                Compare sales trends across daily, weekly, monthly, and yearly intervals
                            </p>
                        </div>
                    </div>

                    {/* Controls Toolbar: Metric Mode & Timeframe Selector */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Metric Selector */}
                        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold text-gray-600">
                            <button
                                onClick={() => setMetricMode('revenue')}
                                className={`rounded-lg px-2.5 py-1 transition ${
                                    metricMode === 'revenue'
                                        ? 'bg-white text-orange-600 shadow-xs'
                                        : 'hover:text-gray-900'
                                }`}
                            >
                                Revenue
                            </button>
                            <button
                                onClick={() => setMetricMode('profit')}
                                className={`rounded-lg px-2.5 py-1 transition ${
                                    metricMode === 'profit'
                                        ? 'bg-white text-emerald-600 shadow-xs'
                                        : 'hover:text-gray-900'
                                }`}
                            >
                                Profit
                            </button>
                            <button
                                onClick={() => setMetricMode('orders')}
                                className={`rounded-lg px-2.5 py-1 transition ${
                                    metricMode === 'orders'
                                        ? 'bg-white text-blue-600 shadow-xs'
                                        : 'hover:text-gray-900'
                                }`}
                            >
                                Orders
                            </button>
                        </div>

                        {/* Timeframe Selector */}
                        <div className="flex rounded-xl bg-gray-900 p-1 text-xs font-bold text-gray-300">
                            <button
                                onClick={() => setTimeframe('daily')}
                                className={`rounded-lg px-3 py-1 transition ${
                                    timeframe === 'daily'
                                        ? 'bg-orange-500 text-white shadow-xs'
                                        : 'hover:text-white'
                                }`}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => setTimeframe('weekly')}
                                className={`rounded-lg px-3 py-1 transition ${
                                    timeframe === 'weekly'
                                        ? 'bg-orange-500 text-white shadow-xs'
                                        : 'hover:text-white'
                                }`}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setTimeframe('monthly')}
                                className={`rounded-lg px-3 py-1 transition ${
                                    timeframe === 'monthly'
                                        ? 'bg-orange-500 text-white shadow-xs'
                                        : 'hover:text-white'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setTimeframe('yearly')}
                                className={`rounded-lg px-3 py-1 transition ${
                                    timeframe === 'yearly'
                                        ? 'bg-orange-500 text-white shadow-xs'
                                        : 'hover:text-white'
                                }`}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-Header Insights Bar */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-gray-50/80 p-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                            <DollarSign className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 block">Total in Window</span>
                            <span className="text-xs font-black text-gray-900">
                                {metricMode === 'orders' ? totalSelectedSum : `₹${totalSelectedSum.toLocaleString('en-IN')}`}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 block">Period Average</span>
                            <span className="text-xs font-black text-gray-900">
                                {metricMode === 'orders' ? `${avgSelectedValue} ord/period` : `₹${avgSelectedValue.toLocaleString('en-IN')}`}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <ShoppingBag className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 block">AOV (Global)</span>
                            <span className="text-xs font-black text-gray-900">
                                ₹{(stats.averageOrderValue || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                            <Percent className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 block">Conversion Rate</span>
                            <span className="text-xs font-black text-emerald-600">
                                {stats.conversionRate || 0}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dynamic SVG / HTML Bar Chart Container */}
                <div className="mt-8 flex h-56 items-end justify-between gap-2 overflow-x-auto pb-2 pt-4">
                    {activeData.length > 0 ? (
                        activeData.map((item, idx) => {
                            const val = getValue(item);
                            const heightPercent = Math.max(12, Math.round((val / maxValue) * 100));

                            // Color gradient based on metricMode
                            let barGradient = 'from-orange-600 to-amber-400 group-hover:from-orange-500 group-hover:to-amber-300';
                            if (metricMode === 'profit') {
                                barGradient = 'from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300';
                            } else if (metricMode === 'orders') {
                                barGradient = 'from-blue-600 to-cyan-400 group-hover:from-blue-500 group-hover:to-cyan-300';
                            }

                            return (
                                <div key={idx} className="group flex flex-1 min-w-[36px] flex-col items-center gap-2">
                                    {/* Tooltip on hover */}
                                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-center text-[10px] font-black text-gray-900 bg-gray-900 text-white px-2 py-1 rounded-md shadow-md whitespace-nowrap z-10">
                                        {metricMode === 'orders' ? `${val} orders` : `₹${val.toLocaleString('en-IN')}`}
                                    </div>

                                    {/* Bar Track */}
                                    <div className="w-full max-w-[48px] h-40 rounded-2xl bg-gray-100/80 p-1 flex items-end">
                                        <div
                                            style={{ height: `${heightPercent}%` }}
                                            className={`w-full rounded-xl bg-gradient-to-t ${barGradient} transition-all duration-500`}
                                        />
                                    </div>

                                    {/* Labels */}
                                    <span className="text-[11px] font-black text-gray-700 truncate max-w-[50px] text-center">
                                        {getLabel(item)}
                                    </span>
                                    <span className="text-[9px] font-semibold text-gray-400 truncate max-w-[50px] text-center">
                                        {getSubLabel(item)}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No comparison metrics recorded for this timeframe.
                        </div>
                    )}
                </div>
            </div>

            {/* ROW 2: Top Selling Products Leaderboard & Category Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Selling Products (7 cols) */}
                <div className="lg:col-span-7 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Award className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">Top Performing Products</h3>
                                <p className="text-[11px] text-gray-500">Ranked by actual sales volume & revenue</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            Leaderboard
                        </span>
                    </div>

                    <div className="mt-4 divide-y divide-gray-100">
                        {topProducts.length > 0 ? (
                            topProducts.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3 hover:bg-gray-50/50 px-2 rounded-xl transition">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                                                idx === 0
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : idx === 1
                                                    ? 'bg-gray-200 text-gray-700'
                                                    : idx === 2
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
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
                                    <div className="text-right">
                                        <span className="font-mono text-xs font-black text-emerald-700 block">
                                            ₹{p.revenue.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            ₹{p.price.toLocaleString('en-IN')} / unit
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 py-8 text-center">No product sales recorded yet.</p>
                        )}
                    </div>
                </div>

                {/* Category Revenue Distribution (5 cols) */}
                <div className="lg:col-span-5 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Layers className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">Category Revenue Split</h3>
                                <p className="text-[11px] text-gray-500">Sales share across categories</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            Share
                        </span>
                    </div>

                    <div className="mt-4 space-y-4">
                        {categoryEntries.length > 0 ? (
                            categoryEntries.map(([cat, val], i) => {
                                const percent = Math.round((val / totalCatRevenue) * 100);
                                const colors = [
                                    'from-orange-500 to-amber-500',
                                    'from-blue-500 to-cyan-500',
                                    'from-emerald-500 to-teal-500',
                                    'from-purple-500 to-pink-500',
                                    'from-rose-500 to-red-500',
                                ];
                                const barColor = colors[i % colors.length];

                                return (
                                    <div key={cat} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-gray-700">{cat}</span>
                                            <span className="text-gray-900">
                                                ₹{val.toLocaleString('en-IN')}{' '}
                                                <span className="text-gray-400 font-normal">({percent}%)</span>
                                            </span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                style={{ width: `${percent}%` }}
                                                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-xs text-gray-500 py-8 text-center">No category sales records yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsCharts;