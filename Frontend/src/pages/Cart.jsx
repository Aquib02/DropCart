import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Cart = () => {
    // Note: Context se 'updateCartQty' function ko bhi destructure karein
    const { cartItems, updateCartQty, removeFromCart, totalPrice } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const checkoutHandler = () => {
        if (!user) {
            navigate('/login?redirect=checkout');
        } else {
            navigate('/checkout');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-orange-500" />

                        <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                            Your Shopping Bag
                        </p>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                                Shopping Cart
                            </h1>

                            <p className="mt-2 text-sm text-gray-500">
                                Review your items before checkout.
                            </p>
                        </div>

                        {cartItems.length > 0 && (
                            <span className="hidden rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-600 shadow-sm sm:block">
                                {cartItems.length} Product{cartItems.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {cartItems.length === 0 ? (
                    /* Empty Cart */
                    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
                            🛒
                        </div>

                        <h2 className="mt-6 text-2xl font-black text-gray-900">
                            Your cart is empty
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                            Looks like you haven't added anything to your cart
                            yet. Explore our products and find something you love.
                        </p>

                        <Link
                            to="/shop"
                            className="mt-7 inline-flex items-center rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md"
                        >
                            Start Shopping
                            <span className="ml-2">→</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                        {/* Cart Items */}
                        <div className="space-y-3 lg:col-span-2">
                            {cartItems.map((item) => (
                                <div
                                    key={item.product}
                                    className="group rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md sm:p-4"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        {/* Image */}
                                        <Link
                                            to={`/product/${item.product}`}
                                            className="shrink-0 overflow-hidden rounded-lg bg-gray-100"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-20 w-20 object-cover transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
                                            />
                                        </Link>

                                        {/* Product Info */}
                                        <div className="min-w-0 flex-1">
                                            <Link to={`/product/${item.product}`}>
                                                <h3 className="truncate text-sm font-bold text-gray-900 transition-colors hover:text-orange-600 sm:text-base">
                                                    {item.name}
                                                </h3>
                                            </Link>

                                            <p className="mt-1 text-base font-black text-orange-600">
                                                ₹{item.price}
                                            </p>

                                            <p className="mt-1 text-[11px] text-gray-400">
                                                Price per item
                                            </p>
                                        </div>

                                        {/* Quantity + Delete */}
                                        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                                            <select
                                                value={item.qty}
                                                onChange={(e) =>
                                                    updateCartQty(
                                                        item.product,
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-50"
                                            >
                                                {[...Array(
                                                    Number(item.countInStock) > 0
                                                        ? Number(item.countInStock)
                                                        : 5
                                                ).keys()].map((x) => (
                                                    <option
                                                        key={x + 1}
                                                        value={x + 1}
                                                    >
                                                        Qty: {x + 1}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                onClick={() =>
                                                    removeFromCart(item.product)
                                                }
                                                className="rounded-lg px-2 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Continue Shopping */}
                            <Link
                                to="/shop"
                                className="inline-flex items-center pt-2 text-sm font-bold text-gray-600 transition-colors hover:text-orange-600"
                            >
                                <span className="mr-2">←</span>
                                Continue Shopping
                            </Link>
                        </div>

                        {/* Order Summary */}
                        <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white shadow-sm">
                            {/* Summary Header */}
                            <div className="rounded-t-2xl bg-[#171717] px-5 py-5 text-white">
                                <p className="text-xs font-bold uppercase tracking-widest text-orange-400">
                                    Checkout
                                </p>

                                <h2 className="mt-1 text-xl font-black">
                                    Order Summary
                                </h2>
                            </div>

                            <div className="space-y-5 p-5">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Total Items</span>

                                    <span className="font-bold text-gray-900">
                                        {cartItems.reduce(
                                            (acc, item) => acc + item.qty,
                                            0
                                        )}
                                    </span>
                                </div>

                                <div className="h-px bg-gray-100" />

                                <div className="flex items-end justify-between">
                                    <span className="text-sm font-semibold text-gray-600">
                                        Subtotal
                                    </span>

                                    <span className="text-2xl font-black text-gray-900">
                                        ₹{totalPrice.toFixed(2)}
                                    </span>
                                </div>

                                <p className="text-[11px] leading-5 text-gray-400">
                                    Taxes and shipping charges, if applicable,
                                    will be calculated at checkout.
                                </p>

                                <button
                                    onClick={checkoutHandler}
                                    className="group w-full rounded-lg bg-orange-500 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.99]"
                                >
                                    Proceed to Checkout
                                    <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
                                        →
                                    </span>
                                </button>

                                <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-4 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                    <span className="text-green-500">✓</span>
                                    Secure Checkout
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;