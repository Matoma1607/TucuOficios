import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, MapPin, User, Trash2, AlertCircle, Edit2 } from 'lucide-react';
import { Job, User as UserType } from '../types';
import { deleteJob } from '../services/firebase';
import EditJobModal from './EditJobModal';

interface JobCardProps {
  job: Job;
  currentUser: UserType | null;
  onEdit?: (job: Job) => void;
  key?: React.Key;
}

export default function JobCard({ job, currentUser, onEdit }: JobCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isOwner = currentUser?.uid === job.professionalId;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'matias39974593@gmail.com';

  const whatsappUrl = `https://wa.me/${job.whatsapp}?text=${encodeURIComponent(
    `Hola ${job.professionalName}, vi tu trabajo "${job.title}" en TucuOficios y me gustaría consultarte.`
  )}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteJob(job.id);
    } catch (error) {
      console.error("Error deleting job:", error);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col bg-white/70 backdrop-blur-md border border-white/40 rounded-[2rem] overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_8px_32px_0_rgba(79,70,229,0.15)] transition-all duration-500"
    >
      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">¿Borrar trabajo?</h4>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Borrar'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={job.imageUrl}
          alt={job.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-800 rounded-full shadow-sm">
            {job.category}
          </span>
        </div>
        
        {(isOwner || isAdmin) && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAdmin && (
              <button
                onClick={() => onEdit?.(job)}
                className="p-2 bg-white/90 backdrop-blur-sm text-blue-500 rounded-full shadow-sm hover:bg-blue-50 transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-sm hover:bg-red-50 transition-colors"
              title="Borrar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">
          {job.title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
            <span className="truncate">{job.zone}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <User className="w-4 h-4 mr-1.5 shrink-0" />
            <span className="truncate">{job.professionalName}</span>
          </div>
        </div>

        <div className="mt-auto">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-3 px-4 bg-brand-primary hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </motion.div>
  );
}
