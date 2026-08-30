import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cartItems');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
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
                        countInStock: product.countInStock,
                        qty,
                    },
                ];
            }
        });
    };

    // Update item quantity directly from dropdown
    const updateCartQty = (productId, qty) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.product === productId ? { ...item, qty } : item
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

    // Calculate total price
    const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

    return (
        <CartContext.Provider
            value={{ cartItems, addToCart, updateCartQty, removeFromCart, clearCart, totalPrice }}
        >
            {children}
  S      </CartContext.Provider>
    );
};