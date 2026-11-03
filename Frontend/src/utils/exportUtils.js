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
