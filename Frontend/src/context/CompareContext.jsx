import { createContext, useState, useEffect } from 'react';

export const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
    const [compareItems, setCompareItems] = useState(() => {
        try {
            const saved = localStorage.getItem('dropcart_compare');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem('dropcart_compare', JSON.stringify(compareItems));
        } catch (e) {
            console.error('Failed to save comparison to localStorage', e);
        }
    }, [compareItems]);

    const addToCompare = (product) => {
        if (!product || !product._id) return { success: false, message: 'Invalid product' };

        const exists = compareItems.find((p) => p._id === product._id);
        if (exists) {
            return { success: false, message: 'Product already added to comparison' };
        }

        if (compareItems.length >= 4) {
            return { success: false, message: 'You can compare a maximum of 4 products at once' };
        }

        setCompareItems((prev) => [...prev, product]);
        return { success: true, message: `Added "${product.name.slice(0, 30)}..." to comparison` };
    };

    const removeFromCompare = (productId) => {
        setCompareItems((prev) => prev.filter((p) => p._id !== productId));
    };

    const clearCompare = () => {
        setCompareItems([]);
        setIsCompareModalOpen(false);
    };

    const isInCompare = (productId) => {
        if (!productId) return false;
        return compareItems.some((p) => p._id === productId);
    };

    return (
        <CompareContext.Provider
            value={{
                compareItems,
                addToCompare,
                removeFromCompare,
                clearCompare,
                isInCompare,
                isCompareModalOpen,
                setIsCompareModalOpen,
            }}
        >
            {children}
        </CompareContext.Provider>
    );
};
