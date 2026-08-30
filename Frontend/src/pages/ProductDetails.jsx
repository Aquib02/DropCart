import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState({});
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useContext(CartContext);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await axios.get(
                    `http://localhost:5000/api/products/${id}`
                );
                setProduct(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching product:', error);
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const addToCartHandler = () => {
        addToCart(product, Number(qty));
        navigate('/cart');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f8f6] px-4 py-12">
                <div className="mx-auto max-w-6xl animate-pulse">
                    <div className="grid grid-cols-1 gap-8 rounded-2xl border border-gray-200 bg-white p-6 md:grid-cols-2">
                        <div className="aspect-square rounded-xl bg-gray-200" />
                        <div className="space-y-5 py-4">
                            <div className="h-8 w-3/4 rounded bg-gray-200" />
                            <div className="h-4 w-1/3 rounded bg-gray-200" />
                            <div className="h-8 w-1/4 rounded bg-gray-200" />
                            <div className="h-24 rounded bg-gray-200" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">

                {/* Breadcrumb-style top label */}
                <div className="mb-6 flex items-center gap-2">
                    <span className="h-1 w-8 rounded-full bg-orange-500" />

                    <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
                        Product Details
                    </span>
                </div>

                {/* Main Product Card */}
                <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:grid-cols-2">

                    {/* Product Image */}
                    <div className="relative flex items-center justify-center bg-gray-50 p-5 sm:p-8">
                        <div className="relative aspect-square w-full max-w-[480px] overflow-hidden rounded-xl bg-white shadow-sm">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                            />

                            {/* Category Badge */}
                            <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-md">
                                {product.category}
                            </div>
                        </div>
                    </div>

                    {/* Product Information */}
                    <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">

                        <div>
                            {/* Category */}
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-500">
                                {product.category}
                            </p>

                            {/* Name */}
                            <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">
                                {product.name}
                            </h1>

                            {/* Price */}
                            <div className="mt-5 flex items-center gap-3">
                                <p className="text-3xl font-black text-orange-600">
                                    ₹{product.price}
                                </p>

                                <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold text-green-600">
                                    Best Price
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="my-6 h-px bg-gray-100" />

                            {/* Description */}
                            <div>
                                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-900">
                                    About this product
                                </h2>

                                <p className="text-sm leading-7 text-gray-500">
                                    {product.description}
                                </p>
                            </div>

                            {/* Stock */}
                            <div className="mt-6">
                                <p
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                                        product.countInStock > 0
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-600'
                                    }`}
                                >
                                    <span
                                        className={`h-2 w-2 rounded-full ${
                                            product.countInStock > 0
                                                ? 'bg-green-500'
                                                : 'bg-red-500'
                                        }`}
                                    />

                                    {product.countInStock > 0
                                        ? `In Stock (${product.countInStock} available)`
                                        : 'Out of Stock'}
                                </p>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-8 border-t border-gray-100 pt-6">

                            {product.countInStock > 0 && (
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-700">
                                        Quantity
                                    </span>

                                    <select
                                        value={qty}
                                        onChange={(e) =>
                                            setQty(e.target.value)
                                        }
                                        className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    >
                                        {[...Array(product.countInStock).keys()].map(
                                            (x) => (
                                                <option
                                                    key={x + 1}
                                                    value={x + 1}
                                                >
                                                    {x + 1}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={addToCartHandler}
                                disabled={product.countInStock === 0}
                                className={`w-full rounded-lg py-3.5 text-sm font-bold text-white transition-all duration-200 ${
                                    product.countInStock > 0
                                        ? 'bg-orange-500 shadow-sm hover:bg-orange-600 hover:shadow-md active:scale-[0.99]'
                                        : 'cursor-not-allowed bg-gray-300'
                                }`}
                            >
                                {product.countInStock > 0
                                    ? 'Add to Cart →'
                                    : 'Out of Stock'}
                            </button>

                            {/* Trust Info */}
                            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-5">
                                <div className="text-center">
                                    <span className="text-sm">🚚</span>
                                    <p className="mt-1 text-[9px] font-bold uppercase text-gray-400">
                                        Fast Delivery
                                    </p>
                                </div>

                                <div className="border-x border-gray-100 text-center">
                                    <span className="text-sm">✓</span>
                                    <p className="mt-1 text-[9px] font-bold uppercase text-gray-400">
                                        Quality
                                    </p>
                                </div>

                                <div className="text-center">
                                    <span className="text-sm">🔒</span>
                                    <p className="mt-1 text-[9px] font-bold uppercase text-gray-400">
                                        Secure
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;