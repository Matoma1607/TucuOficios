import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, LogIn, LogOut, MapPin, BadgeCheck, MessageCircle, Heart, ArrowRight } from 'lucide-react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import CategoryFilter from './components/CategoryFilter';
import JobCard from './components/JobCard';
import JobCardSkeleton from './components/JobCardSkeleton';
import SplashScreen from './components/SplashScreen';
import CookieBanner from './components/CookieBanner';
import { logPageView } from './lib/analytics';

// Se descargan recién cuando hacen falta: la página inicial carga menos código.
const PostJobModal = lazy(() => import('./components/PostJobModal'));
const EditJobModal = lazy(() => import('./components/EditJobModal'));
const JobDetailModal = lazy(() => import('./components/JobDetailModal'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));
const TucuAssistant = lazy(() => import('./components/AssistantChat'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const NotFound = lazy(() => import('./components/NotFound'));

/** Para no montar (ni descargar) el asistente en celulares. */
function useIsDesktop() {
  const query = '(min-width: 640px)';
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return matches;
}

/** true desde la primera vez que `flag` fue true (para montar un modal recién al abrirlo y conservar su animación de cierre). */
function useOnceTrue(flag: boolean) {
  const [seen, setSeen] = useState(flag);
  useEffect(() => { if (flag) setSeen(true); }, [flag]);
  return seen || flag;
}
import { Job, Category, CATEGORIES_CONFIG, ZONES } from './types';
import { useAuth } from './hooks/useAuth';
import { fetchJobs } from './services/jobs';
import { useToast } from './components/Toast';

function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user, isAdmin, signInWithGoogle, signOut } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [view, setView] = useState<'all' | 'mine' | 'pending'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // El splash solo aparece en la primera visita
  const [showSplash, setShowSplash] = useState(() => {
    try { return !localStorage.getItem('tucu_onboarding_seen'); } catch { return false; }
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'accepted') {
      logPageView();
    }
  }, [location]);

  // Si el usuario se fue a loguear con Google desde "Publicar", reabrimos el formulario
  useEffect(() => {
    if (user && sessionStorage.getItem('tucu_open_post') === '1') {
      sessionStorage.removeItem('tucu_open_post');
      setIsModalOpen(true);
    }
  }, [user]);

  useEffect(() => {
    // Links viejos (?jobId=...) ahora van a la página del profesional
    const jobId = new URLSearchParams(location.search).get('jobId');
    if (jobId) {
      navigate(`/p/${jobId}`, { replace: true });
      return;
    }

    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
      setShowOnboarding(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((view === 'mine' && !user) || (view === 'pending' && !isAdmin)) setView('all');
  }, [user, isAdmin, view]);

  // El botón flotante "Publicar" se esconde al bajar y vuelve al subir
  const [fabVisible, setFabVisible] = useState(true);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      setFabVisible(y < lastY || y < 200);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const anyModalOpen = isModalOpen || !!editingJob || !!selectedJobDetail || showOnboarding;
  const isDesktop = useIsDesktop();
  const mountPost = useOnceTrue(isModalOpen);
  const mountEdit = useOnceTrue(!!editingJob);
  const mountDetail = useOnceTrue(!!selectedJobDetail);
  const mountOnboarding = useOnceTrue(showOnboarding);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('tucu_onboarding_seen', 'true');
  };

  const loadJobs = useCallback(async () => {
    try {
      const data = await fetchJobs();
      setJobs(data);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las publicaciones.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recarga cuando cambia la sesión (al loguearte ves también tus pendientes)
  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 120000);
    return () => clearInterval(interval);
  }, [loadJobs, user?.id, isAdmin]);

  const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Pestañas: lo público, lo mío y (admin) lo pendiente de revisión
  const tabJobs = useMemo(() => {
    if (view === 'mine') return jobs.filter(j => j.ownerId === user?.id);
    if (view === 'pending') return jobs.filter(j => j.estado === 'pendiente');
    return jobs.filter(j => j.estado === 'aprobado');
  }, [jobs, view, user?.id]);

  const pendingCount = useMemo(() => jobs.filter(j => j.estado === 'pendiente').length, [jobs]);
  const mineCount = useMemo(() => jobs.filter(j => j.ownerId === user?.id).length, [jobs, user?.id]);

  // Búsqueda (sin importar mayúsculas ni acentos) + zona, antes de filtrar por categoría
  const searchedJobs = useMemo(() => {
    const q = norm(searchQuery.trim());
    return tabJobs.filter(job => {
      const label = CATEGORIES_CONFIG.find(c => c.id === job.category)?.label ?? '';
      const matchesSearch = !q || [job.title, job.zone, job.professionalName, job.category, label, job.description]
        .some(field => norm(field || '').includes(q));
      const matchesZone = !selectedZone || job.zone === selectedZone || job.zone === 'Todo Tucumán';
      return matchesSearch && matchesZone;
    });
  }, [tabJobs, searchQuery, selectedZone]);

  // Cantidad por categoría para los filtros
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of searchedJobs) counts[j.category] = (counts[j.category] ?? 0) + 1;
    return counts;
  }, [searchedJobs]);

  const filteredJobs = useMemo(() => {
    if (selectedCategory === 'All') return searchedJobs;
    const isSection = CATEGORIES_CONFIG.some(c => c.section === selectedCategory);
    return searchedJobs.filter(job =>
      job.category === selectedCategory ||
      (isSection && CATEGORIES_CONFIG.find(c => c.id === job.category)?.section === selectedCategory)
    );
  }, [searchedJobs, selectedCategory]);

  const toast = useToast();
  const handleLogout = async () => {
    await signOut();
    toast('Sesión cerrada');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {!showSplash && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
          <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <a href="/" className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900" translate="no">
                Tucu<span className="text-brand-primary">Oficios</span>
              </a>

              <div className="flex items-center gap-2 sm:gap-3">
                {!user ? (
                  <button
                    onClick={signInWithGoogle}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Entrar</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {user.user_metadata?.avatar_url && (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-gray-200"
                      />
                    )}
                    {isAdmin && (
                      <span className="hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">Admin</span>
                    )}
                    <button
                      onClick={handleLogout}
                      aria-label="Cerrar sesión"
                      title="Cerrar sesión"
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 bg-brand-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar oficio</span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 pb-16">
            {/* Bienvenida + buscador */}
            <section className="pt-4 pb-3 sm:pt-6 sm:pb-5 md:pt-14 md:pb-10 sm:text-center">
              <h1 className="text-xl leading-tight sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 text-balance">
                <span className="sm:hidden">¿Qué profesional necesitás?</span>
                <span className="hidden sm:inline">Profesionales de confianza en Tucumán</span>
              </h1>
              <p className="hidden sm:block mt-2 md:mt-4 text-base md:text-lg text-gray-500 max-w-xl mx-auto">
                Plomeros, electricistas, profes y más. Escribiles directo por WhatsApp, sin intermediarios.
              </p>

              <div className="relative max-w-2xl mx-auto mt-3 sm:mt-5 md:mt-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Buscar profesionales"
                  placeholder="Plomero, electricista, clases…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 rounded-xl py-3 md:py-3.5 pl-12 pr-4 outline-none transition text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Sellos de confianza */}
              <ul className="hidden sm:flex mt-4 md:mt-5 flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-gray-500">
                <li className="inline-flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />Cada aviso es revisado</li>
                <li className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />Contacto directo</li>
                <li className="inline-flex items-center gap-1.5"><Heart className="w-4 h-4 text-emerald-600" aria-hidden="true" />Gratis para todos</li>
              </ul>
            </section>

            {user && (
              <div role="tablist" aria-label="Vista" className="mb-5 flex gap-1 border-b border-gray-200">
                {([
                  { id: 'all', label: 'Todas', count: null },
                  { id: 'mine', label: 'Mis publicaciones', count: mineCount },
                  ...(isAdmin ? [{ id: 'pending', label: 'Pendientes', count: pendingCount }] : []),
                ] as { id: typeof view; label: string; count: number | null }[]).map(tab => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={view === tab.id}
                    onClick={() => { setView(tab.id); setSelectedCategory('All'); }}
                    className={`-mb-px px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      view === tab.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && tab.count > 0 && (
                      <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                        tab.id === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <CategoryFilter 
              selectedCategory={selectedCategory} 
              onSelectCategory={setSelectedCategory} 
              counts={categoryCounts}
            />

            {loadError && (
              <div className="max-w-2xl mx-auto mt-6 bg-red-50 text-red-700 font-medium text-sm text-center rounded-lg py-3 px-4">
                {loadError}{' '}
                <button onClick={loadJobs} className="underline">Reintentar</button>
              </div>
            )}

            {!isLoading && (
              <div className="mt-4 sm:mt-6 flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  {view === 'pending'
                    ? (filteredJobs.length === 1 ? '1 publicación para revisar' : `${filteredJobs.length} publicaciones para revisar`)
                    : view === 'mine'
                      ? (filteredJobs.length === 1 ? '1 publicación tuya' : `${filteredJobs.length} publicaciones tuyas`)
                      : (filteredJobs.length === 1 ? '1 profesional' : `${filteredJobs.length} profesionales`)}
                  {searchQuery && <> para <span className="font-medium text-gray-900">“{searchQuery}”</span></>}
                </p>
                <label className="relative inline-flex items-center">
                  <span className="sr-only">Filtrar por zona</span>
                  <MapPin className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className={`pl-9 pr-3 py-2 rounded-lg border bg-white text-sm outline-none transition-colors ${
                      selectedZone ? 'border-gray-900 text-gray-900 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <option value="">Todas las zonas</option>
                    {ZONES.filter(z => z !== 'Todo Tucumán').map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </label>
              </div>
            )}

            {/* Listado */}
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <JobCardSkeleton key={i} />)
              ) : filteredJobs.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {view === 'pending' && !searchQuery && !selectedZone
                      ? 'No hay nada pendiente'
                      : view === 'mine' && !searchQuery && !selectedZone
                        ? 'Todavía no publicaste nada'
                        : searchQuery || selectedZone ? 'No encontramos resultados' : 'Todavía no hay publicaciones acá'}
                  </h3>
                  <p className="mt-1 text-gray-500 max-w-sm mx-auto">
                    {searchQuery
                      ? `Probá con otra palabra o mirá todas las categorías.`
                      : 'Si ofrecés este servicio, podés ser el primero en publicar.'}
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                    {(searchQuery || selectedCategory !== 'All' || selectedZone) && (
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedZone(''); }}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Ver todo
                      </button>
                    )}
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2.5 rounded-lg bg-brand-primary hover:bg-orange-600 text-white text-sm font-semibold"
                    >
                      Publicar mi oficio
                    </button>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      isAdmin={isAdmin} 
                      canManage={isAdmin || job.ownerId === user?.id}
                      onEdit={(j) => setEditingJob(j)}
                      onDeleted={(id) => setJobs(prev => prev.filter(j => j.id !== id))}
                      onStatusChanged={(id, estado) => setJobs(prev => prev.map(j => j.id === id ? { ...j, estado } : j))}
                      onClick={() => setSelectedJobDetail(job)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </main>

          {mountPost && (
            <Suspense fallback={null}>
            <PostJobModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              user={user}
              onSignIn={signInWithGoogle}
              onCreated={loadJobs}
            />
            </Suspense>
          )}

          {mountEdit && (
            <Suspense fallback={null}>
            <EditJobModal 
              isOpen={!!editingJob}
              onClose={() => setEditingJob(null)}
              job={editingJob}
              isAdmin={isAdmin}
              userId={user?.id}
              onSaved={loadJobs}
            />
            </Suspense>
          )}

          {mountOnboarding && (
            <Suspense fallback={null}>
            <OnboardingModal 
              isOpen={showOnboarding}
              onClose={handleCloseOnboarding}
            />
            </Suspense>
          )}

          {/* En celular la burbuja tapaba contenido y competía con "Publicar oficio" */}
          {isDesktop && (
            <Suspense fallback={null}>
              <TucuAssistant hidden={anyModalOpen} />
            </Suspense>
          )}

          {mountDetail && (
            <Suspense fallback={null}>
            <JobDetailModal 
              job={selectedJobDetail}
              isOpen={!!selectedJobDetail}
              onClose={() => setSelectedJobDetail(null)}
            />
            </Suspense>
          )}

          {/* Invitación a publicar antes del pie */}
          {view === 'all' && (
            <section className="max-w-6xl mx-auto px-4 mb-12 md:mb-16">
              <div className="rounded-2xl bg-gray-900 px-6 py-8 md:px-12 md:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">¿Ofrecés un servicio en Tucumán?</h2>
                  <p className="mt-2 text-gray-400 md:text-lg">Publicá gratis, mostrá tus trabajos y recibí consultas por WhatsApp.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-primary hover:bg-orange-600 text-white font-semibold transition-colors flex-none"
                >
                  Publicar mi oficio
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* Botón fijo para publicar en el celular */}
          <button
            onClick={() => setIsModalOpen(true)}
            aria-hidden={anyModalOpen || !fabVisible}
            tabIndex={anyModalOpen || !fabVisible ? -1 : 0}
            className={`sm:hidden fixed bottom-4 left-1/2 z-[90] inline-flex transition-all duration-300 ${
              anyModalOpen || !fabVisible ? 'opacity-0 translate-y-20 pointer-events-none' : 'opacity-100 translate-y-0'
            } -translate-x-1/2 items-center gap-2 bg-brand-primary active:bg-orange-600 text-white pl-4 pr-5 py-3 rounded-full text-sm font-semibold shadow-lg`}
          >
            <Plus className="w-4 h-4" />
            Publicar oficio
          </button>

          <footer className="border-t border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
              <p>© {new Date().getFullYear()} TucuOficios · Hecho en Tucumán</p>
              <Link to="/privacidad" className="hover:text-gray-900">Política de privacidad</Link>
            </div>
          </footer>
        </motion.div>
      )}
      <CookieBanner paused={showOnboarding} />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/p/:id/:slug?" element={<ProfilePage />} />
        <Route path="/privacidad" element={<PrivacyPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
