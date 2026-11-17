import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initGA } from '../lib/analytics';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    } else if (consent === 'accepted') {
      initGA();
    }
  }, []);

  const decide = (accepted: boolean) => {
    localStorage.setItem('cookie-consent', accepted ? 'accepted' : 'rejected');
    setIsVisible(false);
    if (accepted) initGA();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="region"
          aria-label="Aviso de cookies"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-[60] bg-white border border-gray-200 rounded-xl shadow-lg p-4"
        >
          <p className="text-sm text-gray-700 leading-relaxed">
            Usamos cookies para estadísticas anónimas de visitas.{' '}
            <Link to="/privacidad" className="underline underline-offset-2 hover:text-gray-900">Más info</Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => decide(false)}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Rechazar
            </button>
            <button
              onClick={() => decide(true)}
              className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
            >
              Aceptar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
