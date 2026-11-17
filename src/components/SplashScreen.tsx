import { motion } from 'motion/react';

// Splash corto: solo en la primera visita, un fundido del logo.
export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
      aria-hidden="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        <div className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900" translate="no">
          Tucu<span className="text-brand-strong">Oficios</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">Profesionales de confianza en Tucumán</p>
      </motion.div>
    </motion.div>
  );
}
