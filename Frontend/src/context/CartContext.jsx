import { createContext, useState, useEffect, useContext } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cartItems');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        } catch (e) {
            console.error('Failed to save cart to localStorage', e);
        }
    }, [cartItems]);

    // Add item to cart or increment quantity
    const addToCart = (product, qty = 1) => {
        setCartItems((prevItems) => {
            const existItem = prevItems.find((item) => item.product === product._id);

            if (existItem) {
                return prevItems.map((item) =>
                    item.product === product._id
                        ? { ...item, qty: item.qty + qty }
                        : item
                );
            } else {
                return [
                    ...prevItems,
                    {
                        product: product._id,
                        name: product.name,
                        image: product.image,
                        price: product.price,
                        countInStock: product.countInStock !== undefined ? product.countInStock : 10,
                        category: product.category,
                        qty,
                    },
                ];
            }
        });
    };

    // Update item quantity directly
    const updateCartQty = (productId, qty) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.product === productId ? { ...item, qty: Math.max(1, qty) } : item
            )
        );
    };

    // Remove item from cart
    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.product !== id));
    };

    // Clear cart after checkout
    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('cartItems');
    };

    // Total price
    const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

    // Total item count for Navbar badge
    const totalCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                updateCartQty,
                removeFromCart,
                clearCart,
                totalPrice,
                totalCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
