// Export orders to CSV file directly in browser
export const exportOrdersToCSV = (orders) => {
    if (!orders || orders.length === 0) {
        alert('No orders available to export.');
        return;
    }

    const headers = [
        'Order ID',
        'Customer Name',
        'Customer Email',
        'Items Count',
        'Items Purchased',
        'Total Price (INR)',
        'Payment Method',
        'Payment Status',
        'Order Status',
        'Order Date',
    ];

    const rows = orders.map((o) => {
        const itemsSummary = o.orderItems
            ? o.orderItems.map((i) => `${i.name} (x${i.qty})`).join('; ')
            : '';

        return [
            `"${o._id}"`,
            `"${o.user?.name || 'Guest'}"`,
            `"${o.user?.email || 'N/A'}"`,
            o.orderItems ? o.orderItems.reduce((acc, i) => acc + i.qty, 0) : 0,
            `"${itemsSummary.replace(/"/g, '""')}"`,
            o.totalPrice || 0,
            `"${o.paymentMethod || 'COD'}"`,
            o.isPaid ? 'Paid' : 'Unpaid',
            `"${o.status}"`,
            `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
        ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
        'download',
        `DropCart_Orders_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Export comprehensive enterprise business analytics summary report to CSV
export const exportAnalyticsReportToCSV = (stats) => {
    if (!stats) {
        alert('No analytics data available to export.');
        return;
    }

    const lines = [];
    lines.push('====================================================');
    lines.push('DROPCART ENTERPRISE BUSINESS & ANALYTICS REPORT');
    lines.push(`Generated At,${new Date().toLocaleString('en-IN')}`);
    lines.push(`Filtered Range,${(stats.range || 'All Time').toUpperCase()}`);
    lines.push('====================================================');
    lines.push('');
    lines.push('KEY PERFORMANCE INDICATORS (KPIs)');
    lines.push(`Total Gross Revenue (INR),${stats.totalRevenue || 0}`);
    lines.push(`Estimated Total Profit (INR),${stats.totalProfit || 0}`);
    lines.push(`Total Orders,${stats.totalOrders || 0}`);
    lines.push(`Average Order Value (INR),${stats.averageOrderValue || 0}`);
    lines.push(`Conversion Rate (%),${stats.conversionRate || 0}`);
    lines.push(`Delivered Orders,${stats.deliveredOrders || 0}`);
    lines.push(`Pending Orders,${stats.pendingOrders || 0}`);
    lines.push(`Cancelled / Returned Orders,${stats.cancelledOrders || 0}`);
    lines.push(`Total Catalog Products,${stats.totalProducts || 0}`);
    lines.push(`Low Stock Items,${stats.lowStockCount || 0}`);
    lines.push(`Out of Stock Items,${stats.outOfStockProducts || 0}`);
    lines.push(`Total Customers,${stats.totalUsers || 0}`);
    lines.push('');

    // Top Selling Products
    lines.push('TOP PERFORMING PRODUCTS');
    lines.push('Product Name,Price (INR),Units Sold,Gross Revenue (INR)');
    if (stats.topProducts && stats.topProducts.length > 0) {
        stats.topProducts.forEach((p) => {
            lines.push(`"${(p.name || '').replace(/"/g, '""')}",${p.price || 0},${p.unitsSold || 0},${p.revenue || 0}`);
        });
    } else {
        lines.push('No sales recorded for this period');
    }
    lines.push('');

    // Category Sales Split
    lines.push('CATEGORY REVENUE BREAKDOWN');
    lines.push('Category,Revenue (INR)');
    if (stats.categorySales && Object.keys(stats.categorySales).length > 0) {
        Object.entries(stats.categorySales).forEach(([cat, rev]) => {
            lines.push(`"${cat}",${rev}`);
        });
    } else {
        lines.push('No category data available');
    }
    lines.push('');

    // Daily revenue summary
    if (stats.dailyComparison && stats.dailyComparison.length > 0) {
        lines.push('DAILY REVENUE & ORDERS (LAST 14 DAYS)');
        lines.push('Date,Day,Revenue (INR),Orders,Profit (INR)');
        stats.dailyComparison.forEach((d) => {
            lines.push(`"${d.date}","${d.day}",${d.revenue || 0},${d.orders || 0},${d.profit || 0}`);
        });
        lines.push('');
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
        'download',
        `DropCart_Business_Report_${stats.range || 'all'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
