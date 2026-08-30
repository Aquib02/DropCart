import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('userInfo'));
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    // Login Function
    const login = async (email, password) => {
        try {
            const { data } = await axios.post('http://localhost:5000/api/users/login', {
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
            const { data } = await axios.post('http://localhost:5000/api/users/register', {
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

    // New: Update User Info Function (Profile update ke baad call hoga)
    const updateUser = (updatedData) => {
        const newUserInfo = { ...user, ...updatedData };
        setUser(newUserInfo);
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
    };

    // Logout Function
    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};