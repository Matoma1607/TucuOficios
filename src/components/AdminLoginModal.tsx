import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (code: string) => void;
  isLoading?: boolean;
  error?: boolean;
}

const AdminLoginModal = ({ isOpen, onClose, onLogin, isLoading, error }: AdminLoginModalProps) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || isLoading) return;
    onLogin(code);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isLoading && onClose()}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={error 
              ? { x: [-10, 10, -10, 10, 0], opacity: 1, scale: 1, y: 0 } 
              : { opacity: 1, scale: 1, y: 0 }
            }
            transition={error ? { duration: 0.4 } : undefined}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="relative p-8 pb-4 text-center">
              {!isLoading && (
                <button 
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              
              <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-brand-primary" />
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Acceso Administrador</h2>
              <p className="text-gray-500 text-sm mt-2 font-medium">
                Ingresá el código de seguridad para gestionar profesionales.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end pl-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Código de Seguridad
                  </label>
                  {error && (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-black uppercase text-red-500"
                    >
                      Código Incorrecto
                    </motion.span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input
                    type="password"
                    autoFocus
                    disabled={isLoading}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-gray-50 border-2 rounded-2xl py-4 pl-12 pr-4 text-lg font-bold tracking-[0.5em] outline-none transition-all placeholder:tracking-normal placeholder:text-gray-200 ${
                      error ? 'border-red-500/50 focus:border-red-500 bg-red-50/10' : 'border-gray-100 focus:border-brand-primary'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!code || isLoading}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  code && !isLoading
                    ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/30 hover:scale-[1.02]'
                    : 'bg-gray-100 text-gray-400 grayscale cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Confirmar Acceso
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
              
              <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-wider">
                Exclusivo para el equipo de TucuOficios
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdminLoginModal;
