import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(CartContext);

    return (
        <div className="mx-auto flex w-full max-w-[230px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
            {/* Square Product Image */}
            <Link
                to={`/product/${product._id}`}
                className="relative block aspect-square overflow-hidden bg-gray-100"
            >
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-gray-700 shadow-sm">
                    {product.category}
                </div>
            </Link>

            {/* Product Details */}
            <div className="flex flex-grow flex-col p-3">
                <Link to={`/product/${product._id}`}>
                    <h3 className="mb-1 truncate text-sm font-bold text-gray-900 transition-colors hover:text-orange-600">
                        {product.name}
                    </h3>
                </Link>

                <p className="mb-2 truncate text-[10px] text-gray-500">
                    {product.category}
                </p>

                <div className="mb-3 flex items-center justify-between">
                    <p className="text-base font-black text-gray-900">
                        ₹{product.price}
                    </p>

                    <span className="text-[9px] font-bold text-green-600">
                        In Stock
                    </span>
                </div>

                <div className="mt-auto space-y-1.5">
                    <Link
                        to={`/product/${product._id}`}
                        className="block rounded-md border border-gray-200 py-1.5 text-center text-[11px] font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                        View Details
                    </Link>

                    <button
                        onClick={() => addToCart(product)}
                        className="w-full rounded-md bg-orange-500 py-1.5 text-[11px] font-bold text-white transition hover:bg-orange-600 active:scale-[0.98]"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;