import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, MapPin, User, Trash2, AlertCircle, Edit2, ChevronRight, HelpCircle, Share2, ShieldCheck, Check, Maximize2, X, Megaphone } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Job, CATEGORIES_CONFIG } from '../types';
import { CONFIG } from '../config';

interface JobCardProps {
  job: Job;
  isAdmin: boolean;
  onEdit?: (job: Job) => void;
  onClick?: () => void;
}

export default function JobCard({ job, isAdmin, onEdit, onClick }: JobCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopyingChannel, setIsCopyingChannel] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [imgError, setImgError] = useState(false);

  const categoryInfo = CATEGORIES_CONFIG.find(c => c.id === job.category);
  const IconComponent = categoryInfo ? (Icons as any)[categoryInfo.iconName] : HelpCircle;

  const getShareUrl = () => `${window.location.origin}${window.location.pathname}?jobId=${job.id}`;

  const handleCopyForChannel = async () => {
    const text = `🚀 *NUEVO OFICIO DISPONIBLE*\n\n🛠️ *${job.title.toUpperCase()}*\n📍 *Zona*: ${job.zone}\n👤 *Profesional*: ${job.professionalName}\n\n📝 *Descripción*:\n${job.description || 'Sin descripción'}\n\n👉 *Mirá el perfil completo y contactalo acá*:\n${getShareUrl()}\n\n#TucuOficios #SanMiguelDeTucuman #Oficios`;
    
    try {
      await navigator.clipboard.writeText(text);
      setIsCopyingChannel(true);
      setShowFullImage(true); // Mostrar imagen para que el admin la guarde/copie
      setTimeout(() => setIsCopyingChannel(false), 3000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TucuOficios - ${job.title}`,
          text: `Mirá el trabajo de ${job.professionalName} en TucuOficios: ${job.title}`,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsSharing(true);
        setTimeout(() => setIsSharing(false), 2000);
      } catch (err) {
        console.error('Error copying:', err);
      }
    }
  };

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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer"
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

        {/* Image Full Screen Modal */}
        {showFullImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-10"
            onClick={() => setShowFullImage(false)}
          >
            <button 
              onClick={() => setShowFullImage(false)}
              className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[210]"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Icons.Image className="w-10 h-10 opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Cargando foto...</span>
              </div>
            </div>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={job.imageUrl || ''}
              alt={job.title}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl relative z-10"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div className="mt-6 text-center max-w-lg">
              <h3 className="text-white text-xl font-black mb-2">{job.title}</h3>
              {isCopyingChannel ? (
                <div className="bg-brand-primary text-white px-6 py-3 rounded-2xl font-black text-sm animate-bounce shadow-xl">
                  📋 ¡TEXTO COPIADO! Pegalo como descripción de esta foto en tu canal.
                </div>
              ) : (
                <p className="text-gray-400 font-medium">Oficio de {job.professionalName}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full">
        {/* Image Container */}
        <div 
          className="w-full h-72 relative flex-none bg-gray-50 overflow-hidden cursor-zoom-in group/img"
          onClick={() => setShowFullImage(true)}
        >
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Icons.Image className="w-12 h-12 opacity-10" />
              <span className="text-[9px] font-black uppercase tracking-widest opacity-20">Foto no disponible</span>
            </div>
          </div>
          {job.imageUrl && (
            <img
              src={job.imageUrl}
              alt={job.title}
              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700 relative z-10"
              referrerPolicy="no-referrer"
              onLoad={(e) => (e.currentTarget.style.opacity = '1')}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-brand-dark font-black text-xs shadow-xl translate-y-4 group-hover/img:translate-y-0 transition-transform">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ver foto completa</span>
            </div>
          </div>
          
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
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
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
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
              <div className="flex gap-1.5 flex-shrink-0 ml-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyForChannel();
                  }}
                  title="Copiar para Canal"
                  className={`p-2 transition-all rounded-full ${isCopyingChannel ? 'bg-brand-primary text-white scale-110' : 'text-gray-400 hover:text-brand-primary hover:bg-orange-50'}`}
                >
                  <Megaphone className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(job);
                  }} 
                  className="p-2 text-gray-400 hover:text-brand-primary transition-colors hover:bg-gray-50 rounded-full"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirm(true);
                  }} 
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-gray-50 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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

          {job.description && (
            <div className="mb-6">
              <p className="text-gray-500 text-xs font-medium leading-relaxed line-clamp-3">
                {job.description}
              </p>
            </div>
          )}

          <div className="mb-6 flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-widest bg-gray-50/50 w-fit px-2 py-1 rounded-md">
            <span>Publicado:</span>
            <span className="text-gray-500">
              {new Date(job.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          <div className="mt-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-2.5 bg-brand-primary text-white py-3.5 px-6 rounded-xl font-black text-sm shadow-lg shadow-orange-100/50 hover:bg-orange-600 active:scale-[0.98] transition-all w-full group/btn"
            >
              <MessageCircle className="w-5 h-5 stroke-[2.5]" />
              <span className="tracking-tight">Contáctame</span>
              <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all ml-1" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
