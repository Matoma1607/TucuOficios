import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BadgeCheck, Instagram, MapPin, Calendar, Link as LinkIcon, Check, MessageCircle, ExternalLink } from 'lucide-react';
import { Job, CATEGORIES_CONFIG } from '../types';
import { prettyTitle, timeAgo } from '../lib/text';
import { instagramUrl } from '../lib/instagram';
import { Icons } from '../lib/icons';
import Avatar from './Avatar';
import Gallery from './Gallery';
import { useToast } from './Toast';
import SaveButton from './SaveButton';
import { contar } from '../lib/contador';
import { whatsappLink, shareUrl } from './JobCard';
import { Link } from 'react-router-dom';
import { jobPath } from '../lib/slug';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobDetailModal({ job, isOpen, onClose }: JobDetailModalProps) {
  const [copied, setCopied] = React.useState(false);
  const toast = useToast();

  // Cuenta una vista del perfil cada vez que se abre una publicación
  useEffect(() => {
    if (isOpen && job?.estado === 'aprobado') contar('perfil', job.id);
  }, [isOpen, job?.id, job?.estado]);

  // Cerrar con Esc
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!job) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(job));
      toast('Link copiado');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permiso de portapapeles */
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-detail-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-full max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
          >
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Fotos */}
            <Gallery
              urls={job.photoUrls}
              alt={`Trabajo de ${job.professionalName}: ${job.title}`}
              className="md:w-1/2 h-80 md:h-auto md:min-h-[480px] flex-none"
            />

            {/* Información */}
            <div className="md:w-1/2 flex flex-col min-h-0">
              <div className="p-6 md:p-8 overflow-y-auto flex-1">
                <JobInfo job={job} titleId="job-detail-title" />
              </div>

              <div className="p-6 md:p-8 pt-4 border-t border-gray-100 flex gap-2">
                <a
                  href={whatsappLink(job)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => contar('whatsapp', job.id)}
                  aria-label={`Contactar a ${job.professionalName} por WhatsApp`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-3 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  WhatsApp
                </a>
                {job.estado === 'aprobado' && (
                  <SaveButton jobId={job.id} name={job.professionalName} className="px-3 w-12 rounded-lg border border-gray-200 hover:bg-gray-50" />
                )}
                {job.instagram && (
                  <a
                    href={instagramUrl(job.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram de ${job.professionalName}`}
                    title={`@${job.instagram}`}
                    className="px-3 inline-flex items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                <Link
                  to={jobPath(job)}
                  aria-label="Abrir página del profesional"
                  title="Abrir página"
                  className="px-3 inline-flex items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleCopyLink}
                  aria-label="Copiar link"
                  className="px-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar link'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Datos del profesional y del servicio (se usa en el modal y en la página). */
export function JobInfo({ job, titleId }: { job: Job; titleId?: string }) {
  const categoryInfo = CATEGORIES_CONFIG.find(c => c.id === job.category);
  const CategoryIcon = (categoryInfo && Icons[categoryInfo.iconName]) || Icons.HelpCircle;

  return (
    <>
      <div className="flex items-center gap-4 pr-8">
        <Avatar name={job.professionalName} size="lg" />
        <div className="min-w-0">
          <p className="text-lg font-semibold text-gray-900">{job.professionalName}</p>
          <p className="inline-flex items-center gap-1.5 text-sm text-gray-600">
            <CategoryIcon className="w-4 h-4" aria-hidden="true" /> {categoryInfo?.label ?? job.category}
          </p>
          {job.extraCategories?.length > 0 && (
            <p className="mt-0.5 text-sm text-gray-500">
              También: {job.extraCategories.map(r => CATEGORIES_CONFIG.find(c => c.id === r)?.label ?? r).join(' · ')}
            </p>
          )}
        </div>
      </div>

      <h2 id={titleId} className="mt-6 text-2xl font-bold text-gray-900 leading-tight">
        {prettyTitle(job.title)}
      </h2>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700">
          <MapPin className="w-4 h-4" aria-hidden="true" /> {job.zone}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700">
          <Calendar className="w-4 h-4" aria-hidden="true" />
          Publicado {timeAgo(job.createdAt)}
        </span>
        {job.instagram && (
          <a
            href={instagramUrl(job.instagram)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          >
            <Instagram className="w-4 h-4" aria-hidden="true" /> @{job.instagram}
          </a>
        )}
        {job.verificado && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800"
            title="TucuOficios comprobó que el número y el trabajo son reales"
          >
            <BadgeCheck className="w-4 h-4" aria-hidden="true" /> Verificado
          </span>
        )}
        {job.estado !== 'aprobado' && (
          <span
            className={`px-3 py-1 rounded-full font-medium ${
              job.estado === 'pendiente' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {job.estado === 'pendiente' ? 'En revisión' : 'Rechazada'}
          </span>
        )}
      </div>

      <h3 className="mt-8 text-sm font-semibold text-gray-900">Sobre el servicio</h3>
      <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-wrap">
        {job.description || 'El profesional no agregó una descripción.'}
      </p>
    </>
  );
}
