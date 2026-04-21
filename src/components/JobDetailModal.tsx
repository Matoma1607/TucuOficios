import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, MapPin, User, Calendar, ShieldCheck, Share2, Facebook, Twitter, Link as LinkIcon, Check } from 'lucide-react';
import { Job, CATEGORIES_CONFIG } from '../types';
import * as Icons from 'lucide-react';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobDetailModal({ job, isOpen, onClose }: JobDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!job) return null;

  const categoryInfo = CATEGORIES_CONFIG.find(c => c.id === job.category);
  const IconComponent = categoryInfo ? (Icons as any)[categoryInfo.iconName] : Icons.HelpCircle;

  const whatsappUrl = `https://wa.me/${job.whatsapp}?text=${encodeURIComponent(
    `Hola ${job.professionalName}, vi tu trabajo "${job.title}" en TucuOficios y me gustaría consultarte.`
  )}`;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?jobId=${job.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button Mobile */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg md:hidden"
            >
              <X className="w-6 h-6 text-brand-dark" />
            </button>

            {/* Left: Image Section */}
            <div className="w-full md:w-1/2 h-[300px] md:h-auto relative bg-gray-50 flex-shrink-0">
              {job.imageUrl ? (
                <img 
                  src={job.imageUrl} 
                  alt={job.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                  <Icons.Image className="w-16 h-16 opacity-10" />
                  <span className="text-xs font-black uppercase tracking-widest mt-4 opacity-20">Sin imagen disponible</span>
                </div>
              )}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <span className="px-4 py-2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-brand-primary/20 flex items-center gap-2">
                  <IconComponent className="w-3.5 h-3.5" />
                  {job.category}
                </span>
                {job.estado === 'pendiente' && (
                  <span className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-amber-500/20">
                    En Revisión
                  </span>
                )}
              </div>
            </div>

            {/* Right: Content Section */}
            <div className="w-full md:w-1/2 flex flex-col h-full bg-white relative">
              {/* Close Button Desktop */}
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 hidden md:block p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-brand-dark transition-colors" />
              </button>

              <div className="p-8 md:p-12 overflow-y-auto flex-grow scrollbar-hide">
                <div className="space-y-8">
                  {/* Title & Stats */}
                  <div>
                    <h2 className="text-3xl font-black text-brand-dark leading-[1.1] mb-6">
                      {job.title}
                    </h2>
                    
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Zona</p>
                          <p className="text-sm font-bold text-brand-dark">{job.zone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Profesional</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-brand-dark">{job.professionalName}</p>
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Publicado</p>
                          <p className="text-sm font-bold text-brand-dark">
                            {new Date(job.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-brand-dark uppercase tracking-[0.1em]">Sobre este trabajo</h3>
                    <div className="p-6 bg-gray-50 rounded-[24px] border border-gray-100">
                      <p className="text-gray-600 text-base leading-[1.6] font-medium whitespace-pre-wrap">
                        {job.description || "El profesional no proporcionó una descripción adicional."}
                      </p>
                    </div>
                  </div>

                  {/* Contact & Share */}
                  <div className="pt-4 border-t border-gray-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Compartir perfil</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleCopyLink}
                          className={`p-2 rounded-xl border transition-all ${copied ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 text-gray-400 hover:border-brand-primary hover:text-brand-primary'}`}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                        </button>
                        <button className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:border-blue-600 hover:text-blue-600 transition-all">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 bg-brand-primary text-white w-full py-5 px-8 rounded-[20px] font-black text-lg shadow-xl shadow-brand-primary/20 hover:bg-orange-600 hover:shadow-brand-primary/30 active:scale-[0.98] transition-all group"
                    >
                      <MessageCircle className="w-6 h-6 stroke-[2.5]" />
                      <span>Contactar ahora</span>
                      <Icons.ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
