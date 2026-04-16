import { Category, CATEGORIES } from '../types';

interface CategoryFilterProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-4 -mx-4 px-4">
      <div className="flex items-center gap-2 min-w-max">
        {['All', ...CATEGORIES].map((cat) => {
          const isActive = selectedCategory === cat;
          
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat as any)}
              className={`px-6 py-2.5 rounded-full text-sm font-black transition-all border-2 ${
                isActive 
                  ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-orange-100' 
                  : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600'
              }`}
            >
              {cat === 'All' ? 'Todos' : cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
