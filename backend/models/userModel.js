const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        // Role-based access control: 'admin', 'staff', or 'customer'
        role: {
            type: String,
            enum: ['admin', 'staff', 'customer'],
            default: 'customer',
        },
        isAdmin: {
            type: Boolean,
            required: true,
            default: false,
        },
        // Granular permissions for staff members
        // Options: 'manage_products', 'manage_orders', 'manage_appearance', 'manage_staff'
        permissions: {
            type: [String],
            default: [],
        },
        // Customer Wishlist (Array of Product ObjectIds)
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        phone: {
            type: String,
            default: '',
        },
        address: {
            type: String,
            default: '',
        },
        city: {
            type: String,
            default: '',
        },
        postalCode: {
            type: String,
            default: '',
        },
        country: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
