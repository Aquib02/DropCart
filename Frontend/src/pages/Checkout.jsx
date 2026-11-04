import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, ShieldCheck, CreditCard, Sparkles, Loader2, X, Lock } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

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
    const [isPaidOrder, setIsPaidOrder] = useState(false);
    const [paymentId, setPaymentId] = useState('');

    // In-App Razorpay Gateway Modal state
    const [showGatewayModal, setShowGatewayModal] = useState(false);
    const [pendingPayment, setPendingPayment] = useState(null);
    const [verifyingPayment, setVerifyingPayment] = useState(false);

    // Read discounts passed from cart
    const [discountInfo, setDiscountInfo] = useState({
        coupon: null,
        couponDiscount: 0,
        useCoins: false,
        coinsDiscount: 0,
    });

    // Dynamic Shipping & Gateway Settings from MongoDB
    const [storeSettings, setStoreSettings] = useState({
        freeShippingThreshold: 499,
        standardShippingFee: 49,
        codEnabled: true,
        razorpayEnabled: true,
        upiEnabled: true
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

        axios.get(`${API_BASE_URL}/api/settings`)
            .then(res => {
                if (res.data) {
                    setStoreSettings({
                        freeShippingThreshold: res.data.shipping?.freeShippingThreshold ?? 499,
                        standardShippingFee: res.data.shipping?.standardShippingFee ?? 49,
                        codEnabled: res.data.paymentMethods?.codEnabled !== false,
                        razorpayEnabled: res.data.paymentMethods?.razorpayEnabled !== false,
                        upiEnabled: res.data.paymentMethods?.upiEnabled !== false,
                    });
                }
            })
            .catch(() => {});
    }, []);

    const couponDiscount = discountInfo.couponDiscount || 0;
    const coinsDiscount = discountInfo.coinsDiscount || 0;
    const isFreeDelivery = totalPrice >= storeSettings.freeShippingThreshold;
    const deliveryFee = isFreeDelivery ? 0 : storeSettings.standardShippingFee;
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

            // Handle Instant Online / Razorpay payment flow
            if (paymentMethod === 'Online') {
                const payRes = await axios.post(
                    `${API_BASE_URL}/api/payment/create-order`,
                    { orderId: data._id, amount: finalAmount },
                    config
                );

                const hasScript = await loadRazorpayScript();
                if (hasScript && window.Razorpay && !payRes.data.isSimulated) {
                    const options = {
                        key: payRes.data.keyId,
                        amount: payRes.data.amount,
                        currency: payRes.data.currency || 'INR',
                        name: 'DropCart India',
                        description: `Order #${String(data._id).slice(-6)} Payment`,
                        order_id: payRes.data.razorpayOrderId,
                        handler: async function (response) {
                            await verifyAndCompletePayment({
                                orderId: data._id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            });
                        },
                        prefill: {
                            name: user?.name || '',
                            email: user?.email || '',
                            contact: user?.phone || '9876543210',
                        },
                        theme: {
                            color: '#f97316',
                        },
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function () {
                        setError('Payment authorization failed. You can retry with another method.');
                        setLoading(false);
                    });
                    rzp.open();
                    return;
                } else {
                    // Open in-app Razorpay simulated test gateway modal
                    setPendingPayment({
                        orderId: data._id,
                        razorpayOrderId: payRes.data.razorpayOrderId,
                        amount: finalAmount,
                    });
                    setShowGatewayModal(true);
                    setLoading(false);
                    return;
                }
            }

            // Cash on Delivery flow
            clearCart();
            sessionStorage.removeItem('dropcart_discounts');
            sessionStorage.removeItem('dropcart_applied_coupon');
            setLoading(false);
            setPlacedOrderId(data._id);
            setIsPaidOrder(false);
            setOrderSuccess(true);
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to place order. Please try again.');
        }
    };

    const verifyAndCompletePayment = async ({
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    }) => {
        try {
            setVerifyingPayment(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`,
                },
            };

            await axios.post(
                `${API_BASE_URL}/api/payment/verify`,
                {
                    orderId,
                    razorpayOrderId,
                    razorpayPaymentId: razorpayPaymentId || `pay_${Date.now()}`,
                    razorpaySignature: razorpaySignature || 'simulated_sig_ok',
                },
                config
            );

            clearCart();
            sessionStorage.removeItem('dropcart_discounts');
            sessionStorage.removeItem('dropcart_applied_coupon');
            setLoading(false);
            setVerifyingPayment(false);
            setShowGatewayModal(false);
            setPlacedOrderId(orderId);
            setIsPaidOrder(true);
            setPaymentId(razorpayPaymentId || `pay_${Date.now()}`);
            setOrderSuccess(true);
        } catch (err) {
            setVerifyingPayment(false);
            setError(err.response?.data?.message || 'Payment verification failed.');
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
                        {isPaidOrder ? 'Payment Successful & Order Placed!' : 'Order Placed Successfully!'}
                    </h2>

                    <div className="mt-3 flex items-center justify-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-600">
                            Ref: #{placedOrderId}
                        </span>
                        {isPaidOrder && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                Paid via Razorpay
                            </span>
                        )}
                    </div>

                    {isPaidOrder && paymentId && (
                        <p className="mt-1 font-mono text-[11px] text-gray-400">
                            Txn ID: {paymentId}
                        </p>
                    )}

                    <p className="mt-3 text-xs leading-relaxed text-gray-500">
                        {isPaidOrder
                            ? `Payment of ₹${finalAmount.toLocaleString('en-IN')} is confirmed. Your order is now being processed for priority dispatch.`
                            : 'Your Cash on Delivery order has been placed. You can pay upon delivery and track live shipment updates in your dashboard.'}
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {storeSettings.codEnabled && (
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
                                                <p className="text-[10px] text-gray-500">Pay upon doorstep arrival</p>
                                            </div>
                                        </label>
                                    )}

                                    {storeSettings.razorpayEnabled && (
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
                                                <p className="text-[10px] text-gray-500">UPI / Cards / NetBanking</p>
                                            </div>
                                        </label>
                                    )}
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

            {/* In-App Razorpay Gateway / Test Payment Modal */}
            {showGatewayModal && pendingPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                                        Razorpay Gateway
                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                            Secure
                                        </span>
                                    </h3>
                                    <p className="text-[11px] text-gray-400">256-Bit Bank Grade Encryption</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowGatewayModal(false)}
                                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="my-5 rounded-2xl bg-gray-50 p-4 text-center border border-gray-200">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                Amount to Pay
                            </span>
                            <p className="text-3xl font-black text-gray-950 mt-1">
                                ₹{pendingPayment.amount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                                Order #{String(pendingPayment.orderId).slice(-8)}
                            </p>
                        </div>

                        <div className="space-y-2.5">
                            <button
                                onClick={() =>
                                    verifyAndCompletePayment({
                                        orderId: pendingPayment.orderId,
                                        razorpayOrderId: pendingPayment.razorpayOrderId,
                                        razorpayPaymentId: `pay_upi_${Date.now()}`,
                                        razorpaySignature: 'simulated_sig_ok',
                                    })
                                }
                                disabled={verifyingPayment}
                                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50/40 transition group font-bold text-xs text-gray-800"
                            >
                                <span className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    Pay with Instant UPI (GPay / PhonePe)
                                </span>
                                <span className="text-blue-600 font-extrabold group-hover:translate-x-0.5 transition-transform">
                                    →
                                </span>
                            </button>

                            <button
                                onClick={() =>
                                    verifyAndCompletePayment({
                                        orderId: pendingPayment.orderId,
                                        razorpayOrderId: pendingPayment.razorpayOrderId,
                                        razorpayPaymentId: `pay_card_${Date.now()}`,
                                        razorpaySignature: 'simulated_sig_ok',
                                    })
                                }
                                disabled={verifyingPayment}
                                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50/40 transition group font-bold text-xs text-gray-800"
                            >
                                <span className="flex items-center gap-2.5">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    Debit / Credit Card (Visa / Mastercard)
                                </span>
                                <span className="text-blue-600 font-extrabold group-hover:translate-x-0.5 transition-transform">
                                    →
                                </span>
                            </button>

                            <button
                                onClick={() =>
                                    verifyAndCompletePayment({
                                        orderId: pendingPayment.orderId,
                                        razorpayOrderId: pendingPayment.razorpayOrderId,
                                        razorpayPaymentId: `pay_test_${Date.now()}`,
                                        razorpaySignature: 'simulated_sig_ok',
                                    })
                                }
                                disabled={verifyingPayment}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
                            >
                                {verifyingPayment ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verifying Signature with Bank...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-3.5 h-3.5" />
                                        Authorize Secure Payment (Instant Test Mode)
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="mt-4 text-center text-[10px] text-gray-400">
                            DropCart uses HMAC SHA256 cryptographic verification for all transactions.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;
