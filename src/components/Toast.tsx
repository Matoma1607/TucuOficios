import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type ToastKind = 'success' | 'error';
interface ToastItem { id: number; message: string; kind: ToastKind }

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

/** Avisos cortos abajo de la pantalla: "Cambios guardados", "Link copiado", etc. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId.current++;
    setToasts(prev => [...prev.slice(-2), { id, message, kind }]);
    // Los avisos largos quedan más tiempo para poder leerlos
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), Math.max(3000, message.length * 70));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[300] bottom-[calc(80px+env(safe-area-inset-bottom))] sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none w-[calc(100%-32px)] sm:w-auto"
      >
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-dark text-white text-sm font-medium px-4 py-3 shadow-lg"
              role={t.kind === 'error' ? 'alert' : 'status'}
            >
              {t.kind === 'error'
                ? <AlertCircle className="w-4 h-4 text-red-400 flex-none" aria-hidden="true" />
                : <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none" aria-hidden="true" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
