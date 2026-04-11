import { 
  Droplets, 
  Key, 
  Wind, 
  Truck, 
  Zap, 
  Paintbrush,
  LayoutGrid
} from 'lucide-react';
import { Category, CATEGORIES } from '../types';

interface CategoryFilterProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Plomería': Droplets,
  'Cerrajería': Key,
  'Aires': Wind,
  'Mudanzas': Truck,
  'Electricidad': Zap,
  'Pintura': Paintbrush,
  'All': LayoutGrid
};

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-6">
      <div className="flex items-center justify-center min-w-max px-4 gap-8">
        {['All', ...CATEGORIES].map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const isActive = selectedCategory === cat;
          
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat as any)}
              className={`flex flex-col items-center gap-2 group transition-all ${
                isActive ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className={`p-4 rounded-3xl transition-all duration-500 ${
                isActive 
                  ? 'bg-brand-primary text-white shadow-lg shadow-indigo-200 scale-110' 
                  : 'bg-white/50 backdrop-blur-sm border border-white/20 text-gray-400 group-hover:bg-white group-hover:text-brand-primary group-hover:shadow-md'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-medium tracking-wide ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                {cat === 'All' ? 'Todos' : cat}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-brand-primary rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
