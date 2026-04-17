import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, MapPin, User, Trash2, AlertCircle, Edit2, ChevronRight, HelpCircle } from 'lucide-react';
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

  const categoryInfo = CATEGORIES_CONFIG.find(c => c.id === job.category);
  const IconComponent = categoryInfo ? (Icons as any)[categoryInfo.iconName] : HelpCircle;

  const whatsappUrl = `https://wa.me/${job.whatsapp}?text=${encodeURIComponent(
    `Hola ${job.professionalName}, vi tu trabajo "${job.title}" en TucuOficios y me gustaría consultarte.`
  )}`;

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
      
      alert('Solicitud enviada.');
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative"
    >
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-white/95 flex flex-col items-center justify-center p-6 text-center"
          >
            <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
            <h4 className="text-lg font-black text-brand-dark mb-4">¿Borrar publicación?</h4>
            <div className="flex gap-2 w-full">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">No</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold">Sí, borrar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full">
        {/* Image */}
        <div className="w-full aspect-square relative flex-shrink-0 bg-gray-50 border-b border-gray-50">
          <img
            src={job.imageUrl || 'https://picsum.photos/seed/job/400/400'}
            alt={job.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="px-1.5 py-0.5 bg-brand-primary text-white text-[9px] font-black uppercase rounded shadow-sm flex items-center gap-1">
              <IconComponent className="w-2.5 h-2.5" />
              {job.category}
            </span>
            {job.estado === 'pendiente' && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase rounded shadow-sm">
                En Revisión
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-black text-brand-dark leading-tight line-clamp-2 min-h-[2.5rem]">
              {job.title}
            </h3>
            {isAdmin && (
              <div className="flex gap-1.5 flex-shrink-0 ml-2">
                <button onClick={() => onEdit?.(job)} className="p-1 text-gray-400 hover:text-brand-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setShowConfirm(true)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-center text-gray-400 text-[11px] font-bold">
              <MapPin className="w-3 h-3 mr-1.5 text-brand-primary/60" />
              <span>{job.zone}</span>
            </div>
            <div className="flex items-center text-gray-400 text-[11px] font-bold">
              <User className="w-3 h-3 mr-1.5 text-brand-primary/60" />
              <span>{job.professionalName}</span>
            </div>
          </div>

          <div className="mt-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white py-2.5 px-4 rounded-lg font-black text-xs shadow-sm hover:bg-orange-600 active:scale-95 transition-all w-full"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contactar</span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
