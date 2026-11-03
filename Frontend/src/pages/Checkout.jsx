import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Checkout = () => {
    const { cartItems, totalPrice, clearCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Form states for shipping address
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('India');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState(null);

    // Read discounts passed from cart
    const [discountInfo, setDiscountInfo] = useState({
        coupon: null,
        couponDiscount: 0,
        useCoins: false,
        coinsDiscount: 0,
    });

    useEffect(() => {
        try {
            const saved = sessionStorage.getItem('dropcart_discounts');
            if (saved) {
                setDiscountInfo(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to parse discounts in checkout', e);
        }
    }, []);

    const couponDiscount = discountInfo.couponDiscount || 0;
    const coinsDiscount = discountInfo.coinsDiscount || 0;
    const isFreeDelivery = totalPrice >= 500;
    const deliveryFee = isFreeDelivery ? 0 : 40;
    const finalAmount = Math.max(0, totalPrice - couponDiscount - coinsDiscount + deliveryFee);

    // Pre-populate customer details from profile if available
    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=checkout');
            return;
        }

        if (user.address) setAddress(user.address);
        if (user.city) setCity(user.city);
        if (user.postalCode) setPostalCode(user.postalCode);
        if (user.country) setCountry(user.country);
    }, [user, navigate]);

    // Admin restriction guard
    if (user && (user.isAdmin || user.role === 'admin')) {
        return (
            <div className="min-h-screen bg-[#f8f8f6] px-4 py-16 sm:px-6">
                <div className="mx-auto max-w-lg rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-lg">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-3xl">
                        ⚠️
                    </div>
                    <h2 className="mt-5 text-2xl font-black text-rose-600">
                        Administrator Restriction
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-gray-500">
                        Admin and store owners manage inventory and orders through the Admin Control Center.
                    </p>
                    <Link
                        to="/admin/dashboard"
                        className="mt-6 inline-block rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow"
                    >
                        Go to Admin Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');

        if (cartItems.length === 0) {
            setError('Your cart is empty');
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`,
                },
            };

            const orderData = {
                orderItems: cartItems.map((item) => ({
                    name: item.name,
                    qty: item.qty,
                    image: item.image,
                    price: item.price,
                    product: item.product,
                })),
                shippingAddress: {
                    address,
                    city,
                    postalCode,
                    country,
                },
                paymentMethod,
                totalPrice: finalAmount,
            };

            const { data } = await axios.post(`${API_BASE_URL}/api/orders`, orderData, config);

            clearCart();
            sessionStorage.removeItem('dropcart_discounts');
            sessionStorage.removeItem('dropcart_applied_coupon');
            setLoading(false);
            setPlacedOrderId(data._id);
            setOrderSuccess(true);
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to place order. Please try again.');
        }
    };

    // If order was successfully placed, display the confirmation screen
    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-[#f8f8f6] px-4 py-16 sm:px-6">
                <div className="mx-auto max-w-md rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>

                    <h2 className="mt-5 text-2xl font-black text-gray-900">
                        Order Placed Successfully!
                    </h2>

                    <p className="mt-2 font-mono text-xs text-gray-500">
                        Order Reference: #{placedOrderId}
                    </p>

                    <p className="mt-3 text-xs leading-relaxed text-gray-500">
                        Your order has been recorded and is currently being processed by our store team. You can track real-time delivery status in your Customer Dashboard.
                    </p>

                    <div className="mt-8 space-y-3">
                        <Link
                            to="/customer/dashboard?tab=orders"
                            className="block w-full rounded-xl bg-orange-500 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                        >
                            Track Delivery in Dashboard →
                        </Link>

                        <Link
                            to="/shop"
                            className="block w-full rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <Link
                    to="/cart"
                    className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-orange-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Shopping Cart
                </Link>

                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
                            Safe & Encrypted
                        </span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">
                        Shipping & Checkout
                    </h1>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left: Shipping Form */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
                        <h2 className="mb-4 text-base font-black text-gray-900">
                            1. Delivery Address
                        </h2>

                        <form onSubmit={submitHandler} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-gray-700">
                                    Street Address / Apartment
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="House / Flat no, Street name"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-700">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="City name"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-700">
                                        Postal Code / PIN
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        placeholder="PIN Code"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-gray-700">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs outline-none focus:border-orange-500 focus:bg-white"
                                />
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h2 className="mb-4 text-base font-black text-gray-900">
                                    2. Payment Method
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    <label
                                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                                            paymentMethod === 'COD'
                                                ? 'border-orange-500 bg-orange-50/40 text-orange-900'
                                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === 'COD'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="text-orange-500"
                                        />
                                        <div>
                                            <p className="text-xs font-bold">Cash on Delivery</p>
                                            <p className="text-[10px] text-gray-500">Pay when arrived</p>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                                            paymentMethod === 'Online'
                                                ? 'border-orange-500 bg-orange-50/40 text-orange-900'
                                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Online"
                                            checked={paymentMethod === 'Online'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="text-orange-500"
                                        />
                                        <div>
                                            <p className="text-xs font-bold">Instant Online Pay</p>
                                            <p className="text-[10px] text-gray-500">UPI / Cards</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-2xl bg-orange-500 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-orange-600 disabled:opacity-50"
                                >
                                    {loading ? 'Processing Order...' : `Confirm Order • ₹${finalAmount.toLocaleString('en-IN')}`}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right: Order Summary Sidebar */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
                        <h2 className="mb-4 text-base font-black text-gray-900">Order Summary</h2>

                        <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto pr-1">
                            {cartItems.map((item) => (
                                <div
                                    key={item.product}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-12 w-12 rounded-xl object-cover bg-gray-50 p-1"
                                        />
                                        <div>
                                            <p className="line-clamp-1 text-xs font-bold text-gray-900">
                                                {item.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                Qty: {item.qty} × ₹{item.price.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-gray-900">
                                        ₹{(item.price * item.qty).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 border-t border-gray-100 pt-4 space-y-2.5 text-xs">
                            <div className="flex justify-between text-gray-500">
                                <span>Items Subtotal</span>
                                <span className="font-bold text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                            </div>

                            {couponDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>Coupon ({discountInfo.coupon?.code})</span>
                                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            {coinsDiscount > 0 && (
                                <div className="flex justify-between text-amber-600 font-bold">
                                    <span>SuperCoins Discount</span>
                                    <span>-₹{coinsDiscount.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-gray-500">
                                <span>Express Delivery</span>
                                {isFreeDelivery ? (
                                    <span className="font-bold text-emerald-600">FREE</span>
                                ) : (
                                    <span className="font-bold text-gray-900">₹{deliveryFee}</span>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
                                <span className="font-black text-gray-900">Final Total</span>
                                <span className="font-black text-orange-600">₹{finalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
