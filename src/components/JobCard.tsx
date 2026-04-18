import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, MapPin, User, Trash2, AlertCircle, Edit2, ChevronRight, HelpCircle, Share2, ShieldCheck, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Job, CATEGORIES_CONFIG } from '../types';
import { CONFIG } from '../config';

interface JobCardProps {
  job: Job;
  isAdmin: boolean;
  onEdit?: (job: Job) => void;
}

export default function JobCard({ job, isAdmin, onEdit }: JobCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const categoryInfo = CATEGORIES_CONFIG.find(c => c.id === job.category);
  const IconComponent = categoryInfo ? (Icons as any)[categoryInfo.iconName] : HelpCircle;

  const whatsappUrl = `https://wa.me/${job.whatsapp}?text=${encodeURIComponent(
    `Hola ${job.professionalName}, vi tu trabajo "${job.title}" en TucuOficios y me gustaría consultarte.`
  )}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TucuOficios - ${job.title}`,
          text: `Mirá el trabajo de ${job.professionalName} en TucuOficios: ${job.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsSharing(true);
        setTimeout(() => setIsSharing(false), 2000);
      } catch (err) {
        console.error('Error copying:', err);
      }
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const scriptUrl = CONFIG.GOOGLE_SCRIPT_URL;
      if (!scriptUrl) throw new Error('GAS URL missing');

      await fetch(`${scriptUrl}?action=delete`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ id: job.id })
      });
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500 relative group"
    >
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h4 className="text-xl font-black text-brand-dark mb-4">¿Borrar publicación?</h4>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-2xl font-black text-sm transition-all"
              >
                No
              </button>
              <button 
                onClick={handleDelete} 
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {isDeleting ? 'Borrando...' : 'Sí, borrar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full">
        {/* Image */}
        <div className="w-full h-72 relative flex-none bg-gray-50 overflow-hidden">
          <img
            src={job.imageUrl || 'https://picsum.photos/seed/job/400/400'}
            alt={job.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="px-3 py-1.5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5">
              <IconComponent className="w-3 h-3" />
              {job.category}
            </span>
            {job.estado === 'pendiente' && (
              <span className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                En Revisión
              </span>
            )}
          </div>

          <button 
            onClick={handleShare}
            className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full text-gray-600 hover:bg-white hover:text-brand-primary active:scale-90 transition-all shadow-md z-10"
          >
            {isSharing ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-black text-brand-dark leading-tight line-clamp-2 min-h-[3rem]">
              {job.title}
            </h3>
            {isAdmin && (
              <div className="flex gap-2 flex-shrink-0 ml-3">
                <button onClick={() => onEdit?.(job)} className="p-2 text-gray-400 hover:text-brand-primary transition-colors hover:bg-gray-50 rounded-full"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setShowConfirm(true)} className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-gray-50 rounded-full"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center text-gray-400 text-xs font-bold">
              <div className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center mr-3 border border-gray-100">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
              </div>
              <span className="text-gray-600">{job.zone}</span>
            </div>
            <div className="flex items-center text-gray-400 text-xs font-bold">
              <div className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center mr-3 border border-gray-100">
                <User className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600">{job.professionalName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-brand-primary text-white py-4 px-6 rounded-2xl font-black text-sm shadow-xl shadow-orange-100 hover:bg-orange-600 active:scale-[0.98] transition-all w-full group/btn"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar vía WhatsApp</span>
              <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all ml-auto" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
