import React, { useState } from 'react';
import { Category, CATEGORIES_CONFIG, SECTIONS } from '../types';
import { Icons } from '../lib/icons';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryFilterProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
  counts?: Record<string, number>;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory, counts = {} }: CategoryFilterProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const sectionCount = (section: string) =>
    CATEGORIES_CONFIG.filter(c => c.section === section).reduce((sum, c) => sum + (counts[c.id] ?? 0), 0);
  // Solo secciones con avisos (más la activa), ordenadas por cantidad.
  const allSections = SECTIONS.map(s => s.id);
  
  const [catSearch, setCatSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Encontrar la sección de la categoría seleccionada
  const activeCategoryInfo = CATEGORIES_CONFIG.find(c => c.id === selectedCategory);
  const currentSection = activeCategoryInfo?.section || (allSections.includes(selectedCategory) ? selectedCategory : null);
  const sections = allSections
    .filter(s => sectionCount(s) > 0 || s === currentSection)
    .sort((a, b) => sectionCount(b) - sectionCount(a));

  const filteredSubCats = CATEGORIES_CONFIG.filter(c => {
    const matchesSection = isSearching ? true : (currentSection ? c.section === currentSection : false);
    // Fuera del buscador, ocultar subcategorías sin avisos (salvo la seleccionada).
    if (!isSearching && (counts[c.id] ?? 0) === 0 && c.id !== selectedCategory) return false;
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
        <div className="flex overflow-x-auto no-scrollbar gap-2 flex-grow min-w-0 pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]">
          <button
            onClick={() => {
              onSelectCategory('All');
              setIsSearching(false);
              setCatSearch('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border flex-shrink-0 ${
              selectedCategory === 'All' && !isSearching
                ? 'bg-gray-900 border-gray-900 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <Icons.LayoutGrid className="w-4 h-4" />
            <span>Todo</span>
            <span className="opacity-60">{total}</span>
          </button>

          {sections.map(section => {
            const isActive = currentSection === section && !isSearching;
            const SectionIcon = Icons[SECTIONS.find(s => s.id === section)?.iconName ?? ''] || Icons.HelpCircle;

            return (
              <button
                key={section}
                onClick={() => {
                  handleSectionClick(section);
                  setIsSearching(false);
                  setCatSearch('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border flex-shrink-0 ${
                  isActive 
                    ? 'bg-gray-900 border-gray-900 text-white' 
                    : sectionCount(section) > 0
                      ? 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                }`}
              >
                <SectionIcon className="w-4 h-4" />
                <span>{section}</span>
                {sectionCount(section) > 0 && <span className="opacity-60">{sectionCount(section)}</span>}
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
          aria-label="Buscar categoría"
          className={`flex-none ml-1 p-2.5 rounded-full border transition-colors ${
            isSearching ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
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
                  className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 text-sm outline-none focus:border-gray-900 transition-colors"
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors border flex-shrink-0 ${
                      isActive 
                        ? 'bg-orange-50 border-orange-200 text-orange-800 font-medium' 
                        : (counts[cat.id] ?? 0) > 0
                          ? 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                    {(counts[cat.id] ?? 0) > 0 && <span className="opacity-60">{counts[cat.id]}</span>}
                  </button>
                );
              })}
              {filteredSubCats.length === 0 && (
                <p className="text-sm text-gray-500 px-4 py-2">No se encontraron categorías</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
