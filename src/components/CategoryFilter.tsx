import React, { useState } from 'react';
import { Category, CATEGORIES_CONFIG } from '../types';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryFilterProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const sections = Array.from(new Set(CATEGORIES_CONFIG.map(c => c.section)));
  
  const [catSearch, setCatSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Encontrar la sección de la categoría seleccionada
  const activeCategoryInfo = CATEGORIES_CONFIG.find(c => c.id === selectedCategory);
  const currentSection = activeCategoryInfo?.section || (sections.includes(selectedCategory) ? selectedCategory : null);

  const filteredSubCats = CATEGORIES_CONFIG.filter(c => {
    const matchesSection = isSearching ? true : (currentSection ? c.section === currentSection : false);
    const matchesSearch = c.label.toLowerCase().includes(catSearch.toLowerCase()) || 
                          c.section.toLowerCase().includes(catSearch.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const handleSectionClick = (section: string) => {
    if (selectedCategory === section) {
      onSelectCategory('All');
    } else {
      onSelectCategory(section);
    }
  };

  return (
    <div className="w-full py-2 space-y-4">
      {/* Nivel 1: Secciones Principales + Buscador */}
      <div className="flex items-center">
        <div className="flex overflow-x-auto no-scrollbar -mx-4 px-4 gap-2 flex-grow">
          <button
            onClick={() => {
              onSelectCategory('All');
              setIsSearching(false);
              setCatSearch('');
            }}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all border-2 flex-shrink-0 ${
              selectedCategory === 'All' && !isSearching
                ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-orange-100'
                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
            }`}
          >
            <Icons.LayoutGrid className="w-4 h-4" />
            <span>Todo</span>
          </button>

          {sections.map(section => {
            const isActive = currentSection === section && !isSearching;
            const SectionIcon = section === 'Salud y Cuidado Personal' ? Icons.HeartPulse :
                               section === 'Educación y Clases' ? Icons.BookOpen :
                               section === 'Servicios Técnicos y Digitales' ? Icons.Cpu :
                               Icons.Home;

            return (
              <button
                key={section}
                onClick={() => {
                  handleSectionClick(section);
                  setIsSearching(false);
                  setCatSearch('');
                }}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all border-2 flex-shrink-0 ${
                  isActive 
                    ? 'bg-brand-dark border-brand-dark text-white shadow-md' 
                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                }`}
              >
                <SectionIcon className="w-4 h-4" />
                <span>{section}</span>
              </button>
            );
          })}
        </div>
        
        {/* Toggle Buscador de Categorías */}
        <button 
          onClick={() => {
            setIsSearching(!isSearching);
            if (!isSearching) onSelectCategory('All');
          }}
          className={`ml-2 p-3 rounded-xl border-2 transition-all ${
            isSearching ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white border-gray-100 text-gray-400'
          }`}
        >
          <Icons.Search className="w-4 h-4" />
        </button>
      </div>

      {/* Nivel 2: Subcategorías o Buscador Dinámico */}
      <AnimatePresence mode="wait">
        {(currentSection || isSearching) && (
          <motion.div
            key={isSearching ? 'search' : currentSection}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {isSearching && (
              <div className="px-4">
                <input 
                  autoFocus
                  placeholder="Buscá un oficio (ej: Plomero, Clases...)"
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                  className="w-full bg-gray-100/50 border border-gray-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:border-brand-primary transition-all"
                />
              </div>
            )}
            
            <div className="flex overflow-x-auto no-scrollbar -mx-4 px-4 gap-2 py-1">
              {filteredSubCats.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const IconComponent = (Icons as any)[cat.iconName] || Icons.HelpCircle;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all border flex-shrink-0 ${
                      isActive 
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
              {filteredSubCats.length === 0 && (
                <p className="text-[10px] text-gray-400 font-bold px-4 py-2">No se encontraron categorías</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
