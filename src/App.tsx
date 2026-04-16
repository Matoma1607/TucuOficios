import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, X, ShieldCheck, LogOut, Camera, Upload, Check, ChevronRight } from 'lucide-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import CategoryFilter from './components/CategoryFilter';
import JobCard from './components/JobCard';
import PostJobModal from './components/PostJobModal';
import EditJobModal from './components/EditJobModal';
import NotFound from './components/NotFound';
import SplashScreen from './components/SplashScreen';
import CookieBanner from './components/CookieBanner';
import PrivacyPolicy from './components/PrivacyPolicy';
import { logPageView } from './lib/analytics';
import { CONFIG } from './config';
import { Job, Category } from './types';

function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'accepted') {
      logPageView();
    }
  }, [location]);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('tucu_admin_mode');
    if (savedAdmin === 'true') {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      const scriptUrl = CONFIG.GOOGLE_SCRIPT_URL;
      if (!scriptUrl) return;

      try {
        console.log("Fetching from GAS:", scriptUrl);
        const response = await fetch(scriptUrl);
        if (response.ok) {
          const data = await response.json();
          console.log("Data received from GAS:", data);
          
          if (Array.isArray(data)) {
            // Normalizar las claves por si GAS le puso mayúsculas
            const normalizedData = data.map((j: any) => ({
              id: j.id || j.Id || '',
              title: j.title || j.Title || '',
              category: j.category || j.Category || '',
              zone: j.zone || j.Zone || '',
              professionalName: j.professionalName || j.ProfessionalName || '',
              whatsapp: j.whatsapp || j.Whatsapp || '',
              description: j.description || j.Description || '',
              imageUrl: j.imageUrl || j.ImageUrl || '',
              estado: j.estado || j.Estado || 'pendiente',
              createdAt: j.createdAt || j.CreatedAt || Date.now()
            }));

            // Mostramos aprobados y pendientes al público
            const visibleJobs = isAdmin 
              ? normalizedData 
              : normalizedData.filter((j: any) => j.id && (j.estado === 'aprobado' || j.estado === 'pendiente'));
            
            setJobs(visibleJobs as Job[]);
          }
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.professionalName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [jobs, selectedCategory, searchQuery]);

  const handleLogin = () => {
    const code = window.prompt('Código de Administrador:');
    if (code === CONFIG.ADMIN_CODE) {
      setIsAdmin(true);
      localStorage.setItem('tucu_admin_mode', 'true');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('tucu_admin_mode');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      
      {!showSplash && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Strava-like Header */}
          <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xl">T</span>
                </div>
                <span className="text-xl font-black tracking-tighter text-brand-dark" translate="no">
                  <span>Tucu</span><span className="text-brand-primary">Oficios</span>
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-brand-primary">
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-brand-primary text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1 shadow-lg shadow-orange-200 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar</span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-5xl mx-auto px-4 py-8">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Buscar plomero, electricista..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 pl-12 pr-4 shadow-sm outline-none transition-all font-medium"
                />
              </div>
            </div>

            <CategoryFilter 
              selectedCategory={selectedCategory} 
              onSelectCategory={setSelectedCategory} 
            />

            {/* Jobs List */}
            <div className="mt-8 space-y-4">
              {isLoading ? (
                [1,2,3].map(i => (
                  <div key={i} className="bg-white h-32 rounded-2xl animate-pulse" />
                ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        isAdmin={isAdmin} 
                        onEdit={(j) => setEditingJob(j)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-gray-400 font-medium">No se encontraron resultados</p>
                    </div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </main>

          <PostJobModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />

          <EditJobModal 
            isOpen={!!editingJob}
            onClose={() => setEditingJob(null)}
            job={editingJob}
          />

          <footer className="py-12 text-center border-t border-gray-200 mt-20">
            <div className="flex justify-center gap-6 mb-4 text-sm font-bold text-gray-400">
              <Link to="/privacidad" className="hover:text-brand-primary"><span>Privacidad</span></Link>
              {!isAdmin && <button onClick={handleLogin} className="hover:text-brand-primary"><span>Admin</span></button>}
            </div>
            <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest">
              <span>© 2026 • TucuOficios</span>
            </p>
          </footer>
        </motion.div>
      )}
      <CookieBanner />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/privacidad" element={<PrivacyPolicy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
