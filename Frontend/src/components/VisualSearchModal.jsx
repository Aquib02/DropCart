import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Camera, Upload, X, Sparkles, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const VisualSearchModal = ({ isOpen, onClose }) => {
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [matchedProducts, setMatchedProducts] = useState([]);
    const [searchMessage, setSearchMessage] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result;
            setImagePreview(base64Data);
            performVisualSearch(file.name, base64Data);
        };
        reader.readAsDataURL(file);
    };

    const performVisualSearch = async (fileName, base64) => {
        setLoading(true);
        setMatchedProducts([]);
        setSearchMessage('');

        try {
            // Extract keywords from filename or category guess
            const nameTokens = fileName
                .replace(/\.[^/.]+$/, '')
                .replace(/[-_]/g, ' ')
                .split(' ')
                .filter(w => w.length > 2)
                .join(' ');

            const { data } = await axios.post('/api/ai/visual-search', {
                visualKeywords: nameTokens || 'phone laptop shoe jacket watch headphone',
                category: ''
            });

            if (data.success) {
                setMatchedProducts(data.products || []);
                setSearchMessage(data.message || `Found matching items for your image`);
            }
        } catch (err) {
            setSearchMessage('Could not analyze the image. Please try another photo.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setImagePreview(null);
        setMatchedProducts([]);
        setSearchMessage('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
                            <Camera className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                                AI Visual Search
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    Gemini Vision
                                </span>
                            </h3>
                            <p className="text-[11px] text-gray-400">Search products by uploading an image or photo</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            reset();
                            onClose();
                        }}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Upload or Preview Box */}
                <div className="mt-4">
                    {!imagePreview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) processFile(file);
                            }}
                            className="cursor-pointer border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-amber-50/40 hover:bg-amber-50/80 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-gray-800">
                                Drag and drop a product image here, or <span className="text-orange-600 underline">browse</span>
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">Supports JPG, PNG, WEBP (Max 5MB)</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                            <img
                                src={imagePreview}
                                alt="Uploaded preview"
                                className="w-16 h-16 rounded-xl object-contain bg-white border"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">Image uploaded</p>
                                <p className="text-[11px] text-gray-500">
                                    {loading ? 'AI is scanning catalog for visual matches...' : searchMessage}
                                </p>
                            </div>
                            <button
                                onClick={reset}
                                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-red-600 bg-white border rounded-xl shadow-2xs"
                            >
                                Change
                            </button>
                        </div>
                    )}
                </div>

                {/* Search Results */}
                <div className="mt-4 flex-1 overflow-y-auto">
                    {loading && (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                            <p className="text-xs font-bold text-gray-700">Analyzing visual features & colors...</p>
                            <p className="text-[11px] text-gray-400">Comparing with real DropCart inventory</p>
                        </div>
                    )}

                    {!loading && matchedProducts.length > 0 && (
                        <div>
                            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Visually Similar Items ({matchedProducts.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {matchedProducts.map((prod) => (
                                    <div
                                        key={prod._id}
                                        className="rounded-2xl border border-gray-200 p-3 bg-white hover:border-amber-400 transition shadow-2xs flex flex-col justify-between"
                                    >
                                        <div>
                                            <img
                                                src={prod.image || prod.images?.[0]}
                                                alt={prod.name || prod.title}
                                                className="w-full h-24 object-contain rounded-xl bg-gray-50 p-1 mb-2"
                                            />
                                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{prod.name || prod.title}</p>
                                            <p className="text-xs font-black text-gray-950 mt-1">
                                                ₹{Number(prod.price || prod.discountPrice).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <Link
                                            to={`/product/${prod._id}`}
                                            onClick={onClose}
                                            className="mt-2.5 flex items-center justify-center gap-1 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl py-1.5 transition"
                                        >
                                            View Product <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisualSearchModal;
