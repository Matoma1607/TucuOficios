import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, LogOut, FileText, Download, HelpCircle, MessageCircleQuestion, ShieldCheck, ClipboardCheck, ChevronRight } from 'lucide-react';
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
  onInstall: () => void;
  onHowItWorks: () => void;
  onFaq: () => void;
}

/** Hoja "Cuenta" del menú de abajo (celular). */
export default function AccountSheet(p: Props) {
  const row = 'w-full flex items-center gap-3 px-4 h-14 text-left text-[15px] font-medium text-gray-900 active:bg-gray-50';
  const go = (fn: () => void) => () => { p.onClose(); fn(); };
  const { open, onClose } = p;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  const name = (p.user?.user_metadata?.full_name as string | undefined) || p.user?.email || '';
  return (
    <AnimatePresence>
      {p.open && (
        <motion.div
          className="sm:hidden fixed inset-0 z-[100] flex items-end bg-gray-900/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={p.onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Cuenta"
            className="w-full bg-white rounded-t-3xl pt-2 pb-[calc(16px+env(safe-area-inset-bottom))]"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 w-10 h-1 rounded-full bg-gray-200" />
            <div className="px-4 pb-3 flex items-center gap-3">
              {p.user?.user_metadata?.avatar_url ? (
                <img src={p.user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full" />
              ) : (
                <span className="w-11 h-11 rounded-full bg-gray-100 grid place-items-center text-gray-400 font-bold">
                  {name ? name[0].toUpperCase() : '?'}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate">{p.user ? name : 'Tu cuenta'}</p>
                <p className="text-sm text-gray-500 truncate">{p.user ? 'Sesión iniciada con Google' : 'Entrá para publicar tu oficio'}</p>
              </div>
              <button type="button" onClick={p.onClose} aria-label="Cerrar" className="w-9 h-9 grid place-items-center rounded-full text-gray-400">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="border-t border-gray-100">
              {!p.user ? (
                <button type="button" onClick={go(p.onSignIn)} className={row}>
                  <LogIn className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="flex-1">Entrar con Google</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
                </button>
              ) : (
                <button type="button" onClick={go(p.onMine)} className={row}>
                  <FileText className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="flex-1">Mis publicaciones</span>
                  {p.mineCount > 0 && <span className="text-sm text-gray-500">{p.mineCount}</span>}
                  <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
                </button>
              )}
              {p.isAdmin && (
                <button type="button" onClick={go(p.onPending)} className={row}>
                  <ClipboardCheck className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="flex-1">Pendientes de revisión</span>
                  {p.pendingCount > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{p.pendingCount}</span>}
                  <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
                </button>
              )}
              {p.canInstall && (
                <button type="button" onClick={go(p.onInstall)} className={row}>
                  <Download className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="flex-1">Instalar la app</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
                </button>
              )}
              <button type="button" onClick={go(p.onHowItWorks)} className={row}>
                <HelpCircle className="w-5 h-5 text-gray-500" aria-hidden="true" />
                <span className="flex-1">¿Cómo funciona?</span>
                <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
              </button>
              <button type="button" onClick={go(p.onFaq)} className={row}>
                <MessageCircleQuestion className="w-5 h-5 text-gray-500" aria-hidden="true" />
                <span className="flex-1">Preguntas frecuentes</span>
                <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
              </button>
              <Link to="/privacidad" onClick={p.onClose} className={row}>
                <ShieldCheck className="w-5 h-5 text-gray-500" aria-hidden="true" />
                <span className="flex-1">Política de privacidad</span>
                <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
              </Link>
              {p.user && (
                <button type="button" onClick={go(p.onSignOut)} className={`${row} text-red-600`}>
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                  <span className="flex-1">Cerrar sesión</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
