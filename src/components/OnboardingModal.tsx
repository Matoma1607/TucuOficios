import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, MessageCircle, X, ChevronRight } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const steps = [
    {
      icon: <Search className="w-6 h-6 text-brand-primary" />,
      title: "Busca un oficio",
      desc: "Encontrá profesionales cerca de tu zona usando el buscador o filtrando por categorías."
    },
    {
      icon: <Plus className="w-6 h-6 text-brand-primary" />,
      title: "Publicá el tuyo",
      desc: "¿Tenés un oficio? Registrate gratis y empezá a recibir consultas por WhatsApp hoy mismo."
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-brand-primary" />,
      title: "Contactá directo",
      desc: "Sin intermediarios. Hacé clic en 'Contactar' para hablar directamente por WhatsApp con el profesional."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden p-8"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="text-2xl font-black tracking-tighter text-brand-dark">
                  Tucu<span className="text-brand-primary">Oficios</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-brand-dark">¡Hola! Qué bueno verte.</h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Tu nexo con el trabajo local</p>
            </div>

            <div className="space-y-6 mb-10">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-sm">{step.title}</h3>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed mt-1">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <span>¡Entendido! Empezar ahora</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
