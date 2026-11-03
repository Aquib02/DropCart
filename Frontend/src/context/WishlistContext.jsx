import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(false);

    // Sync wishlist from user profile whenever user logs in or profile changes
    useEffect(() => {
        if (user && Array.isArray(user.wishlist)) {
            setWishlist(user.wishlist);
        } else if (!user) {
            setWishlist([]);
        }
    }, [user]);

    // Check if a product ID is in the wishlist
    const isInWishlist = (productId) => {
        if (!productId) return false;
        return wishlist.some((item) => {
            const id = typeof item === 'object' && item !== null ? item._id : item;
            return id === productId;
        });
    };

    // Toggle wishlist
    const toggleWishlist = async (product) => {
        if (!user) {
            return {
                requireAuth: true,
                message: 'Please sign in to add products to your wishlist.',
            };
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const productId = typeof product === 'object' ? product._id : product;
            const { data } = await axios.post(
                `${API_BASE_URL}/api/users/wishlist/${productId}`,
                {},
                config
            );

            setWishlist(data.wishlist || []);
            setLoading(false);
            return {
                requireAuth: false,
                success: true,
                message: data.message,
            };
        } catch (error) {
            setLoading(false);
            return {
                requireAuth: false,
                success: false,
                message: error.response?.data?.message || 'Failed to update wishlist',
            };
        }
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                isInWishlist,
                toggleWishlist,
                wishlistCount: wishlist.length,
                loading,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};
