const User = require('../models/userModel');
const AuditLog = require('../models/auditLogModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate('wishlist', 'name price image category countInStock isOutOfStock');

        if (user && (await bcrypt.compare(password, user.password))) {
            if (user.isBlocked) {
                return res.status(403).json({
                    message: `Your customer account has been suspended. Reason: ${user.blockReason || 'Policy review'}. Please contact support.`
                });
            }
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || (user.isAdmin ? 'admin' : 'customer'),
                isAdmin: user.isAdmin,
                permissions: user.permissions || [],
                wishlist: user.wishlist || [],
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // If this is the very first user in the database, promote to Admin!
        const userCount = await User.countDocuments({});
        const isFirstUser = userCount === 0;
        const role = isFirstUser ? 'admin' : 'customer';
        const isAdmin = isFirstUser;
        const permissions = isFirstUser
            ? ['manage_products', 'manage_orders', 'manage_appearance', 'manage_staff']
            : [];

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            isAdmin,
            permissions,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
                permissions: user.permissions,
                wishlist: [],
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user registration data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile + wishlist
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate(
            'wishlist',
            'name price image category countInStock isOutOfStock'
        );

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
                permissions: user.permissions || [],
                wishlist: user.wishlist || [],
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                postalCode: user.postalCode || '',
                country: user.country || '',
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
            user.address = req.body.address !== undefined ? req.body.address : user.address;
            user.city = req.body.city !== undefined ? req.body.city : user.city;
            user.postalCode = req.body.postalCode !== undefined ? req.body.postalCode : user.postalCode;
            user.country = req.body.country !== undefined ? req.body.country : user.country;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();
            const populated = await User.findById(updatedUser._id).populate(
                'wishlist',
                'name price image category countInStock isOutOfStock'
            );

            res.json({
                _id: populated._id,
                name: populated.name,
                email: populated.email,
                role: populated.role,
                isAdmin: populated.isAdmin,
                permissions: populated.permissions || [],
                wishlist: populated.wishlist || [],
                phone: populated.phone,
                address: populated.address,
                city: populated.city,
                postalCode: populated.postalCode,
                country: populated.country,
                token: generateToken(populated._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle item in wishlist (Add / Remove)
// @route   POST /api/users/wishlist/:productId
// @access  Private
const toggleWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { productId } = req.params;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isExist = user.wishlist.some(
            (id) => id.toString() === productId.toString()
        );

        if (isExist) {
            user.wishlist = user.wishlist.filter(
                (id) => id.toString() !== productId.toString()
            );
        } else {
            user.wishlist.push(productId);
        }

        await user.save();
        const updatedUser = await User.findById(user._id).populate(
            'wishlist',
            'name price image category countInStock isOutOfStock'
        );

        res.json({
            message: isExist ? 'Removed from wishlist' : 'Added to wishlist',
            wishlist: updatedUser.wishlist,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// STAFF & ROLE MANAGEMENT (Admin Only)
// ==========================================

// @desc    Get all staff & admin users
// @route   GET /api/users/staff
// @access  Private / Admin or Permission manage_staff
const getAllStaff = async (req, res) => {
    try {
        const staff = await User.find({
            role: { $in: ['admin', 'staff'] },
        }).select('-password');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new staff member with custom permissions
// @route   POST /api/users/staff
// @access  Private / Admin
const createStaffUser = async (req, res) => {
    try {
        const { name, email, password, role, permissions } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'Staff@1234', salt);

        // Pre-configure permissions based on role if not provided
        let userPermissions = permissions || [];
        if (userPermissions.length === 0) {
            if (role === 'product_manager') userPermissions = ['manage_products', 'manage_inventory'];
            else if (role === 'inventory_manager') userPermissions = ['manage_inventory'];
            else if (role === 'order_manager') userPermissions = ['manage_orders'];
            else if (role === 'marketing_manager') userPermissions = ['manage_campaigns', 'manage_coupons', 'manage_appearance'];
            else if (role === 'customer_support') userPermissions = ['manage_customers', 'manage_reviews'];
            else if (role === 'admin' || role === 'super_admin') userPermissions = ['manage_products', 'manage_inventory', 'manage_orders', 'manage_coupons', 'manage_campaigns', 'manage_appearance', 'manage_customers', 'manage_reviews', 'manage_staff'];
        }

        const staffUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'staff',
            isAdmin: role === 'admin' || role === 'super_admin',
            permissions: userPermissions,
        });

        // Audit Trail
        await AuditLog.create({
            user: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'STAFF_CREATED',
            resource: 'Staff Management',
            details: `Created new staff account "${name}" (${email}) with role: ${role || 'staff'}`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.status(201).json({
            _id: staffUser._id,
            name: staffUser.name,
            email: staffUser.email,
            role: staffUser.role,
            isAdmin: staffUser.isAdmin,
            permissions: staffUser.permissions,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update staff role and permissions
// @route   PUT /api/users/staff/:id
// @access  Private / Admin
const updateStaffPermissions = async (req, res) => {
    try {
        const staffUser = await User.findById(req.params.id);

        if (!staffUser) {
            return res.status(404).json({ message: 'Staff user not found' });
        }

        // Prevent admin from removing their own admin status accidentally
        if (staffUser._id.toString() === req.user._id.toString() && req.body.role === 'customer') {
            return res.status(400).json({ message: 'Cannot demote yourself' });
        }

        staffUser.name = req.body.name || staffUser.name;
        staffUser.role = req.body.role || staffUser.role;
        staffUser.isAdmin = staffUser.role === 'admin' || staffUser.role === 'super_admin';
        if (req.body.permissions) {
            staffUser.permissions = req.body.permissions;
        }

        const updated = await staffUser.save();

        // Audit Trail
        await AuditLog.create({
            user: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'STAFF_PERMISSIONS_UPDATED',
            resource: 'Staff Management',
            details: `Updated role (${updated.role}) and permissions for staff user "${updated.name}" (${updated.email})`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.json({
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
            isAdmin: updated.isAdmin,
            permissions: updated.permissions,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a staff member
// @route   DELETE /api/users/staff/:id
// @access  Private / Admin
const deleteStaffUser = async (req, res) => {
    try {
        const staffUser = await User.findById(req.params.id);

        if (!staffUser) {
            return res.status(404).json({ message: 'Staff user not found' });
        }

        if (staffUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own admin account' });
        }

        const deletedName = staffUser.name;
        const deletedEmail = staffUser.email;

        await staffUser.deleteOne();

        // Audit Trail
        await AuditLog.create({
            user: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'STAFF_DELETED',
            resource: 'Staff Management',
            details: `Revoked access and deleted staff account "${deletedName}" (${deletedEmail})`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.json({ message: 'Staff user removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system audit activity logs
// @route   GET /api/users/audit-logs
// @access  Private / Admin
const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle Two-Factor Authentication requirement
// @route   POST /api/users/toggle-2fa
// @access  Private / Admin or Staff
const toggleTwoFactor = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.twoFactorEnabled = !user.twoFactorEnabled;
        await user.save();

        await AuditLog.create({
            user: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: user.twoFactorEnabled ? '2FA_ENABLED' : '2FA_DISABLED',
            resource: 'Security & Access',
            details: `Two-Factor Authentication was ${user.twoFactorEnabled ? 'enabled' : 'disabled'} for ${user.email}`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.json({
            success: true,
            twoFactorEnabled: user.twoFactorEnabled,
            message: `Two-Factor Authentication is now ${user.twoFactorEnabled ? 'ACTIVE (Requires 2FA Code)' : 'DISABLED'}.`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all registered users / customers
// @route   GET /api/users
// @access  Private / Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    authUser,
    getUserProfile,
    updateUserProfile,
    toggleWishlist,
    getAllStaff,
    createStaffUser,
    updateStaffPermissions,
    deleteStaffUser,
    getAuditLogs,
    toggleTwoFactor,
    getAllUsers,
};
