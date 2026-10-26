import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    const [country, setCountry] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (user && user.isAdmin) {
        return (
            <div className="min-h-screen bg-[#f8f8f6] px-4 py-16 sm:px-6">
                <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl">
                        ⚠️
                    </div>

                    <h2 className="mt-5 text-2xl font-black text-red-600">
                        Admin Account Restriction
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-gray-500">
                        Admins cannot place orders or use the shopping cart.
                        Please use an admin panel.
                    </p>
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
                totalPrice,
            };

            const { data } = await axios.post(
                `${API_BASE_URL}/api/orders`,
                orderData,
                config
            );

            // Clear cart after successful order placement
            clearCart();
            setLoading(false);

            // Redirect to home or order success page
            alert('Order Placed Successfully!');
            navigate('/');
        } catch (err) {
            setLoading(false);
            setError(
                err.response?.data?.message || 'Failed to place order'
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-orange-500" />

                        <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                            Secure Checkout
                        </p>
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                        Shipping & Checkout
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Enter your delivery details and choose your preferred
                        payment method.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">

                    {/* Shipping Form */}
                    <form
                        onSubmit={submitHandler}
                        className="rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2"
                    >
                        {/* Form Header */}
                        <div className="rounded-t-2xl bg-[#171717] px-6 py-5 text-white sm:px-8">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-lg">
                                    📍
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                                        Step 1
                                    </p>

                                    <h2 className="text-lg font-black">
                                        Shipping Address
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 p-6 sm:p-8">

                            {/* Address */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Street Address
                                </label>

                                <input
                                    type="text"
                                    required
                                    value={address}
                                    onChange={(e) =>
                                        setAddress(e.target.value)
                                    }
                                    placeholder="Enter your full address"
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                />
                            </div>

                            {/* City + Postal */}
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        value={city}
                                        onChange={(e) =>
                                            setCity(e.target.value)
                                        }
                                        placeholder="Enter city"
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        Postal Code
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        value={postalCode}
                                        onChange={(e) =>
                                            setPostalCode(e.target.value)
                                        }
                                        placeholder="Enter postal code"
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    />
                                </div>
                            </div>

                            {/* Country */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Country
                                </label>

                                <input
                                    type="text"
                                    required
                                    value={country}
                                    onChange={(e) =>
                                        setCountry(e.target.value)
                                    }
                                    placeholder="Enter country"
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                />
                            </div>

                            {/* Payment */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Payment Method
                                </label>

                                <div className="relative">
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) =>
                                            setPaymentMethod(e.target.value)
                                        }
                                        className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    >
                                        <option value="COD">
                                            Cash on Delivery (COD)
                                        </option>

                                        <option value="Online">
                                            Online Payment
                                        </option>
                                    </select>

                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        ▼
                                    </span>
                                </div>
                            </div>

                            {/* Place Order */}
                            <div className="border-t border-gray-100 pt-5">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-lg bg-orange-500 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading
                                        ? 'Processing...'
                                        : 'Place Order →'}
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                <span className="text-green-500">✓</span>
                                Your information is securely processed
                            </div>
                        </div>
                    </form>

                    {/* Order Summary */}
                    <div className="sticky top-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                        {/* Summary Header */}
                        <div className="bg-[#171717] px-5 py-5 text-white">
                            <p className="text-xs font-bold uppercase tracking-widest text-orange-400">
                                Your Order
                            </p>

                            <h2 className="mt-1 text-xl font-black">
                                Order Summary
                            </h2>
                        </div>

                        <div className="p-5">

                            {/* Items */}
                            <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                                {cartItems.map((item) => (
                                    <div
                                        key={item.product}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="relative shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-14 w-14 rounded-lg border border-gray-100 object-cover"
                                            />

                                            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#171717] px-1 text-[9px] font-bold text-white">
                                                {item.qty}
                                            </span>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold text-gray-800">
                                                {item.name}
                                            </p>

                                            <p className="mt-1 text-[10px] text-gray-400">
                                                ₹{item.price} × {item.qty}
                                            </p>
                                        </div>

                                        <p className="shrink-0 text-sm font-bold text-gray-900">
                                            ₹{item.price * item.qty}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="mt-5 border-t border-gray-100 pt-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-600">
                                        Total Amount
                                    </span>

                                    <span className="text-2xl font-black text-orange-600">
                                        ₹{totalPrice.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Trust badges */}
                            <div className="mt-5 space-y-2 border-t border-gray-100 pt-5">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="text-green-500">✓</span>
                                    Secure checkout
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="text-green-500">✓</span>
                                    Quality products
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="text-green-500">✓</span>
                                    Easy order tracking
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;