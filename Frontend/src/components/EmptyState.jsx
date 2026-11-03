import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX, ShoppingBag, Heart, PackageX, AlertCircle, RefreshCw } from 'lucide-react';

const EmptyState = ({
    type = 'no-products',
    title,
    description,
    actionText,
    actionLink,
    onAction,
}) => {
    const config = {
        'no-products': {
            icon: SearchX,
            color: 'text-amber-500 bg-amber-50 border-amber-200',
            defaultTitle: 'No Matching Products Found',
            defaultDesc: 'Try adjusting your search query, clearing filters, or browsing other popular categories.',
            defaultAction: 'Browse All Products',
            defaultLink: '/shop',
        },
        'empty-cart': {
            icon: ShoppingBag,
            color: 'text-blue-500 bg-blue-50 border-blue-200',
            defaultTitle: 'Your Shopping Cart is Empty',
            defaultDesc: 'Explore our latest festival deals, trending electronics, and top brand discounts to fill your cart.',
            defaultAction: 'Start Shopping Now',
            defaultLink: '/shop',
        },
        'empty-wishlist': {
            icon: Heart,
            color: 'text-rose-500 bg-rose-50 border-rose-200',
            defaultTitle: 'Your Wishlist is Empty',
            defaultDesc: 'Tap the heart icon on any product you love to save it here for quick access later.',
            defaultAction: 'Discover Trending Items',
            defaultLink: '/shop',
        },
        'empty-orders': {
            icon: PackageX,
            color: 'text-orange-500 bg-orange-50 border-orange-200',
            defaultTitle: 'No Orders Placed Yet',
            defaultDesc: 'Once you order items, you can track their shipment, view invoices, and manage returns right here.',
            defaultAction: 'Browse Catalog',
            defaultLink: '/shop',
        },
        'error': {
            icon: AlertCircle,
            color: 'text-red-500 bg-red-50 border-red-200',
            defaultTitle: 'Something Went Wrong',
            defaultDesc: 'We could not fetch the latest catalog data. Please check your connection and retry.',
            defaultAction: 'Try Again',
            defaultLink: null,
        },
    };

    const current = config[type] || config['no-products'];
    const Icon = current.icon;

    return (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-gray-200 bg-white shadow-xs my-6 animate-in fade-in duration-300">
            <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 shadow-sm ${current.color}`}>
                <Icon className="w-8 h-8" />
            </div>

            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {title || current.defaultTitle}
            </h3>

            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-md leading-relaxed">
                {description || current.defaultDesc}
            </p>

            {(actionText || current.defaultAction) && (
                <div className="mt-5">
                    {onAction ? (
                        <button
                            onClick={onAction}
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {actionText || current.defaultAction}
                        </button>
                    ) : (
                        <Link
                            to={actionLink || current.defaultLink}
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
                        >
                            {actionText || current.defaultAction}
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
