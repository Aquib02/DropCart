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
        permissions: {
            type: [String],
            default: [],
        },
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        // Loyalty Reward SuperCoins
        coins: {
            type: Number,
            default: 50,
        },
        deliveryPincode: {
            type: String,
            default: '110001',
        },
        deliveryCity: {
            type: String,
            default: 'New Delhi',
        },
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
            default: 'India',
        },
    },
    { timestamps: true }
);

// High performance user lookup indexes
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
