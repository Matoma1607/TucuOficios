import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageCircle, Plus, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Search,
    title: 'Buscá lo que necesitás',
    desc: 'Usá el buscador o filtrá por categoría y zona.',
  },
  {
    icon: MessageCircle,
    title: 'Escribile directo',
    desc: 'Cada profesional tiene su botón de WhatsApp. Sin intermediarios ni comisiones.',
  },
  {
    icon: Plus,
    title: '¿Tenés un oficio? Publicalo',
    desc: 'Es gratis. Entrás con Google, cargás una foto de tu trabajo y listo.',
  },
];

const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 sm:p-8"
          >
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <p className="text-sm font-semibold text-brand-strong">Bienvenido a TucuOficios</p>
            <h2 id="onboarding-title" className="mt-1 text-2xl font-bold text-gray-900">
              Así funciona
            </h2>

            <ol className="mt-6 space-y-5">
              {STEPS.map(({ icon: Icon, title, desc }, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center flex-none">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <button
              onClick={onClose}
              className="mt-8 w-full py-3 rounded-lg bg-brand-strong hover:bg-brand-strong-hover text-white font-semibold transition-colors"
            >
              Empezar
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
