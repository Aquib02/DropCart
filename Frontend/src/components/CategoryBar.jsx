import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Shirt,
    Smartphone,
    Laptop,
    Sparkle,
    Home as HomeIcon,
    Tv,
    Baby,
    Apple,
    Car,
    Dumbbell,
    Armchair,
    BookOpen,
    Bike,
} from 'lucide-react';

const categories = [
    { id: 'All', name: 'For You', icon: Sparkles, color: 'text-blue-600 bg-blue-50' },
    { id: 'Fashion', name: 'Fashion', icon: Shirt, color: 'text-rose-600 bg-rose-50' },
    { id: 'Mobiles', name: 'Mobiles', icon: Smartphone, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'Electronics', name: 'Electronics', icon: Laptop, color: 'text-sky-600 bg-sky-50' },
    { id: 'Beauty', name: 'Beauty', icon: Sparkle, color: 'text-pink-600 bg-pink-50' },
    { id: 'Home', name: 'Home', icon: HomeIcon, color: 'text-amber-600 bg-amber-50' },
    { id: 'Appliances', name: 'Appliances', icon: Tv, color: 'text-orange-600 bg-orange-50' },
    { id: 'Toys', name: 'Toys, Baby', icon: Baby, color: 'text-teal-600 bg-teal-50' },
    { id: 'Food', name: 'Food & Health', icon: Apple, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'Auto', name: 'Auto Acc...', icon: Car, color: 'text-gray-700 bg-gray-100' },
    { id: 'Sports & Fitness', name: 'Sports & ...', icon: Dumbbell, color: 'text-red-600 bg-red-50' },
    { id: 'Furniture', name: 'Furniture', icon: Armchair, color: 'text-amber-700 bg-amber-50' },
    { id: 'Books', name: 'Books', icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
    { id: '2 Wheelers', name: '2 Wheele...', icon: Bike, color: 'text-green-600 bg-green-50' },
];

const CategoryBar = ({ selectedCategory = 'All', onSelectCategory }) => {
    const navigate = useNavigate();

    const handleClick = (catId) => {
        if (onSelectCategory) {
            onSelectCategory(catId);
        } else {
            if (catId === 'All') {
                navigate('/shop');
            } else {
                navigate(`/shop?category=${encodeURIComponent(catId)}`);
            }
        }
    };

    return (
        <section className="border-b border-gray-200/80 bg-white shadow-xs">
            <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3 sm:px-6">
                <div className="flex min-w-max items-center justify-between gap-6 sm:justify-center sm:gap-8">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleClick(cat.id)}
                                className="group flex flex-col items-center gap-1.5 transition focus:outline-none"
                            >
                                <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 ${
                                        cat.color
                                    } ${
                                        isSelected
                                            ? 'ring-2 ring-orange-500 ring-offset-2'
                                            : 'shadow-xs'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span
                                    className={`text-[11px] font-bold tracking-tight transition ${
                                        isSelected
                                            ? 'border-b-2 border-orange-500 text-orange-600 pb-0.5'
                                            : 'text-gray-700 group-hover:text-orange-600'
                                    }`}
                                >
                                    {cat.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CategoryBar;
