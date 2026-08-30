import { useState, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';

    const submitHandler = async (e) => {
        e.preventDefault();
        const result = await login(email, password);

        if (result.success) {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));

            if (userInfo && userInfo.isAdmin) {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#f8f8f6] px-4 py-10 sm:px-6">
            <div className="mx-auto w-full max-w-md">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                    {/* Header */}
                    <div className="bg-[#171717] px-6 py-8 text-center text-white sm:px-8">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500 text-xl font-black">
                            M
                        </div>

                        <h1 className="mt-5 text-2xl font-black">
                            Welcome Back
                        </h1>

                        <p className="mt-2 text-sm text-gray-400">
                            Sign in to continue shopping with MyStore
                        </p>
                    </div>

                    <div className="p-6 sm:p-8">
                        {error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                                {error}
                            </div>
                        )}

                        <form onSubmit={submitHandler} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    placeholder="Enter email"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                                    placeholder="Enter password"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-lg bg-orange-500 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.99]"
                            >
                                Sign In
                            </button>
                        </form>

                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-xs font-medium text-gray-400">
                                OR
                            </span>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        <p className="text-center text-sm text-gray-500">
                            New Customer?{' '}
                            <Link
                                to="/register"
                                className="font-bold text-orange-600 hover:text-orange-700"
                            >
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-5 text-center text-xs text-gray-400">
                    Secure shopping with MyStore
                </p>
            </div>
        </div>
    );
};

export default Login;