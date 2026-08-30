import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard'; // <-- Check karein ye import hai ya nahi
import Profile from './pages/Profile';
import Orders from './pages/Orders';
function App() {
    return (
        <Router>
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Navbar />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/product/:id" element={<ProductDetails />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/my-orders" element={<Orders />} />
                        {/* Yahin dhyan dein ki /admin par AdminDashboard render ho */}
                        <Route path="/admin/dashboard" element={<AdminDashboard />} /> 
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;