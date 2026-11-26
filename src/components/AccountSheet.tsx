import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, LogIn, LogOut, FileText, Download, HelpCircle, MessageCircleQuestion, ShieldCheck, ScrollText,
  ClipboardCheck, ChevronRight, BarChart3, Instagram, ExternalLink, UserRound, LifeBuoy, Scale, Settings2,
} from 'lucide-react';
import { INSTAGRAM_OFICIAL, INSTAGRAM_OFICIAL_URL } from '../lib/alias';
import { Link } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
  mineCount: number;
  pendingCount: number;
  canInstall: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onMine: () => void;
  onPending: () => void;
  onStats: () => void;
  onInstall: () => void;
  onHowItWorks: () => void;
  onFaq: () => void;
}

const fechaVersion = (() => {
  try {
    return new Date(__BUILD_DATE__).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
})();

/** Tarjeta con título e ícono, y sus opciones separadas por una línea. */
function Grupo({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/70 px-4">
      <h2 className="flex items-center justify-between pt-4 pb-1 text-[17px] font-bold text-gray-900">
        {titulo}
        <span className="text-gray-400" aria-hidden="true">{icono}</span>
      </h2>
      <div className="divide-y divide-gray-100">{children}</div>
    </section>
  );
}

const fila = 'w-full flex items-center gap-3 h-14 text-left text-[15px] text-gray-800 active:opacity-60';
const flecha = <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />;

/** Pantalla "Más" del menú de abajo (celular): todas las opciones agrupadas. */
export default function AccountSheet(p: Props) {
  const go = (fn: () => void) => () => { p.onClose(); fn(); };
  const { open, onClose } = p;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  const name = (p.user?.user_metadata?.full_name as string | undefined) || p.user?.email || '';
  const avatar = p.user?.user_metadata?.avatar_url as string | undefined;

  return (
    <AnimatePresence>
      {p.open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Más opciones"
          // queda debajo del menú de abajo, que sigue visible
          className="sm:hidden fixed inset-0 z-[85] bg-gray-100 overflow-y-auto overscroll-contain pb-[calc(88px+env(safe-area-inset-bottom))]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <header className="sticky top-0 z-10 bg-gray-100/95 backdrop-blur px-4 h-14 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Más</h1>
            <button type="button" onClick={p.onClose} aria-label="Cerrar" className="w-10 h-10 -mr-2 grid place-items-center rounded-full text-gray-500 active:bg-gray-200">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </header>

          <div className="px-4 space-y-4">
            {/* Quién sos */}
            <section className="bg-white rounded-2xl border border-gray-200/70 p-4">
              <div className="flex items-center gap-3">
                {avatar ? (
                  <img src={avatar} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full" />
                ) : (
                  <span className="w-12 h-12 rounded-full bg-gray-100 grid place-items-center text-gray-400">
                    {name ? <span className="font-bold">{name[0].toUpperCase()}</span> : <UserRound className="w-6 h-6" aria-hidden="true" />}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{p.user ? name : '¡Hola!'}</p>
                  <p className="text-sm text-gray-500 truncate">{p.user ? 'Sesión iniciada con Google' : 'Entrá para publicar tu oficio'}</p>
                </div>
              </div>
              {!p.user && (
                <button
                  type="button"
                  onClick={go(p.onSignIn)}
                  className="mt-4 w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-brand-strong active:bg-brand-strong-hover text-white font-semibold"
                >
                  <LogIn className="w-5 h-5" aria-hidden="true" />
                  Entrar con Google
                </button>
              )}
              {p.user && (
                <div className="mt-2 border-t border-gray-100">
                  <button type="button" onClick={go(p.onMine)} className={fila}>
                    <FileText className="w-5 h-5 text-gray-400" aria-hidden="true" />
                    <span className="flex-1">Mis publicaciones</span>
                    {p.mineCount > 0 && <span className="text-sm text-gray-500">{p.mineCount}</span>}
                    {flecha}
                  </button>
                </div>
              )}
            </section>

            {p.isAdmin && (
              <Grupo titulo="Administración" icono={<Settings2 className="w-5 h-5" />}>
                <button type="button" onClick={go(p.onPending)} className={fila}>
                  <span className="flex-1">Pendientes de revisión</span>
                  {p.pendingCount > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{p.pendingCount}</span>}
                  {flecha}
                </button>
                <button type="button" onClick={go(p.onStats)} className={fila}>
                  <span className="flex-1">Estadísticas</span>
                  {flecha}
                </button>
              </Grupo>
            )}

            <Grupo titulo="Ayuda" icono={<LifeBuoy className="w-5 h-5" />}>
              <button type="button" onClick={go(p.onHowItWorks)} className={fila}>
                <HelpCircle className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <span className="flex-1">¿Cómo funciona?</span>
                {flecha}
              </button>
              <button type="button" onClick={go(p.onFaq)} className={fila}>
                <MessageCircleQuestion className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <span className="flex-1">Preguntas frecuentes</span>
                {flecha}
              </button>
              {p.canInstall && (
                <button type="button" onClick={go(p.onInstall)} className={fila}>
                  <Download className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  <span className="flex-1">Instalar la app</span>
                  {flecha}
                </button>
              )}
            </Grupo>

            <Grupo titulo="Seguinos" icono={<Instagram className="w-5 h-5" />}>
              <a href={INSTAGRAM_OFICIAL_URL} target="_blank" rel="noopener noreferrer" onClick={p.onClose} className={fila}>
                <span className="flex-1">Instagram</span>
                <span className="text-sm text-gray-400">@{INSTAGRAM_OFICIAL}</span>
                <ExternalLink className="w-4 h-4 text-gray-300" aria-hidden="true" />
              </a>
            </Grupo>

            <Grupo titulo="Legales" icono={<Scale className="w-5 h-5" />}>
              <Link to="/privacidad" onClick={p.onClose} className={fila}>
                <ShieldCheck className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <span className="flex-1">Política de privacidad</span>
                {flecha}
              </Link>
              <Link to="/terminos" onClick={p.onClose} className={fila}>
                <ScrollText className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <span className="flex-1">Términos de uso</span>
                {flecha}
              </Link>
            </Grupo>

            {p.user && (
              <button
                type="button"
                onClick={go(p.onSignOut)}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-white border border-gray-200/70 text-red-600 font-semibold active:bg-red-50"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                Cerrar sesión
              </button>
            )}

            <p className="pt-2 pb-2 text-center text-xs text-gray-400">
              TucuOficios · versión {__APP_VERSION__}
              {fechaVersion && <><br />Actualizada el {fechaVersion}</>}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
