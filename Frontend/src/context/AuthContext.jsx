import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('userInfo');
            }
        }
        setLoading(false);
    }, []);

    // Login Function
    const login = async (email, password) => {
        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/users/login`, {
                email,
                password,
            });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    };

    // Register Function
    const register = async (name, email, password) => {
        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/users/register`, {
                name,
                email,
                password,
            });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
            };
        }
    };

    // Update User Info Function
    const updateUser = (updatedData) => {
        const newUserInfo = { ...user, ...updatedData };
        setUser(newUserInfo);
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
    };

    // Refresh User Profile from server
    const refreshProfile = async () => {
        if (!user || !user.token) return;
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.get(`${API_BASE_URL}/api/users/profile`, config);
            updateUser({
                ...data,
                token: user.token,
            });
        } catch (error) {
            console.error('Failed to refresh profile', error);
        }
    };

    // Logout Function
    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                updateUser,
                refreshProfile,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
