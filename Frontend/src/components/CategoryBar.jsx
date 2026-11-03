import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Shirt,
    Smartphone,
    Laptop,
    Sparkle,
    Home as HomeIcon,
    Tv,
    Dumbbell,
    Armchair,
    Compass,
} from 'lucide-react';

const categories = [
    { id: 'All', name: 'All Collection', icon: Compass },
    { id: 'Mobiles', name: 'Smartphones & 5G', icon: Smartphone },
    { id: 'Electronics', name: 'Laptops & Tech', icon: Laptop },
    { id: 'Fashion', name: 'Fashion & Wear', icon: Shirt },
    { id: 'Home', name: 'Home & Living', icon: HomeIcon },
    { id: 'Appliances', name: 'Smart Appliances', icon: Tv },
    { id: 'Beauty', name: 'Beauty & Care', icon: Sparkle },
    { id: 'Sports & Fitness', name: 'Sports & Gear', icon: Dumbbell },
    { id: 'Furniture', name: 'Modern Furniture', icon: Armchair },
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
        <section className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-[69px] z-40">
            <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-2.5 sm:px-6 no-scrollbar">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-max">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleClick(cat.id)}
                                className={`group flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                                    isSelected
                                        ? 'bg-gray-900 text-white shadow-sm ring-1 ring-gray-900'
                                        : 'bg-gray-50/90 text-gray-600 hover:bg-gray-100 hover:text-gray-950 border border-gray-200/60'
                                }`}
                            >
                                <Icon className={`h-3.5 w-3.5 transition-colors ${
                                    isSelected ? 'text-orange-400' : 'text-gray-400 group-hover:text-orange-500'
                                }`} />
                                <span>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CategoryBar;
