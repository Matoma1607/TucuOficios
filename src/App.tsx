import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, LogIn, LogOut, MapPin, BadgeCheck, MessageCircle, Heart, ChevronDown, BarChart3, CircleHelp } from 'lucide-react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import CategoryFilter from './components/CategoryFilter';
import JobCard from './components/JobCard';
import PorQueGratis from './components/PorQueGratis';
import VolverArriba from './components/VolverArriba';
import JobCardSkeleton from './components/JobCardSkeleton';
import SplashScreen from './components/SplashScreen';
import CookieBanner from './components/CookieBanner';
import { logPageView } from './lib/analytics';
import { contar } from './lib/contador';

// Se descargan recién cuando hacen falta: la página inicial carga menos código.
const PostJobModal = lazy(() => import('./components/PostJobModal'));
const EditJobModal = lazy(() => import('./components/EditJobModal'));
const JobDetailModal = lazy(() => import('./components/JobDetailModal'));
const GuidedTour = lazy(() => import('./components/GuidedTour'));
const TucuAssistant = lazy(() => import('./components/AssistantChat'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const NotFound = lazy(() => import('./components/NotFound'));
const EstadisticasPage = lazy(() => import('./components/EstadisticasPage'));

/** true en pantallas de 1024px o más (el breakpoint `lg` de Tailwind): ahí entra el texto largo del buscador. */
function useIsWide() {
  const query = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
}

/** true desde la primera vez que `flag` fue true (para montar un modal recién al abrirlo y conservar su animación de cierre). */
function useOnceTrue(flag: boolean) {
  const [seen, setSeen] = useState(flag);
  useEffect(() => { if (flag) setSeen(true); }, [flag]);
  return seen || flag;
}
import { Job, Category, CATEGORIES_CONFIG, ZONES, rubrosDe, sectionOf } from './types';
import { useAuth } from './hooks/useAuth';
import { useInstallApp } from './hooks/useInstallApp';
import { InstallBanner, IosInstallHelp, useInstallAction } from './components/InstallApp';
import BottomNav from './components/BottomNav';
import AccountSheet from './components/AccountSheet';
import { useFavorites } from './hooks/useFavorites';
import { fetchJobs } from './services/jobs';
import { useToast } from './components/Toast';

function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user, isAdmin, signingIn, signInWithGoogle, signOut } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [view, setView] = useState<'all' | 'mine' | 'pending' | 'saved'>('all');
  const favorites = useFavorites();
  const [accountOpen, setAccountOpen] = useState(false);
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

  // Con el teclado abierto (buscador u otro campo) el menú de abajo se esconde para dejar lugar
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    const onIn = (e: FocusEvent) => { if (isField(e.target)) setTyping(true); };
    const onOut = () => setTimeout(() => setTyping(isField(document.activeElement)), 0);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => { document.removeEventListener('focusin', onIn); document.removeEventListener('focusout', onOut); };
  }, []);

  const anyModalOpen = isModalOpen || !!editingJob || !!selectedJobDetail || showOnboarding;
  const [assistantOpen, setAssistantOpen] = useState(false);
  const installApp = useInstallApp();
  const installAction = useInstallAction(installApp.install);
  const mountAssistant = useOnceTrue(assistantOpen);
  const isWide = useIsWide();
  const mountPost = useOnceTrue(isModalOpen);
  const mountEdit = useOnceTrue(!!editingJob);
  const mountDetail = useOnceTrue(!!selectedJobDetail);
  const mountOnboarding = useOnceTrue(showOnboarding);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem('tucu_onboarding_seen', 'true'); } catch { /* navegación privada: se vuelve a mostrar, no pasa nada */ }
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
    if (view === 'saved') return jobs.filter(j => j.estado === 'aprobado' && favorites.ids.includes(j.id));
    return jobs.filter(j => j.estado === 'aprobado');
  }, [jobs, view, user?.id, favorites.ids]);

  const pendingCount = useMemo(() => jobs.filter(j => j.estado === 'pendiente').length, [jobs]);
  const mineCount = useMemo(() => jobs.filter(j => j.ownerId === user?.id).length, [jobs, user?.id]);
  // Solo cuentan los guardados que siguen publicados (si alguien borró su aviso, no suma)
  const savedCount = useMemo(() => jobs.filter(j => j.estado === 'aprobado' && favorites.ids.includes(j.id)).length, [jobs, favorites.ids]);

  // Búsqueda (sin importar mayúsculas ni acentos) + zona, antes de filtrar por categoría
  const searchedJobs = useMemo(() => {
    const q = norm(searchQuery.trim());
    return tabJobs.filter(job => {
      const rubros = rubrosDe(job).flatMap(r => [r, CATEGORIES_CONFIG.find(c => c.id === r)?.label ?? '']);
      const matchesSearch = !q || [job.title, job.zone, job.professionalName, ...rubros, job.description]
        .some(field => norm(field || '').includes(q));
      const matchesZone = !selectedZone || job.zone === selectedZone || job.zone === 'Todo Tucumán';
      return matchesSearch && matchesZone;
    });
  }, [tabJobs, searchQuery, selectedZone]);

  // Cantidad por categoría para los filtros
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of searchedJobs) {
      const rs = new Set(rubrosDe(j));
      for (const r of rs) counts[r] = (counts[r] ?? 0) + 1;
      // cada publicación suma una sola vez en su sección, aunque tenga varios rubros de ella
      for (const sec of new Set([...rs].map(r => CATEGORIES_CONFIG.find(c => c.id === r)?.section).filter(Boolean)))
        counts[`§${sec}`] = (counts[`§${sec}`] ?? 0) + 1;
    }
    // "Todo" muestra lo mismo que la lista: sin búsqueda, una publicación por profesional
    counts.__total = searchQuery.trim() || view !== 'all' ? searchedJobs.length : new Set(searchedJobs.map(j => `${j.whatsapp}|${sectionOf(j.category).id}`)).size;
    return counts;
  }, [searchedJobs, searchQuery, view]);

  const filteredJobs = useMemo(() => {
    if (selectedCategory === 'All') return searchedJobs;
    const isSection = CATEGORIES_CONFIG.some(c => c.section === selectedCategory);
    return searchedJobs.filter(job => rubrosDe(job).some(r =>
      r === selectedCategory ||
      (isSection && CATEGORIES_CONFIG.find(c => c.id === r)?.section === selectedCategory)
    ));
  }, [searchedJobs, selectedCategory]);

  // En el listado general, una sola publicación por profesional y por sección (la más nueva; al profesional
  // se lo reconoce por su WhatsApp), para que nadie ocupe la portada con avisos parecidos. Si tiene
  // publicaciones de secciones distintas (ej: clases y maquillaje) se ven todas. Al buscar o filtrar, todo.
  const listedJobs = useMemo(() => {
    if (view !== 'all' || selectedCategory !== 'All' || searchQuery.trim()) return filteredJobs;
    const vistos = new Set<string>();
    return filteredJobs.filter(j => {
      const clave = `${j.whatsapp}|${sectionOf(j.category).id}`;
      return vistos.has(clave) ? false : (vistos.add(clave), true);
    });
  }, [filteredJobs, view, selectedCategory, searchQuery]);

  // Profesionales distintos (no publicaciones)
  const profesionalesCount = useMemo(() => new Set(filteredJobs.map(j => j.whatsapp)).size, [filteredJobs]);

  const toast = useToast();
  const handleLogout = async () => {
    await signOut();
    toast('Sesión cerrada');
  };

  return (
    <div className="min-h-screen relative">
      <div aria-hidden="true" className="fondo-degrade fixed inset-0 -z-10 pointer-events-none" />
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {!showSplash && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
          <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <a href="/" className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900" translate="no">
                Tucu<span className="text-brand-strong">Oficios</span>
              </a>

              {/* Ayuda en el celular: arriba a la derecha, donde la gente la busca */}
              <button
                type="button"
                onClick={() => setAssistantOpen(true)}
                aria-label="Ayuda y preguntas frecuentes"
                className="sm:hidden -mr-1 inline-flex items-center gap-1.5 h-10 pl-2.5 pr-3 rounded-full text-sm font-semibold text-gray-700 active:bg-gray-100"
              >
                <CircleHelp className="w-5 h-5" aria-hidden="true" />
                Ayuda
              </button>

              <div className="hidden sm:flex items-center gap-2 sm:gap-3">
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
                      <Link
                        to="/estadisticas"
                        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <BarChart3 className="w-4 h-4" aria-hidden="true" />
                        Estadísticas
                      </Link>
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
                  data-tour="publicar"
                  className="hidden sm:inline-flex items-center gap-1.5 bg-brand-strong hover:bg-brand-strong-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar oficio</span>
                </button>
              </div>
            </div>
          </header>

          <main className="pb-16">
            {/* Zona de búsqueda en blanco; los resultados van sobre el fondo cálido */}
            <div className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 pb-4">
            {/* Bienvenida + buscador */}
            <section className="pt-4 pb-3 sm:pt-6 sm:pb-5 md:pt-14 md:pb-10 sm:text-center">
              <h1 className="text-xl leading-tight sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 text-balance">
                <span className="sm:hidden">¿Qué profesional necesitás?</span>
                <span className="hidden sm:inline">Profesionales de confianza en <span className="text-[#E8650A]">Tucumán</span></span>
              </h1>
              <p className="hidden sm:block mt-2 md:mt-4 text-base md:text-lg text-gray-500 max-w-xl mx-auto">
                Plomeros, electricistas, profes y más. Escribiles directo por WhatsApp, sin intermediarios.
              </p>

              {/* Buscador: qué + zona + botón. El filtrado es en vivo; el botón lleva a los resultados. */}
              <form
                role="search"
                data-tour="buscar"
                onSubmit={(e) => {
                  e.preventDefault();
                  (document.activeElement as HTMLElement | null)?.blur();
                  document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="max-w-3xl mx-auto mt-3 sm:mt-5 md:mt-8 flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0 sm:bg-white sm:border sm:border-gray-300 sm:rounded-xl sm:p-1.5 sm:focus-within:border-gray-900 transition-colors text-left"
              >
                <label className="relative flex-1 min-w-0">
                  <span className="sr-only">¿Qué necesitás?</span>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                  <input
                    type="search"
                    id="buscador"
                    placeholder={isWide ? '¿Qué necesitás? Plomero, electricista, clases…' : 'Plomero, electricista, clases…'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 bg-white border border-gray-300 sm:border-0 rounded-xl sm:rounded-lg pl-12 pr-3 outline-none focus:border-gray-900 text-gray-900 placeholder:text-gray-400"
                  />
                </label>
                <div className="flex gap-2 sm:gap-0">
                  <label className="relative flex-1 sm:flex-none sm:w-56 sm:border-l sm:border-gray-200">
                    <span className="sr-only">Zona</span>
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className={`w-full h-12 appearance-none bg-white border border-gray-300 sm:border-0 rounded-xl sm:rounded-none pl-10 pr-8 outline-none focus:border-gray-900 text-sm ${
                        selectedZone ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                    >
                      <option value="">Toda la provincia</option>
                      {ZONES.filter(z => z !== 'Todo Tucumán').map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                  </label>
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-xl sm:rounded-lg bg-brand-strong hover:bg-brand-strong-hover text-white font-semibold transition-colors"
                  >
                    Buscar
                  </button>
                </div>
              </form>
              {installApp.showBanner && (
                <InstallBanner onInstall={installAction.run} onDismiss={installApp.dismiss} />
              )}

              {/* Sellos de confianza */}
              <ul className="hidden sm:flex mt-4 md:mt-5 flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-gray-500">
                <li className="inline-flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />Cada aviso es revisado</li>
                <li className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />Contacto directo</li>
                <li className="inline-flex items-center gap-1.5"><Heart className="w-4 h-4 text-emerald-600" aria-hidden="true" />Gratis para todos</li>
              </ul>
            </section>

            {(user || savedCount > 0 || view === 'saved') && (
              <div role="tablist" aria-label="Vista" className="mb-5 hidden sm:flex gap-1 border-b border-gray-200">
                {([
                  { id: 'all', label: 'Todas', count: null },
                  ...(savedCount > 0 || view === 'saved' ? [{ id: 'saved', label: 'Guardados', count: savedCount }] : []),
                  ...(user ? [{ id: 'mine', label: 'Mis publicaciones', count: mineCount }] : []),
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

            <div data-tour="categorias">
              <CategoryFilter 
                selectedCategory={selectedCategory} 
                onSelectCategory={setSelectedCategory} 
                counts={categoryCounts}
              />
            </div>
            </div>
            </div>

            <div className="max-w-6xl mx-auto px-4">

            {loadError && (
              <div className="max-w-2xl mx-auto mt-6 bg-red-50 text-red-700 font-medium text-sm text-center rounded-lg py-3 px-4">
                {loadError}{' '}
                <button onClick={loadJobs} className="underline">Reintentar</button>
              </div>
            )}

            {!isLoading && (
              <div id="resultados" className="scroll-mt-20 mt-6 sm:mt-10 flex items-baseline justify-between gap-3">
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900">
                  {view === 'pending'
                    ? 'Pendientes de revisión'
                    : view === 'mine'
                      ? 'Tus publicaciones'
                      : view === 'saved'
                        ? 'Tus guardados'
                      : searchQuery || selectedZone || selectedCategory !== 'All'
                        ? 'Resultados'
                        : 'Publicados recientemente'}
                </h2>
                <p className="text-sm text-gray-600 text-right">
                  {view === 'all'
                    ? (profesionalesCount === 1 ? '1 profesional' : `${profesionalesCount} profesionales`)
                    : (listedJobs.length === 1 ? '1 publicación' : `${listedJobs.length} publicaciones`)}
                  {searchQuery && <> para <span className="font-medium text-gray-900">“{searchQuery}”</span></>}
                  {selectedZone && <> en <span className="font-medium text-gray-900">{selectedZone}</span></>}
                </p>
              </div>
            )}

            {/* Listado */}
            <div className="mt-3 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
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
                        : view === 'saved' && !searchQuery && !selectedZone
                          ? 'Todavía no guardaste a nadie'
                        : searchQuery || selectedZone ? 'No encontramos resultados' : 'Todavía no hay publicaciones acá'}
                  </h3>
                  <p className="mt-1 text-gray-600 max-w-sm mx-auto">
                    {view === 'saved' && !searchQuery
                      ? 'Tocá el corazón de un profesional para tenerlo a mano acá.'
                      : searchQuery
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
                      className="px-4 py-2.5 rounded-lg bg-brand-strong hover:bg-brand-strong-hover text-white text-sm font-semibold"
                    >
                      Publicar mi oficio
                    </button>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {listedJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      rubro={selectedCategory !== 'All' ? selectedCategory : undefined}
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
            <GuidedTour
              isOpen={showOnboarding}
              onClose={handleCloseOnboarding}
            />
            </Suspense>
          )}

          {mountAssistant && (
            <Suspense fallback={null}>
              <TucuAssistant open={assistantOpen && !anyModalOpen} onClose={() => setAssistantOpen(false)} />
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
              <div className="rounded-2xl bg-brand-dark px-6 py-8 md:px-12 md:py-12 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">¿Ofrecés un servicio en Tucumán?</h2>
                  <p className="mt-2 text-gray-400 md:text-lg">Publicá gratis, mostrá tus trabajos y recibí consultas por WhatsApp.</p>
                  <PorQueGratis oscuro corto className="mt-4" />
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-strong hover:bg-brand-strong-hover text-white font-semibold transition-colors flex-none"
                >
                  Publicar mi oficio
                </button>
              </div>
            </section>
          )}

          <VolverArriba hidden={anyModalOpen || assistantOpen || typing} />

          {/* Menú de abajo en el celular */}
          <BottomNav
            active={accountOpen || view === 'mine' || view === 'pending' ? 'account' : view === 'saved' ? 'saved' : 'home'}
            savedCount={savedCount}
            hidden={(anyModalOpen && !showOnboarding) || assistantOpen || (typing && !showOnboarding)}
            avatarUrl={user?.user_metadata?.avatar_url}
            onHome={() => { setView('all'); setSelectedCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onSearch={() => { setView('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => document.getElementById('buscador')?.focus(), 250); }}
            onPublish={() => setIsModalOpen(true)}
            onSaved={() => { setView('saved'); setSelectedCategory('All'); document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
            onAccount={() => setAccountOpen(true)}
          />
          <AccountSheet
            open={accountOpen}
            onClose={() => setAccountOpen(false)}
            user={user}
            isAdmin={isAdmin}
            mineCount={mineCount}
            pendingCount={pendingCount}
            canInstall={installApp.canInstall}
            onSignIn={signInWithGoogle}
            onSignOut={handleLogout}
            onMine={() => { setView('mine'); setSelectedCategory('All'); setTimeout(() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
            onStats={() => navigate('/estadisticas')}
            onPending={() => { setView('pending'); setSelectedCategory('All'); setTimeout(() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
            onInstall={installAction.run}
            onHowItWorks={() => { window.scrollTo({ top: 0 }); setShowOnboarding(true); }}
            onFaq={() => setAssistantOpen(true)}
          />

          <footer className="border-t border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 grid gap-8 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <p className="text-lg font-extrabold tracking-tight text-gray-900" translate="no">
                  Tucu<span className="text-brand-strong">Oficios</span>
                </p>
                <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">
                  Profesionales y emprendedores de Tucumán, con contacto directo por WhatsApp. Cada aviso se revisa antes de publicarse.
                </p>
              </div>
              <nav aria-label="Para profesionales" className="text-sm">
                <p className="font-semibold text-gray-900">Para profesionales</p>
                <ul className="mt-3 space-y-2 text-gray-600">
                  <li><button type="button" onClick={() => setIsModalOpen(true)} className="hover:text-gray-900">Publicar mi oficio</button></li>
                  {!user && <li><button type="button" onClick={signInWithGoogle} className="hover:text-gray-900">Entrar a mi cuenta</button></li>}
                </ul>
              </nav>
              <nav aria-label="Ayuda" className="text-sm">
                <p className="font-semibold text-gray-900">Ayuda</p>
                <ul className="mt-3 space-y-2 text-gray-600">
                  <li><button type="button" onClick={() => { window.scrollTo({ top: 0 }); setShowOnboarding(true); }} className="hover:text-gray-900">¿Cómo funciona?</button></li>
                  <li><button type="button" onClick={() => setAssistantOpen(true)} className="hover:text-gray-900">Preguntas frecuentes</button></li>
                  {installApp.canInstall && <li><button type="button" onClick={installAction.run} className="hover:text-gray-900">Instalar la app</button></li>}
                  <li><Link to="/privacidad" className="hover:text-gray-900">Política de privacidad</Link></li>
                </ul>
              </nav>
            </div>
            <div className="border-t border-gray-100">
              <p className="max-w-6xl mx-auto px-4 py-4 pb-24 sm:pb-4 text-xs text-gray-500">© {new Date().getFullYear()} TucuOficios. Hecho en Tucumán.</p>
            </div>
          </footer>
          <IosInstallHelp open={installAction.iosHelp} onClose={installAction.closeIosHelp} />
          {signingIn && (
            <div role="status" aria-live="polite" className="fixed inset-0 z-[400] grid place-items-center bg-white/85">
              <div className="flex flex-col items-center gap-3 text-gray-900">
                <span className="w-9 h-9 rounded-full border-[3px] border-gray-200 border-t-brand-strong animate-spin" aria-hidden="true" />
                <p className="text-base font-semibold">Abriendo Google…</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
      <CookieBanner paused={showOnboarding} />
    </div>
  );
}

export default function App() {
  // Una visita por carga del sitio (la base no repite el mismo dispositivo en 30 min)
  useEffect(() => {
    contar('visita');
  }, []);

  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg" />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/p/:id/:slug?" element={<ProfilePage />} />
        <Route path="/privacidad" element={<PrivacyPolicy />} />
        <Route path="/estadisticas" element={<EstadisticasPage />} />
        <Route path="/:alias" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
