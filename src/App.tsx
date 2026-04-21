import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, X, ShieldCheck, LogOut, Camera, Upload, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import CategoryFilter from './components/CategoryFilter';
import JobCard from './components/JobCard';
import JobCardSkeleton from './components/JobCardSkeleton';
import PostJobModal from './components/PostJobModal';
import EditJobModal from './components/EditJobModal';
import NotFound from './components/NotFound';
import SplashScreen from './components/SplashScreen';
import AuthTransition from './components/AuthTransition';
import CookieBanner from './components/CookieBanner';
import PrivacyPolicy from './components/PrivacyPolicy';
import OnboardingModal from './components/OnboardingModal';
import AdminLoginModal from './components/AdminLoginModal';
import TucuAssistant from './components/AssistantChat';
import { logPageView } from './lib/analytics';
import { CONFIG } from './config';
import { Job, Category, CATEGORIES_CONFIG } from './types';

function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [sharedJobId, setSharedJobId] = useState<string | null>(null);
  const [isAdminLoginError, setIsAdminLoginError] = useState(false);
  const [authStatus, setAuthStatus] = useState<{isOpen: boolean, type: 'login' | 'logout'}>({
    isOpen: false,
    type: 'login'
  });
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
    // Check for shared job ID in URL
    const params = new URLSearchParams(location.search);
    const jobId = params.get('jobId');
    if (jobId) {
      setSharedJobId(jobId);
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
      // Una vez terminado el splash, verificamos onboarding
      const hasSeenOnboarding = localStorage.getItem('tucu_onboarding_seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('tucu_onboarding_seen', 'true');
  };

  useEffect(() => {
    const fetchJobs = async () => {
      const scriptUrl = CONFIG.GOOGLE_SCRIPT_URL;
      if (!scriptUrl) {
        setIsLoading(false);
        return;
      }

      try {
        // Añadimos un parámetro de tiempo para evitar caché agresiva del navegador
        const urlWithCacheBuster = `${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        console.log("Fetching from GAS:", urlWithCacheBuster);
        
        const response = await fetch(urlWithCacheBuster, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error de servidor: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Data received from GAS:", data);
        
        if (Array.isArray(data)) {
          // Normalizar las claves por si GAS le puso mayúsculas o vienen de Google Sheets
          const normalizedData = data.filter(j => j && (j.id || j.Id || j.ID)).map((j: any) => ({
            id: j.id || j.Id || j.ID || '',
            title: j.title || j.Title || '',
            category: j.category || j.Category || '',
            zone: j.zone || j.Zone || '',
            professionalName: j.professionalName || j.professionalname || j.ProfessionalName || '',
            whatsapp: j.whatsapp || j.Whatsapp || '',
            email: j.email || j.Email || '',
            description: j.description || j.Description || '',
            imageUrl: (j.imageUrl || j.imageurl || j.ImageUrl || '').startsWith('http') ? (j.imageUrl || j.imageurl || j.ImageUrl) : '',
            estado: j.estado || j.Estado || 'pendiente',
            createdAt: j.createdAt || j.CreatedAt || j.createdat || Date.now()
          }));

          // Mostramos aprobados y pendientes al público (Admin ve todo)
          const visibleJobs = isAdmin 
            ? normalizedData 
            : normalizedData.filter((j: any) => j.estado === 'aprobado' || j.estado === 'pendiente');
          
          setJobs(visibleJobs as Job[]);
        } else {
          console.warn("GAS returned data that is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        // Si el error es 'Failed to fetch', suele ser CORS (GAS crash) o Quota
        const isFetchError = error instanceof TypeError && error.message.includes('fetch');
        if (isFetchError) {
          console.error("⚠️ Error de conexión: Es posible que la cuota de Google Apps Script se haya agotado o el script haya fallado. Verifica tus logs en script.google.com.");
        }
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const filteredJobs = useMemo(() => {
    let list = jobs;
    
    // If we have a shared job ID, show it first or filter for it
    if (sharedJobId) {
      const sharedJob = jobs.find(j => j.id === sharedJobId);
      if (sharedJob) {
        // If searching or filtering by category, we might want to still show it
        // but for deep linking, showing just that job is usually expected
        if (selectedCategory === 'All' && !searchQuery) {
          return [sharedJob];
        }
      }
    }

    return list.filter(job => {
      // Si seleccionamos "All", pasan todos.
      // Si la categoría del trabajo coincide exactamente con lo seleccionado, pasa.
      // Si lo seleccionado es una SECCIÓN, pasan todos los trabajos de categorías de esa sección.
      const isSectionFilter = CATEGORIES_CONFIG.some(c => c.section === selectedCategory);
      const matchesCategory = selectedCategory === 'All' || 
                             job.category === selectedCategory ||
                             (isSectionFilter && CATEGORIES_CONFIG.find(c => c.id === job.category)?.section === selectedCategory);

      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.professionalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [jobs, selectedCategory, searchQuery, sharedJobId]);

  const handleLogin = () => {
    setIsAdminLoginOpen(true);
  };

  const handleAdminVerify = (code: string) => {
    if (code === CONFIG.ADMIN_CODE) {
      setIsAdminLoginOpen(false);
      setIsAdminLoginError(false);
      setAuthStatus({ isOpen: true, type: 'login' });
      setTimeout(() => {
        setIsAdmin(true);
        localStorage.setItem('tucu_admin_mode', 'true');
        setAuthStatus(prev => ({ ...prev, isOpen: false }));
      }, 2000);
    } else {
      setIsAdminLoginError(true);
      setTimeout(() => setIsAdminLoginError(false), 500);
    }
  };

  const handleLogout = () => {
    setAuthStatus({ isOpen: true, type: 'logout' });
    setTimeout(() => {
      setIsAdmin(false);
      localStorage.removeItem('tucu_admin_mode');
      setAuthStatus(prev => ({ ...prev, isOpen: false }));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Decorators */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
        
        {/* Subtle Grid */}
        <svg width="100%" height="100%" className="opacity-[0.03]">
          <pattern id="main-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#main-grid)" />
        </svg>

        {/* Professional Scribbles/Shapes */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path d="M100,200 Q400,100 500,400 T900,200" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M200,800 Q500,700 600,900 T800,700" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      <AuthTransition isOpen={authStatus.isOpen} type={authStatus.type} />
      
      {!showSplash && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
          {/* Strava-like Header */}
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 md:py-5 shadow-sm">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl md:text-3xl font-black tracking-tighter text-brand-dark" translate="no">
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
                  className="bg-brand-primary text-white px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-brand-primary/30 hover:shadow-brand-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar</span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-8">
            {/* Search Bar */}
            <div className="mb-10 relative">
              {sharedJobId && (
                <div className="max-w-2xl mx-auto mb-6 flex flex-col items-center">
                  <div className="bg-brand-primary/10 border border-brand-primary/20 px-6 py-4 rounded-3xl flex items-center justify-between gap-6 w-full shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-brand-primary p-2 rounded-xl">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-brand-dark font-black text-sm">Viendo un trabajo compartido</p>
                        <p className="text-gray-500 text-xs font-medium">Estás visualizando una publicación específica.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSharedJobId(null);
                        window.history.replaceState({}, '', window.location.pathname);
                      }}
                      className="bg-white text-brand-dark px-4 py-2 rounded-xl font-black text-xs border border-gray-100 shadow-sm hover:bg-gray-50 transition-all whitespace-nowrap"
                    >
                      Ver todos
                    </button>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-brand-primary/5 blur-[40px] rounded-full scale-75 -z-10" />
              <div className="relative group max-w-2xl mx-auto">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Buscar plomero, electricista..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-gray-100 focus:border-brand-primary rounded-2xl py-5 pl-14 pr-6 shadow-xl shadow-gray-200/50 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-medium text-lg focus:shadow-brand-primary/10"
                />
              </div>
            </div>

            <CategoryFilter 
              selectedCategory={selectedCategory} 
              onSelectCategory={setSelectedCategory} 
            />

            {/* Jobs List */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => <JobCardSkeleton key={i} />)
              ) : filteredJobs.length === 0 ? (
                <div className="col-span-full py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-white inline-block p-10 rounded-[48px] shadow-2xl shadow-gray-100 border border-gray-50 max-w-md">
                    <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-6 scale-110">
                      <Search className="w-10 h-10 text-brand-primary" />
                    </div>
                    <h3 className="text-2xl font-black text-brand-dark mb-3">¡Ufa! No lo encontramos</h3>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                      {searchQuery 
                        ? `No hay resultados para "${searchQuery}". Probá con términos más simples o buscá otra categoría.` 
                        : 'Parece que todavía no hay publicaciones en esta categoría. ¡Sé el primero en publicar el tuyo!'}
                    </p>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                        className="px-6 py-4 bg-gray-50 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
                      >
                        Limpiar búsqueda
                      </button>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-4 bg-brand-primary hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-orange-200/50 transition-all active:scale-95"
                      >
                        Publicar Oficio
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      isAdmin={isAdmin} 
                      onEdit={(j) => setEditingJob(j)}
                    />
                  ))}
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

          <OnboardingModal 
            isOpen={showOnboarding}
            onClose={handleCloseOnboarding}
          />

          <AdminLoginModal 
            isOpen={isAdminLoginOpen}
            onClose={() => setIsAdminLoginOpen(false)}
            onLogin={handleAdminVerify}
            error={isAdminLoginError}
          />

          <TucuAssistant />

          <footer className="py-12 text-center border-t border-gray-200 mt-20">
            <div className="flex justify-center gap-6 mb-4 text-sm font-bold text-gray-400">
              <Link to="/privacidad" className="hover:text-brand-primary"><span>Privacidad</span></Link>
              {!isAdmin && <button onClick={handleLogin} className="hover:text-brand-primary"><span>Admin</span></button>}
            </div>
            <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest">
              <span>© 2026 • TucuOficios • V2.2 - REFRESH</span>
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
// force update 1