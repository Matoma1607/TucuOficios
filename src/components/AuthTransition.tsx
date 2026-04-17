import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Lock, Unlock } from 'lucide-react';

interface AuthTransitionProps {
  isOpen: boolean;
  type: 'login' | 'logout';
}

const AuthTransition = ({ isOpen, type }: AuthTransitionProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-4 border-white/10 border-t-brand-primary"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {type === 'login' ? (
                  <Unlock className="w-8 h-8 text-white" />
                ) : (
                  <Lock className="w-8 h-8 text-white" />
                )}
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white px-8">
                {type === 'login' ? 'Iniciando Sesión...' : 'Cerrando Sesión...'}
              </h2>
              <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
                Modo Administrador
              </p>
            </div>
            
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin mt-4" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthTransition;
