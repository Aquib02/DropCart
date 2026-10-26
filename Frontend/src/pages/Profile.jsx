import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
    const { user, updateUser } = useContext(AuthContext);
    
    // View/Edit toggle state
    const [isEditing, setIsEditing] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                    },
                };

                const { data } = await axios.get(
                    `${API_BASE_URL}/api/users/profile`,
                    config
                );
                
                setName(data.name || '');
                setEmail(data.email || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
                setLoading(false);
            } catch (err) {
                setError('Failed to load profile');
                setLoading(false);
            }
        };

        if (user) fetchProfile();
    }, [user]);

    const submitHandler = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user?.token}`,
                },
            };

            const { data } = await axios.put(
                `${API_BASE_URL}/api/users/profile`,
                { name, email, phone, address },
                config
            );
            
            updateUser(data);
            setMessage('Profile Updated Successfully!');
            setIsEditing(false);
        } catch (err) {
            setError('Failed to update profile');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f8f6] px-4 py-12">
                <div className="mx-auto max-w-2xl animate-pulse rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-gray-200" />
                        <div className="space-y-2">
                            <div className="h-5 w-32 rounded bg-gray-200" />
                            <div className="h-3 w-48 rounded bg-gray-200" />
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="h-12 rounded-lg bg-gray-100" />
                        <div className="h-12 rounded-lg bg-gray-100" />
                        <div className="h-12 rounded-lg bg-gray-100" />
                        <div className="h-12 rounded-lg bg-gray-100" />
                    </div>
                </div>
            </div>
        );
    }

    // User ke naam ka initial
    const initial = name
        ? name.charAt(0).toUpperCase()
        : 'U';

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">

                {/* Page Heading */}
                <div className="mb-7">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-orange-500" />

                        <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                            Account
                        </p>
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                        My Profile
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Manage your personal information and account details.
                    </p>
                </div>

                {/* Profile Card */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                    {/* Profile Header */}
                    <div className="bg-[#171717] px-6 py-6 text-white sm:px-8">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">

                                {/* Avatar */}
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xl font-black text-white shadow-lg shadow-orange-950/30">
                                    {initial}
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                                        Personal Account
                                    </p>

                                    <h2 className="mt-1 truncate text-lg font-black">
                                        {name || 'My Account'}
                                    </h2>
                                </div>
                            </div>

                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="shrink-0 rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-orange-500"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8">

                        {/* Success Message */}
                        {message && (
                            <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
                                <span>✓</span>
                                {message}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                                <span>!</span>
                                {error}
                            </div>
                        )}

                        {/* VIEW MODE */}
                        {!isEditing ? (
                            <div className="space-y-1">

                                {/* Name */}
                                <div className="flex flex-col gap-1 border-b border-gray-100 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            Full Name
                                        </p>
                                    </div>

                                    <p className="text-sm font-bold text-gray-900 sm:text-right">
                                        {name || 'Not Provided'}
                                    </p>
                                </div>

                                {/* Email */}
                                <div className="flex flex-col gap-1 border-b border-gray-100 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            Email Address
                                        </p>
                                    </div>

                                    <p className="break-all text-sm font-bold text-gray-900 sm:text-right">
                                        {email}
                                    </p>
                                </div>

                                {/* Phone */}
                                <div className="flex flex-col gap-1 border-b border-gray-100 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            Phone Number
                                        </p>
                                    </div>

                                    <p className="text-sm font-bold text-gray-900 sm:text-right">
                                        {phone || 'Not Provided'}
                                    </p>
                                </div>

                                {/* Address */}
                                <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            Address
                                        </p>
                                    </div>

                                    <p className="text-sm font-bold text-gray-900 sm:max-w-xs sm:text-right">
                                        {address || 'Not Provided'}
                                    </p>
                                </div>
                            </div>
                        ) : (

                            /* EDIT MODE */
                            <form
                                onSubmit={submitHandler}
                                className="space-y-5"
                            >
                                {/* Name */}
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        required
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        Phone Number
                                    </label>

                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        placeholder="Enter phone number"
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        Address
                                    </label>

                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) =>
                                            setAddress(e.target.value)
                                        }
                                        placeholder="Enter street address"
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md"
                                    >
                                        Save Changes
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsEditing(false)
                                        }
                                        className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Bottom Security Strip */}
                    <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        <span className="text-green-500">✓</span>
                        Your account information is protected
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;