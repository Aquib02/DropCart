import { useState, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [category, setCategory] = useState('');
    const [countInStock, setCountInStock] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`,
                },
            };

            await axios.post(
                `${API_BASE_URL}/api/products`,
                { name, price, image, category, countInStock, description },
                config
            );

            setLoading(false);
            setMessage('Product Added Successfully!');

            setName('');
            setPrice('');
            setImage('');
            setCategory('');
            setCountInStock('');
            setDescription('');
        } catch (error) {
            setLoading(false);
            setMessage(error.response?.data?.message || 'Failed to add product');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-6 rounded-2xl bg-[#171717] p-6 text-white shadow-lg sm:p-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-2xl font-bold">
                            +
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
                                Admin Panel
                            </p>

                            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                                Add New Product
                            </h1>
                        </div>
                    </div>

                    <p className="mt-5 text-sm leading-6 text-gray-400">
                        Add product details below to make a new item available
                        in your store.
                    </p>
                </div>

                {/* Form */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
                    {message && (
                        <div
                            className={`mb-6 rounded-lg border p-4 text-sm font-semibold ${
                                message.includes('Successfully')
                                    ? 'border-green-200 bg-green-50 text-green-700'
                                    : 'border-red-200 bg-red-50 text-red-600'
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    <form onSubmit={submitHandler} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                Product Name
                            </label>

                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                placeholder="Enter product name"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Price (₹)
                                </label>

                                <input
                                    type="number"
                                    required
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    placeholder="Enter price"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Count In Stock
                                </label>

                                <input
                                    type="number"
                                    required
                                    value={countInStock}
                                    onChange={(e) =>
                                        setCountInStock(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    placeholder="Enter stock count"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                Image URL
                            </label>

                            <input
                                type="text"
                                required
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                placeholder="Paste image link"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                Category
                            </label>

                            <input
                                type="text"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                placeholder="Enter category"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                Description
                            </label>

                            <textarea
                                required
                                rows="4"
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                placeholder="Enter product description"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-orange-500 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Uploading...' : 'Upload Product'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;