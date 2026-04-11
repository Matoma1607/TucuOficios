import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { initGA } from '../lib/analytics';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    } else if (consent === 'accepted') {
      initGA();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    initGA();
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setIsVisible(false);
    // Aquí se asegurarían de que no se carguen scripts de seguimiento
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-50"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2rem] p-6 flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-brand-primary" />
              </div>
              <div className="flex-grow">
                <h3 className="text-sm font-bold text-brand-dark mb-1">Control de Privacidad</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Respetamos tu privacidad. Podés aceptar todas las cookies para una mejor experiencia, rechazarlas o configurar tus preferencias. No instalaremos cookies de seguimiento sin tu consentimiento.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAccept}
                className="w-full py-3 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100"
              >
                Aceptar todas
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  Configurar
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
