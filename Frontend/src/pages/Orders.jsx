import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Orders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                    },
                };
                const { data } = await axios.get(
                    'http://localhost:5000/api/orders/myorders',
                    config
                );
                setOrders(data);
                setLoading(false);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        'Failed to load orders'
                );
                setLoading(false);
            }
        };

        if (user) {
            fetchMyOrders();
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-orange-500" />

                        <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                            Account
                        </p>
                    </div>

                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                                My Order History
                            </h1>

                            <p className="mt-2 text-sm text-gray-500">
                                Track your purchases and view your order details.
                            </p>
                        </div>

                        {orders.length > 0 && !loading && !error && (
                            <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-600 shadow-sm">
                                {orders.length} Order
                                {orders.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

                        <p className="text-sm font-medium text-gray-500">
                            Loading your orders...
                        </p>
                    </div>
                ) : error ? (
                    /* Error */
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                ) : orders.length === 0 ? (
                    /* Empty Orders */
                    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-3xl">
                            📦
                        </div>

                        <h2 className="mt-5 text-2xl font-black text-gray-900">
                            No Orders Yet
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                            You haven't placed any orders yet. Your purchases
                            will appear here once you complete an order.
                        </p>
                    </div>
                ) : (
                    /* Orders */
                    <div className="space-y-5">
                        {orders.map((order) => (
                            <div
                                key={order._id}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md"
                            >
                                {/* Order Header */}
                                <div className="bg-[#171717] px-5 py-4 text-white sm:px-6">
                                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                                                Order
                                            </p>

                                            <p className="mt-1 truncate font-mono text-xs text-gray-300">
                                                #{order._id}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                {new Date(
                                                    order.createdAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                Total
                                            </p>

                                            <p className="text-xl font-black text-orange-400">
                                                ₹{order.totalPrice}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Products */}
                                <div className="divide-y divide-gray-100 px-5 sm:px-6">
                                    {order.orderItems.map((item) => (
                                        <div
                                            key={item.product}
                                            className="flex items-center gap-3 py-4 sm:gap-4"
                                        >
                                            {/* Product Image */}
                                            <div className="shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                                                />
                                            </div>

                                            {/* Product Info */}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-gray-900">
                                                    {item.name}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    Quantity:{' '}
                                                    <span className="font-semibold text-gray-700">
                                                        {item.qty}
                                                    </span>
                                                </p>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    ₹{item.price} × {item.qty}
                                                </p>
                                            </div>

                                            {/* Item Total */}
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-black text-gray-900">
                                                    ₹{item.price * item.qty}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Status Footer */}
                                <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                    <p className="text-xs font-medium text-gray-500">
                                        Order Status
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                                                order.isPaid
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    order.isPaid
                                                        ? 'bg-green-500'
                                                        : 'bg-yellow-500'
                                                }`}
                                            />

                                            {order.isPaid
                                                ? 'Paid'
                                                : 'Unpaid (COD)'}
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                                                order.isDelivered
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-700'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    order.isDelivered
                                                        ? 'bg-green-500'
                                                        : 'bg-orange-500'
                                                }`}
                                            />

                                            {order.isDelivered
                                                ? 'Delivered'
                                                : 'Processing'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;