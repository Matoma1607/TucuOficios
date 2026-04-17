import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, MapPin, User, Trash2, AlertCircle, Edit2, ChevronRight } from 'lucide-react';
import { Job } from '../types';
import { CONFIG } from '../config';

interface JobCardProps {
  job: Job;
  isAdmin: boolean;
  onEdit?: (job: Job) => void;
}

export default function JobCard({ job, isAdmin, onEdit }: JobCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        <div className="w-full aspect-video relative flex-shrink-0">
          <img
            src={job.imageUrl || 'https://picsum.photos/seed/job/400/400'}
            alt={job.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="px-2 py-1 bg-brand-primary text-white text-[10px] font-black uppercase rounded-md shadow-sm">
              {job.category}
            </span>
            {job.estado === 'pendiente' && (
              <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-black uppercase rounded-md shadow-sm">
                En Revisión
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-black text-brand-dark leading-tight line-clamp-2 min-h-[3rem]">
              {job.title}
            </h3>
            {isAdmin && (
              <div className="flex gap-2 flex-shrink-0 ml-2">
                <button onClick={() => onEdit?.(job)} className="p-1 text-gray-400 hover:text-brand-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setShowConfirm(true)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center text-gray-500 text-xs font-bold">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-brand-primary" />
              <span>{job.zone}</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs font-bold">
              <User className="w-3.5 h-3.5 mr-1.5 text-brand-primary" />
              <span>{job.professionalName}</span>
            </div>
          </div>

          <div className="mt-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white py-3 px-6 rounded-xl font-black text-sm shadow-md hover:shadow-lg hover:bg-orange-600 active:scale-95 transition-all w-full"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
