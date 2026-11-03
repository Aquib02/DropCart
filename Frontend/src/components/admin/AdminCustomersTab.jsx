import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Coins, Search, Shield, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AdminCustomersTab = ({ userToken }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                setLoading(true);
                const config = { headers: { Authorization: `Bearer ${userToken}` } };
                const { data } = await axios.get(`${API_BASE_URL}/api/users`, config);
                setCustomers(data || []);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load customers:', err);
                setLoading(false);
            }
        };

        if (userToken) {
            fetchCustomers();
        }
    }, [userToken]);

    const filtered = customers.filter(
        (c) =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.email?.toLowerCase().includes(search.toLowerCase()) ||
            c.role?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-gray-900">Customer Directory</h2>
                        <p className="text-xs text-gray-500">Registered users, SuperCoins balances and roles</p>
                    </div>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-gray-100">
                        <thead className="bg-gray-50/80 font-black uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-5 py-3.5">Customer</th>
                                <th className="px-5 py-3.5">Role</th>
                                <th className="px-5 py-3.5">SuperCoins</th>
                                <th className="px-5 py-3.5">City / Pincode</th>
                                <th className="px-5 py-3.5">Registered On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-400">Loading customers...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-400">No matching customers found.</td>
                                </tr>
                            ) : (
                                filtered.map((c) => (
                                    <tr key={c._id} className="hover:bg-gray-50/60 transition">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
                                                    {c.name ? c.name[0].toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{c.name}</p>
                                                    <p className="text-[10px] text-gray-400">{c.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                                    c.role === 'admin' || c.isAdmin
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : c.role === 'staff'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {c.role || (c.isAdmin ? 'Admin' : 'Customer')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-bold">
                                            <span className="inline-flex items-center gap-1 text-amber-600">
                                                <Coins className="h-3.5 w-3.5 fill-current" />
                                                {c.coins || 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500">
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                {c.deliveryCity || c.city || 'India'} {c.deliveryPincode || c.postalCode || ''}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500">
                                            {new Date(c.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCustomersTab;
