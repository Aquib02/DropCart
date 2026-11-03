import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CompareDrawer from './components/CompareDrawer';
import AIAssistantDrawer from './components/AIAssistantDrawer';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

function App() {
    return (
        <Router>
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
                <Footer />
            </div>
        </Router>
    );
}

export default App;
