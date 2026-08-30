import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await axios.post(
                'http://localhost:5000/api/users/register',
                {
                    name,
                    email,
                    password,
                }
            );

            // Auto login after successful registration
            localStorage.setItem('userInfo', JSON.stringify(data));
            window.location.href = '/';
        } catch (err) {
            setError(
                err.response?.data?.message || 'Registration failed'
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f8f6] px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-md">

                {/* Heading */}
                <div className="mb-7 text-center">
                    <div className="mb-3 flex items-center justify-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                            MyStore
                        </span>
                        <span className="h-1 w-8 rounded-full bg-orange-500" />
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-gray-900">
                        Create Account
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Join MyStore and start shopping today.
                    </p>
                </div>

                {/* Register Card */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                    {/* Dark Header */}
                    <div className="bg-[#171717] px-6 py-5 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-black text-white shadow-lg shadow-orange-950/30">
                            M
                        </div>

                        <p className="mt-3 text-sm font-bold text-white">
                            Welcome to MyStore
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Create your account in a few seconds
                        </p>
                    </div>

                    <div className="p-6 sm:p-7">

                        {/* Error */}
                        {error && (
                            <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs">
                                    !
                                </span>
                                {error}
                            </div>
                        )}

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
                                    required
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    placeholder="Enter your name"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    placeholder="Enter email"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    placeholder="Create a password"
                                />
                            </div>

                            {/* Register Button */}
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-orange-500 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.99]"
                            >
                                Create Account →
                            </button>
                        </form>

                        {/* Login */}
                        <div className="mt-6 border-t border-gray-100 pt-5 text-center">
                            <p className="text-sm text-gray-500">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-bold text-orange-600 transition hover:text-orange-700"
                                >
                                    Login here
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Security Footer */}
                    <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        <span className="text-green-500">✓</span>
                        Secure account creation
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;