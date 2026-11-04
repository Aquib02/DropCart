import { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

const ImageLightboxModal = ({
    isOpen,
    onClose,
    images = [],
    initialIndex = 0,
    productTitle = 'Product Image',
    productPrice = null
}) => {
    // Normalise images to array
    const imageList = Array.isArray(images) && images.length > 0
        ? images
        : typeof images === 'string' && images ? [images] : [];

    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // Sync activeIndex with initialIndex when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveIndex(initialIndex >= 0 && initialIndex < imageList.length ? initialIndex : 0);
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
        }
    }, [isOpen, initialIndex, imageList.length]);

    // Handle Keyboard events: Esc to close, ArrowLeft/Right to navigate, +/- to zoom
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === '+' || e.key === '=') {
                handleZoomIn();
            } else if (e.key === '-') {
                handleZoomOut();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // Prevent background page scrolling while modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, activeIndex, imageList.length, zoomLevel]);

    if (!isOpen || imageList.length === 0) return null;

    const currentImg = imageList[activeIndex];

    const handleNext = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
        setActiveIndex((prev) => (prev + 1) % imageList.length);
    };

    const handlePrev = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
        setActiveIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    };

    const handleZoomIn = () => {
        setZoomLevel((prev) => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = () => {
        setZoomLevel((prev) => {
            const next = Math.max(prev - 0.5, 1);
            if (next === 1) setPanOffset({ x: 0, y: 0 });
            return next;
        });
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    };

    // Toggle zoom on image click
    const handleImageClick = (e) => {
        // If user was dragging, do not toggle zoom
        if (isDragging) return;
        if (zoomLevel === 1) {
            setZoomLevel(2);
        } else {
            handleResetZoom();
        }
    };

    // Mouse drag for panning when zoomed in
    const handleMouseDown = (e) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            dragStartRef.current = {
                x: e.clientX - panOffset.x,
                y: e.clientY - panOffset.y
            };
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoomLevel > 1) {
            setPanOffset({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col justify-between bg-black/92 backdrop-blur-md animate-in fade-in duration-200 select-none"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* TOP BAR: Title, Counter & Action Controls */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm sm:px-6">
                <div className="flex items-center gap-3 max-w-[60%] sm:max-w-xl">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
                        <Maximize2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-xs font-black text-white sm:text-sm">
                            {productTitle}
                        </h3>
                        <p className="text-[11px] text-gray-400">
                            {imageList.length > 1 ? `Image ${activeIndex + 1} of ${imageList.length}` : 'High Resolution Product View'}
                            {productPrice && <span className="ml-2 font-bold text-orange-400">• ₹{Number(productPrice).toLocaleString('en-IN')}</span>}
                        </p>
                    </div>
                </div>

                {/* Controls (Zoom & Close) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 3}
                        className="rounded-xl border border-white/10 bg-white/10 p-2 text-white hover:bg-white/20 transition disabled:opacity-30"
                        title="Zoom In (+)"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>

                    <button
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 1}
                        className="rounded-xl border border-white/10 bg-white/10 p-2 text-white hover:bg-white/20 transition disabled:opacity-30"
                        title="Zoom Out (-)"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </button>

                    {zoomLevel > 1 && (
                        <button
                            onClick={handleResetZoom}
                            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
                            title="Reset Zoom (1x)"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">1x</span>
                        </button>
                    )}

                    <div className="mx-1 h-5 w-px bg-white/20" />

                    <button
                        onClick={onClose}
                        className="flex items-center justify-center rounded-xl bg-white/20 p-2 text-white hover:bg-red-600 transition"
                        title="Close (Esc)"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* CENTER VIEWPORT: The Large Image */}
            <div
                className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                {/* Previous Arrow */}
                {imageList.length > 1 && (
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xs hover:bg-white/30 transition shadow-lg"
                        title="Previous (Left Arrow)"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                )}

                {/* The Enlarged Image */}
                <div className="flex h-full w-full items-center justify-center">
                    <img
                        src={currentImg}
                        alt={productTitle}
                        onClick={handleImageClick}
                        draggable={false}
                        style={{
                            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                        }}
                        className="max-h-[75vh] max-w-[90vw] object-contain transition-transform duration-200 ease-out drop-shadow-2xl rounded-xl"
                    />
                </div>

                {/* Next Arrow */}
                {imageList.length > 1 && (
                    <button
                        onClick={handleNext}
                        className="absolute right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xs hover:bg-white/30 transition shadow-lg"
                        title="Next (Right Arrow)"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                )}
            </div>

            {/* BOTTOM BAR: Thumbnail Strip & Instruction Hint */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-2 border-t border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm sm:px-6">
                {imageList.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                        {imageList.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setZoomLevel(1);
                                    setPanOffset({ x: 0, y: 0 });
                                    setActiveIndex(idx);
                                }}
                                className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl border-2 p-0.5 transition ${
                                    activeIndex === idx
                                        ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105'
                                        : 'border-white/20 opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img src={img} alt="" className="h-full w-full object-contain rounded-lg bg-white/5" />
                            </button>
                        ))}
                    </div>
                )}

                <p className="text-[10px] text-gray-400">
                    💡 Click image to zoom {zoomLevel === 1 ? 'in (2x)' : 'out'} • Use arrow keys to navigate • Press Esc to close
                </p>
            </div>
        </div>
    );
};

export default ImageLightboxModal;
