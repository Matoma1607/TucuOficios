import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import JobCard from './components/JobCard';
import PostJobModal from './components/PostJobModal';
import NotFound from './components/NotFound';
import SplashScreen from './components/SplashScreen';
import CookieBanner from './components/CookieBanner';
import PrivacyPolicy from './components/PrivacyPolicy';
import { logPageView } from './lib/analytics';
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from './services/firebase';
import { Job, Category, User } from './types';

function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'accepted') {
      logPageView();
    }
  }, [location]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        });
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Jobs Listener
  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const loadedJobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];
        setJobs(loadedJobs);
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'jobs');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.professionalName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [jobs, selectedCategory, searchQuery]);

  const handleLogin = async () => {
    // IMPORTANTE: No cambiamos estados antes de llamar al login
    // para que el navegador no bloquee el popup por falta de "gesto de usuario"
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/popup-blocked') {
        alert("⚠️ El navegador bloqueó la ventana de inicio de sesión.\n\nPara solucionar esto:\n1. Hacé clic en los 3 puntitos de arriba a la derecha.\n2. Elegí 'Abrir en el navegador' o 'Abrir en Chrome/Safari'.\n3. Intentá de nuevo.");
      } else {
        alert("Hubo un problema al iniciar sesión. Por favor, intentá de nuevo o abrí el sitio en Chrome/Safari.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SplashScreen onComplete={() => setShowSplash(false)} />
      
      {!showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Header 
            user={user} 
            onLogin={handleLogin} 
            onLogout={handleLogout} 
            onPostClick={() => setIsModalOpen(true)} 
          />

          <main className="max-w-7xl mx-auto px-4 pb-20">
            {/* Hero / Search Section */}
            <section className="py-16 flex flex-col items-center text-center">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-extrabold text-brand-dark tracking-tight mb-8"
              >
                Encontrá al profesional <br />
                <span className="text-brand-primary">que necesitás.</span>
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-2xl relative"
              >
                <div className="relative flex items-center bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl shadow-indigo-100/30 p-2 focus-within:ring-2 focus-within:ring-brand-primary transition-all">
                  <Search className="w-5 h-5 text-gray-400 ml-4" />
                  <input 
                    type="text" 
                    placeholder="¿Qué servicio estás buscando? (ej: Plomero en Yerba Buena)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow px-4 py-4 bg-transparent outline-none text-brand-dark font-medium placeholder:text-gray-400"
                  />
                  <button className="hidden sm:flex items-center gap-2 bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    Buscar
                  </button>
                </div>
              </motion.div>
            </section>

            {/* Categories */}
            <CategoryFilter 
              selectedCategory={selectedCategory} 
              onSelectCategory={setSelectedCategory} 
            />

            {/* Jobs Grid */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-extrabold text-brand-dark tracking-tight">
                  {selectedCategory === 'All' ? 'Trabajos Recientes' : `Trabajos de ${selectedCategory}`}
                </h2>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-white/50 backdrop-blur-sm border border-white/20 px-5 py-2.5 rounded-2xl">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filtros</span>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[4/3] bg-gray-100 rounded-3xl mb-4" />
                      <div className="h-6 bg-gray-100 rounded-full w-3/4 mb-3" />
                      <div className="h-4 bg-gray-100 rounded-full w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredJobs.length > 0 ? (
                    <motion.div 
                      layout
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
                    >
                      {filteredJobs.map((job) => (
                        <JobCard key={job.id} job={job} currentUser={user} />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-24 text-center"
                    >
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-12 h-12 text-gray-300" />
                      </div>
                      <h3 className="text-2xl font-bold text-brand-dark mb-2">No encontramos resultados</h3>
                      <p className="text-gray-500">Probá buscando con otras palabras o categorías.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </main>

          {user && (
            <PostJobModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              professionalName={user.displayName || 'Profesional'}
              professionalId={user.uid}
            />
          )}

          <CookieBanner />

          {/* Footer Info */}
          <footer className="bg-white/50 backdrop-blur-md py-12 border-t border-white/20">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="flex gap-8 text-sm font-bold text-gray-500">
                  <Link to="/privacidad" className="hover:text-brand-primary transition-colors">Política de Privacidad</Link>
                </div>
                <p className="text-gray-400 text-[10px] font-medium uppercase tracking-[0.2em]">
                  © 2026 • San Miguel de Tucumán
                </p>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
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


