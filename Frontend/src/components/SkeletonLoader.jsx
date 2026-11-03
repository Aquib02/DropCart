import React from 'react';

// Single Product Card Skeleton Loader
export const ProductCardSkeleton = () => (
    <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm animate-pulse">
        {/* Image Box */}
        <div className="aspect-square w-full rounded-xl bg-gray-200/70 mb-3" />
        {/* Category Tag */}
        <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
        {/* Title */}
        <div className="h-4 w-4/5 bg-gray-200 rounded mb-1.5" />
        {/* Rating */}
        <div className="h-3 w-20 bg-gray-200/80 rounded mb-3" />
        {/* Price & CTA Button */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-20 bg-gray-200 rounded-xl" />
        </div>
    </div>
);

// Grid of Product Skeletons
export const ProductGridSkeleton = ({ count = 8 }) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {[...Array(count)].map((_, idx) => (
            <ProductCardSkeleton key={idx} />
        ))}
    </div>
);

// Order Item Skeleton
export const OrderCardSkeleton = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse mb-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-4 py-2">
            <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-24 bg-gray-200 rounded" />
        </div>
    </div>
);

// Generic Table Skeleton
export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
            {[...Array(rows)].map((_, rIdx) => (
                <div key={rIdx} className="flex gap-4">
                    {[...Array(cols)].map((_, cIdx) => (
                        <div key={cIdx} className="h-4 bg-gray-200/80 rounded flex-1" />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export default {
    ProductCardSkeleton,
    ProductGridSkeleton,
    OrderCardSkeleton,
    TableSkeleton,
};
