import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Camera, Upload, X, Sparkles, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const CATEGORY_TABS = [
    { label: 'All Items', value: '' },
    { label: '👞 Footwear & Shoes', value: 'Shoes' },
    { label: '👕 Fashion & Wear', value: 'Fashion' },
    { label: '📱 Mobiles', value: 'Mobiles' },
    { label: '💻 Electronics', value: 'Electronics' },
];

const VisualSearchModal = ({ isOpen, onClose }) => {
    const [imagePreview, setImagePreview] = useState(null);
    const [cachedFile, setCachedFile] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [matchedProducts, setMatchedProducts] = useState([]);
    const [searchMessage, setSearchMessage] = useState('');
    const [detectedInfo, setDetectedInfo] = useState({ item: '', category: '' });
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
            setCachedFile({ name: file.name, type: file.type, base64: base64Data });
            performVisualSearch(file.name, base64Data, file.type, selectedCategory);
        };
        reader.readAsDataURL(file);
    };

    const performVisualSearch = async (fileName, base64, mimeType = 'image/jpeg', targetCat = '') => {
        setLoading(true);
        setMatchedProducts([]);
        setSearchMessage('');

        try {
            // Extract tokens from filename if available
            const nameTokens = (fileName || '')
                .replace(/\.[^/.]+$/, '')
                .replace(/[-_]/g, ' ')
                .split(' ')
                .filter(w => w.length > 2)
                .join(' ');

            const { data } = await axios.post(`${API_BASE_URL}/api/ai/visual-search`, {
                imageBase64: base64,
                mimeType: mimeType || 'image/jpeg',
                fileName: fileName || '',
                visualKeywords: nameTokens,
                category: targetCat
            });

            if (data.success) {
                setMatchedProducts(data.products || []);
                setDetectedInfo({
                    item: data.detectedItem || 'Identified Product',
                    category: data.detectedCategory || ''
                });
                setSearchMessage(data.message || 'Found matching items in stock');
            } else {
                setSearchMessage(data.message || 'No direct visual matches found.');
            }
        } catch (err) {
            setSearchMessage('Could not analyze the image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (catVal) => {
        setSelectedCategory(catVal);
        if (cachedFile?.base64) {
            performVisualSearch(cachedFile.name, cachedFile.base64, cachedFile.type, catVal);
        }
    };

    const reset = () => {
        setImagePreview(null);
        setCachedFile(null);
        setMatchedProducts([]);
        setSearchMessage('');
        setDetectedInfo({ item: '', category: '' });
        setSelectedCategory('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[88vh]">
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
                            <p className="text-[11px] text-gray-400">Scan product image and match in-stock catalog inventory</p>
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
                <div className="mt-3">
                    {!imagePreview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) processFile(file);
                            }}
                            className="cursor-pointer border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-7 flex flex-col items-center justify-center text-center bg-amber-50/40 hover:bg-amber-50/80 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500 mb-2 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-gray-800">
                                Drag & drop photo of shoes, clothes, or gadget, or <span className="text-orange-600 underline">browse</span>
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
                        <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                            <img
                                src={imagePreview}
                                alt="Uploaded preview"
                                className="w-14 h-14 rounded-xl object-contain bg-white border shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-gray-900">Uploaded Photo</span>
                                    {detectedInfo.item && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            Grounded
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                    {loading ? 'Analyzing visual attributes & finding stock...' : (searchMessage || 'Search complete')}
                                </p>
                            </div>
                            <button
                                onClick={reset}
                                className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-red-600 bg-white border rounded-xl shadow-2xs shrink-0"
                            >
                                Change
                            </button>
                        </div>
                    )}
                </div>

                {/* AI Detected Tag & Category Filter Pills */}
                {imagePreview && (
                    <div className="mt-3 space-y-2">
                        {detectedInfo.item && (
                            <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/90 px-3 py-1.5 rounded-xl text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-amber-950 truncate">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>AI Detected: <strong>{detectedInfo.item}</strong></span>
                                </div>
                                {detectedInfo.category && (
                                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded shrink-0 ml-2">
                                        {detectedInfo.category}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {CATEGORY_TABS.map((tab) => (
                                <button
                                    key={tab.label}
                                    onClick={() => handleCategoryClick(tab.value)}
                                    className={`text-[11px] px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition ${
                                        selectedCategory === tab.value
                                            ? 'bg-amber-600 text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Results */}
                <div className="mt-3 flex-1 overflow-y-auto pr-1">
                    {loading && (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                            <p className="text-xs font-bold text-gray-800">Scanning inventory for visual footwear & apparel matches...</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Filtering in-stock catalog products</p>
                        </div>
                    )}

                    {!loading && matchedProducts.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    In-Stock Matches ({matchedProducts.length})
                                </h4>
                                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Stock Ready
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {matchedProducts.map((prod) => (
                                    <div
                                        key={prod._id}
                                        className="rounded-2xl border border-gray-200/90 p-3 bg-white hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="relative mb-2">
                                                <img
                                                    src={prod.image || prod.images?.[0]}
                                                    alt={prod.name}
                                                    className="w-full h-28 object-contain rounded-xl bg-gray-50/80 p-1.5 group-hover:scale-102 transition-transform"
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80';
                                                    }}
                                                />
                                                <span className="absolute top-1.5 left-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                                    In Stock
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">
                                                {prod.name}
                                            </p>
                                            <div className="mt-1 flex items-baseline gap-1.5">
                                                <span className="text-xs font-black text-gray-950">
                                                    ₹{Number(prod.price || prod.discountPrice || 0).toLocaleString('en-IN')}
                                                </span>
                                                {prod.originalPrice > prod.price && (
                                                    <span className="text-[10px] text-gray-400 line-through">
                                                        ₹{Number(prod.originalPrice).toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-500">
                                                <span className="font-bold text-amber-600">★ {prod.rating || 4.5}</span>
                                                <span>•</span>
                                                <span className="truncate">{prod.category || 'Fashion'}</span>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/product/${prod._id}`}
                                            onClick={onClose}
                                            className="mt-2.5 flex items-center justify-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl py-1.5 shadow-2xs transition"
                                        >
                                            View Product <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && imagePreview && matchedProducts.length === 0 && (
                        <div className="py-10 text-center flex flex-col items-center">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-gray-800">No matching in-stock items found</p>
                            <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                                We couldn't find items matching "{detectedInfo.item || 'this item'}". Try clicking one of the category pills above or upload another photo.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisualSearchModal;
