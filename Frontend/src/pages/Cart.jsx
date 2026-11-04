import { useState, useEffect, useContext, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Trash2,
    ArrowRight,
    Tag,
    Coins,
    Check,
    Truck,
    ShieldCheck,
} from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import EmptyState from '../components/EmptyState';

const Cart = () => {
    const couponInputId = useId();
    const coinsCheckboxId = useId();
    const { cartItems, updateCartQty, removeFromCart, totalPrice } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
    const [activeCouponsList, setActiveCouponsList] = useState([]);

    // Dynamic Shipping Rules from Admin Store Settings
    const [shippingRules, setShippingRules] = useState({
        freeThreshold: 499,
        standardFee: 49,
    });

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/settings`)
            .then(res => {
                if (res.data?.shipping) {
                    setShippingRules({
                        freeThreshold: res.data.shipping.freeShippingThreshold ?? 499,
                        standardFee: res.data.shipping.standardShippingFee ?? 49,
                    });
                }
            })
            .catch(() => {});
    }, []);

    // SuperCoins loyalty redemption state
    const [useCoins, setUseCoins] = useState(false);
    const userCoins = user?.coins || 0;
    // Cap coins to max 100 or cart total
    const maxCoinsRedeemable = Math.min(userCoins, 100, Math.floor(totalPrice));
    const coinsDiscount = useCoins ? maxCoinsRedeemable : 0;

    // Fetch active coupons for quick-apply chips
    useEffect(() => {
        const fetchActiveCoupons = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/coupons/active`);
                setActiveCouponsList(data || []);
            } catch {
                setActiveCouponsList([]);
            }
        };
        fetchActiveCoupons();

        // Restore previously applied coupon from sessionStorage if valid
        try {
            const saved = sessionStorage.getItem('dropcart_applied_coupon');
            if (saved) {
                setAppliedCoupon(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to parse applied coupon', e);
        }
    }, []);

    // Save coupon and coins state to sessionStorage for Checkout
    useEffect(() => {
        const discountInfo = {
            coupon: appliedCoupon,
            couponDiscount: appliedCoupon?.discount || 0,
            useCoins,
            coinsDiscount,
        };
        sessionStorage.setItem('dropcart_discounts', JSON.stringify(discountInfo));
    }, [appliedCoupon, useCoins, coinsDiscount]);

    const handleApplyCoupon = async (codeToApply) => {
        const code = codeToApply || couponCode;
        if (!code || !code.trim()) {
            setCouponMessage({ text: 'Please enter a valid coupon code', type: 'error' });
            return;
        }

        setCouponLoading(true);
        setCouponMessage({ text: '', type: '' });

        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/coupons/apply`, {
                code: code.trim().toUpperCase(),
                cartTotal: totalPrice,
            });

            if (data.success) {
                setAppliedCoupon(data.coupon);
                sessionStorage.setItem('dropcart_applied_coupon', JSON.stringify(data.coupon));
                setCouponMessage({ text: data.message, type: 'success' });
                setCouponCode('');
            }
            setCouponLoading(false);
        } catch (error) {
            setCouponLoading(false);
            setCouponMessage({
                text: error.response?.data?.message || 'Invalid coupon code',
                type: 'error',
            });
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        sessionStorage.removeItem('dropcart_applied_coupon');
        setCouponMessage({ text: 'Coupon removed', type: 'info' });
    };

    const couponDiscount = appliedCoupon?.discount || 0;
    const deliveryThreshold = shippingRules.freeThreshold;
    const isFreeDelivery = totalPrice >= deliveryThreshold;
    const amountNeededForFreeDelivery = Math.max(0, deliveryThreshold - totalPrice);
    const deliveryFee = isFreeDelivery ? 0 : shippingRules.standardFee;

    const finalPayable = Math.max(0, totalPrice - couponDiscount - coinsDiscount + deliveryFee);

    const checkoutHandler = () => {
        if (!user) {
            navigate('/login?redirect=checkout');
        } else {
            navigate('/checkout');
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f3f6] pb-16 pt-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">
                            Shopping Cart ({cartItems.reduce((acc, item) => acc + item.qty, 0)} Items)
                        </h1>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Review your items, apply discount coupons and redeem SuperCoins
                        </p>
                    </div>

                    <Link
                        to="/shop"
                        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                        Continue Shopping <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {cartItems.length === 0 ? (
                    <EmptyState
                        type="empty-cart"
                        actionText="Explore Big Bang Deals →"
                        actionLink="/shop"
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: Cart Items & Free Shipping Progress (8 cols) */}
                        <div className="lg:col-span-8 space-y-4">
                            {/* Free Delivery Progress Bar */}
                            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-2xs">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <div className="flex items-center gap-2 text-blue-900">
                                        <Truck className="h-4 w-4 text-blue-600" />
                                        <span>
                                            {isFreeDelivery
                                                ? '🎉 You have unlocked FREE Express Delivery!'
                                                : `Add ₹${amountNeededForFreeDelivery.toLocaleString('en-IN')} more to unlock FREE Delivery!`}
                                        </span>
                                    </div>
                                    <span className="text-blue-700">Threshold: ₹{deliveryThreshold}</span>
                                </div>
                                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-blue-200">
                                    <div
                                        style={{ width: `${Math.min(100, (totalPrice / deliveryThreshold) * 100)}%` }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                    />
                                </div>
                            </div>

                            {/* Cart Item Cards */}
                            <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm divide-y divide-gray-100">
                                {cartItems.map((item) => (
                                    <div key={item.product} className="flex flex-col sm:flex-row gap-4 p-5 hover:bg-gray-50/40 transition">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-24 w-24 rounded-2xl border border-gray-100 object-contain p-2 bg-gray-50 shrink-0"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                                {item.category || 'Product'}
                                            </span>
                                            <Link
                                                to={`/product/${item.product}`}
                                                className="block text-sm font-bold text-gray-900 hover:text-blue-600 line-clamp-2"
                                            >
                                                {item.name}
                                            </Link>

                                            <div className="mt-2 flex items-baseline gap-2">
                                                <span className="text-base font-black text-gray-950">
                                                    ₹{item.price.toLocaleString('en-IN')}
                                                </span>
                                            </div>

                                            {/* Quantity and Actions */}
                                            <div className="mt-3 flex items-center gap-4">
                                                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-2 py-1">
                                                    <span className="mr-2 text-xs font-semibold text-gray-500">Qty:</span>
                                                    <select
                                                        value={item.qty}
                                                        onChange={(e) => updateCartQty(item.product, Number(e.target.value))}
                                                        className="bg-transparent text-xs font-bold text-gray-900 outline-none"
                                                    >
                                                        {[...Array(Math.min(item.countInStock || 10, 5)).keys()].map((x) => (
                                                            <option key={x + 1} value={x + 1}>
                                                                {x + 1}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <button
                                                    onClick={() => removeFromCart(item.product)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Coupons, SuperCoins & Price Breakdown (4 cols) */}
                        <div className="lg:col-span-4 space-y-4">
                            {/* Coupon Code Section */}
                            <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                    <Tag className="h-4 w-4 text-orange-500" />
                                    <h2 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                        Apply Discount Coupon
                                    </h2>
                                </div>

                                {appliedCoupon ? (
                                    <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-emerald-600" />
                                            <div>
                                                <p className="font-mono text-xs font-black text-emerald-900">
                                                    {appliedCoupon.code}
                                                </p>
                                                <p className="text-[10px] text-emerald-700">
                                                    ₹{appliedCoupon.discount.toLocaleString('en-IN')} savings applied!
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveCoupon}
                                            className="text-xs font-bold text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-3 space-y-3">
                                        <div className="flex gap-2">
                                            <label htmlFor={couponInputId} className="sr-only">Coupon Code</label>
                                            <input
                                                id={couponInputId}
                                                type="text"
                                                placeholder="Enter coupon code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold tracking-wider uppercase text-gray-900 outline-none focus:border-blue-500"
                                            />
                                            <button
                                                onClick={() => handleApplyCoupon()}
                                                disabled={couponLoading || !couponCode.trim()}
                                                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:bg-gray-200 transition"
                                            >
                                                {couponLoading ? '...' : 'Apply'}
                                            </button>
                                        </div>

                                        {couponMessage.text && (
                                            <p
                                                className={`text-[11px] font-bold ${
                                                    couponMessage.type === 'success'
                                                        ? 'text-emerald-600'
                                                        : couponMessage.type === 'error'
                                                        ? 'text-red-500'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {couponMessage.text}
                                            </p>
                                        )}

                                        {/* Quick-Apply Active Coupons */}
                                        {activeCouponsList.length > 0 && (
                                            <div className="pt-2 border-t border-gray-100">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                                    Available Festive Offers:
                                                </p>
                                                <div className="space-y-1.5">
                                                    {activeCouponsList.map((c) => (
                                                        <div
                                                            key={c.code}
                                                            onClick={() => handleApplyCoupon(c.code)}
                                                            className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-2 hover:border-orange-400 hover:bg-orange-50/30 cursor-pointer transition"
                                                        >
                                                            <div>
                                                                <span className="font-mono text-xs font-black text-orange-600">
                                                                    {c.code}
                                                                </span>
                                                                <p className="text-[10px] text-gray-500 line-clamp-1">{c.description}</p>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-blue-600 shrink-0">
                                                                Tap to apply
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* SuperCoins Loyalty Redemption Box */}
                            {user && userCoins > 0 && (
                                <div className="overflow-hidden rounded-3xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Coins className="h-4 w-4 text-amber-500 fill-current" />
                                            <div>
                                                <p className="text-xs font-black text-amber-950">
                                                    Redeem SuperCoins ({userCoins} Available)
                                                </p>
                                                <p className="text-[10px] text-amber-700">
                                                    Use up to {maxCoinsRedeemable} coins for ₹{maxCoinsRedeemable} off
                                                </p>
                                            </div>
                                        </div>
                                        <label htmlFor={coinsCheckboxId} className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                id={coinsCheckboxId}
                                                type="checkbox"
                                                checked={useCoins}
                                                onChange={(e) => setUseCoins(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Order Price Details Breakdown */}
                            <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm">
                                <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-3">
                                    Price Details
                                </h2>

                                <div className="mt-4 space-y-2.5 text-xs">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Price ({cartItems.reduce((acc, i) => acc + i.qty, 0)} items)</span>
                                        <span className="font-semibold text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                                    </div>

                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-bold">
                                            <span>Coupon Discount ({appliedCoupon.code})</span>
                                            <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}

                                    {coinsDiscount > 0 && (
                                        <div className="flex justify-between text-amber-600 font-bold">
                                            <span>SuperCoins Redeemed ({coinsDiscount})</span>
                                            <span>-₹{coinsDiscount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-gray-600">
                                        <span>Delivery Charges</span>
                                        {isFreeDelivery ? (
                                            <span className="font-bold text-emerald-600">FREE</span>
                                        ) : (
                                            <span className="font-semibold text-gray-900">₹{deliveryFee}</span>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline text-sm font-black text-gray-950">
                                        <span>Total Amount</span>
                                        <span className="text-xl">₹{finalPayable.toLocaleString('en-IN')}</span>
                                    </div>

                                    {(couponDiscount > 0 || coinsDiscount > 0) && (
                                        <p className="text-[11px] font-black text-emerald-600 pt-1">
                                            🎉 You will save ₹{(couponDiscount + coinsDiscount).toLocaleString('en-IN')} on this order!
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={checkoutHandler}
                                    className="mt-5 w-full rounded-xl bg-orange-500 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-orange-600 active:scale-95 transition"
                                >
                                    Proceed to Checkout →
                                </button>

                                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-gray-400">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    Safe and Secure Payments • 100% Authentic
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
