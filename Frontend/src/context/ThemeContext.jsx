import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useSocket } from './SocketContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [themeColor, setThemeColor] = useState(() => {
        try {
            return localStorage.getItem('dropcart_theme') || 'orange';
        } catch {
            return 'orange';
        }
    });

    const { socket } = useSocket() || {};

    // Apply data-theme attribute on <html> element
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeColor);
        try {
            localStorage.setItem('dropcart_theme', themeColor);
        } catch (e) {
            console.error('Failed to save theme to localStorage', e);
        }
    }, [themeColor]);

    // Fetch initial store settings
    useEffect(() => {
        let isMounted = true;
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/settings`);
                if (isMounted && data && data.themeColor) {
                    setThemeColor(data.themeColor);
                }
            } catch (err) {
                console.warn('Could not fetch initial theme settings:', err.message);
            }
        };
        fetchSettings();
        return () => {
            isMounted = false;
        };
    }, []);

    // Real-Time Socket.IO: Live update when admin publishes changes
    useEffect(() => {
        if (!socket) return;
        const onSettingsUpdate = (data) => {
            if (data && data.themeColor) {
                setThemeColor(data.themeColor);
            }
        };
        socket.on('settingsUpdated', onSettingsUpdate);
        return () => {
            socket.off('settingsUpdated', onSettingsUpdate);
        };
    }, [socket]);

    return (
        <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
