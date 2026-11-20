import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share, SquarePlus } from 'lucide-react';

interface BannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

/** Aviso chico en el celular para instalar el sitio como app. */
export function InstallBanner({ onInstall, onDismiss }: BannerProps) {
  return (
    <div className="sm:hidden mt-3 flex items-center gap-3 rounded-2xl bg-white/80 border border-white px-3 py-2.5 shadow-[0_6px_20px_-12px_rgba(30,42,90,.35)]">
      <img src="/icon-192.png" alt="" width={40} height={40} className="w-10 h-10 rounded-xl shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900 leading-tight">TucuOficios en tu celu</p>
        <p className="text-xs text-gray-500 leading-tight mt-0.5">Abrilo desde la pantalla de inicio, como una app.</p>
      </div>
      <button
        type="button"
        onClick={onInstall}
        className="shrink-0 h-9 px-3.5 rounded-full bg-brand-strong hover:bg-brand-strong-hover text-sm font-bold"
      >
        Instalar
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso de instalación"
        className="shrink-0 -mr-1 w-8 h-8 grid place-items-center rounded-full text-gray-400 hover:text-gray-700"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

interface IosHelpProps {
  open: boolean;
  onClose: () => void;
}

/** En iPhone no hay botón de instalar: se explica cómo hacerlo desde Safari. */
export function IosInstallHelp({ open, onClose }: IosHelpProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-900/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="w-full max-w-md bg-white rounded-t-3xl px-5 pt-5 pb-8"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="ios-install-title" className="text-lg font-extrabold text-gray-900">Instalar en iPhone</h2>
              <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 grid place-items-center rounded-full text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="flex items-center gap-3">
                <span className="w-9 h-9 grid place-items-center rounded-xl bg-gray-100 shrink-0"><Share className="w-5 h-5 text-[#007AFF]" aria-hidden="true" /></span>
                <span>Tocá <b>Compartir</b>, abajo en Safari.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-9 h-9 grid place-items-center rounded-xl bg-gray-100 shrink-0"><SquarePlus className="w-5 h-5 text-gray-800" aria-hidden="true" /></span>
                <span>Elegí <b>Agregar a inicio</b> y tocá <b>Agregar</b>.</span>
              </li>
            </ol>
            <button type="button" onClick={onClose} className="mt-6 w-full h-12 rounded-xl bg-brand-strong hover:bg-brand-strong-hover font-bold">
              Entendido
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Lógica compartida para el aviso y el link del pie. */
export function useInstallAction(install: () => Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'>) {
  const [iosHelp, setIosHelp] = useState(false);
  const run = async () => {
    const r = await install();
    if (r === 'ios') setIosHelp(true);
  };
  return { run, iosHelp, closeIosHelp: () => setIosHelp(false) };
}
