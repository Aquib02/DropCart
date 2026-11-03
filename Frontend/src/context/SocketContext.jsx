import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Connect to backend server on origin port 5000 or relative
        const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
        const newSocket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
        });

        setSocket(newSocket);

        // Retrieve logged-in user info
        const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
        if (userInfo?._id) {
            newSocket.emit('join_user', userInfo._id);
            if (userInfo.role === 'admin' || userInfo.role === 'staff' || userInfo.isAdmin) {
                newSocket.emit('join_admin');
            }
        }

        // Listen for live order updates
        newSocket.on('orderStatusUpdated', (data) => {
            const notif = {
                id: Date.now(),
                type: 'order',
                title: 'Order Status Updated',
                message: `Order #${String(data.orderId).slice(-6)} is now ${data.status}.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                data,
            };
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // Listen for price drop alerts
        newSocket.on('priceDropAlert', (data) => {
            const notif = {
                id: Date.now(),
                type: 'price_drop',
                title: 'Mega Price Drop Alert! 🔥',
                message: `${data.name} just dropped to ₹${Number(data.newPrice).toLocaleString('en-IN')} (${data.discountPercent}% OFF)!`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                data,
            };
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // Listen for admin low stock alerts
        newSocket.on('lowStockAlert', (data) => {
            const notif = {
                id: Date.now(),
                type: 'low_stock',
                title: '⚠️ Low Stock Warning',
                message: `${data.name} has only ${data.stock} units left in stock!`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                data,
            };
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const markAllAsRead = () => {
        setUnreadCount(0);
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <SocketContext.Provider
            value={{
                socket,
                notifications,
                unreadCount,
                markAllAsRead,
                clearNotifications,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
