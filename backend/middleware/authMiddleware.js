const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Protect routes: verify JWT Bearer token
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }
            return next();
        } catch (error) {
            console.error('Auth Middleware Error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Admin check middleware (strictly admin)
const admin = (req, res, next) => {
    if (req.user && (req.user.isAdmin || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ message: 'Access denied: Administrator privileges required' });
};

// Permission check middleware: Admin has access to everything;
// Staff members must have the specific permission in their permissions array
const hasPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Full admins bypass all permission checks
        if (req.user.isAdmin || req.user.role === 'admin') {
            return next();
        }

        // Check if staff has the permission
        if (
            req.user.role === 'staff' &&
            Array.isArray(req.user.permissions) &&
            req.user.permissions.includes(permission)
        ) {
            return next();
        }

        return res.status(403).json({
            message: `Access denied: Missing '${permission}' permission`,
        });
    };
};

module.exports = { protect, admin, hasPermission };
