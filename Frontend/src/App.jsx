import { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { AuthContext } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CompareDrawer from './components/CompareDrawer';
import AIAssistantDrawer from './components/AIAssistantDrawer';
import ToastNotification from './components/ToastNotification';
import PromotionalPopup from './components/PromotionalPopup';
import BroadcastBanner from './components/BroadcastBanner';
import MaintenanceNotice from './components/MaintenanceNotice';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

function AppContent() {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [maintenance, setMaintenance] = useState({ enabled: false, message: '' });

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/settings`)
            .then(res => {
                if (res.data?.maintenanceMode) {
                    setMaintenance(res.data.maintenanceMode);
                }
            })
            .catch(() => {});
    }, []);

    const isMaintenanceActive = maintenance.enabled &&
        !location.pathname.startsWith('/admin') &&
        user?.role !== 'admin' &&
        !user?.isAdmin;

    if (isMaintenanceActive) {
        return <MaintenanceNotice message={maintenance.message} />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f8f8f6]">
            <Navbar />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Customer Dashboard Hub & Aliases */}
                    <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                    <Route path="/profile" element={<CustomerDashboard />} />
                    <Route path="/my-orders" element={<CustomerDashboard />} />

                    {/* Enterprise Admin & Staff Control Center */}
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <CompareDrawer />
            <AIAssistantDrawer />
            <ToastNotification />
            <PromotionalPopup />
            <BroadcastBanner />
            <Footer />
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
