import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BadgeCheck, Instagram, MapPin, Trash2, Pencil, Share2, Check, Megaphone, AlertCircle, MessageCircle, X, Loader2 } from 'lucide-react';
import { Job, CATEGORIES_CONFIG, sectionOf } from '../types';
import { instagramUrl } from '../lib/instagram';
import { channelText } from '../lib/channel';
import { Icons } from '../lib/icons';
import { deleteJob, setJobStatus } from '../services/jobs';
import Avatar from './Avatar';
import { useToast } from './Toast';
import { jobPath } from '../lib/slug';
import SaveButton from './SaveButton';
import { contar } from '../lib/contador';

interface JobCardProps {
  job: Job;
  isAdmin: boolean;      // muestra herramientas de admin (copiar para canal)
  canManage: boolean;    // dueño o admin: editar / borrar
  onEdit?: (job: Job) => void;
  onDeleted?: (id: string) => void;
  onStatusChanged?: (id: string, estado: Job['estado']) => void;
  onClick?: () => void;
}

export function whatsappLink(job: Job) {
  return `https://wa.me/${job.whatsapp}?text=${encodeURIComponent(
    `Hola ${job.professionalName}, vi tu publicación "${job.title}" en TucuOficios y me gustaría consultarte.`
  )}`;
}

export function shareUrl(job: Job) {
  return `${window.location.origin}${jobPath(job)}`;
}

export default function JobCard({ job, isAdmin, canManage, onEdit, onDeleted, onStatusChanged, onClick }: JobCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const toast = useToast();
  const [statusBusy, setStatusBusy] = useState<Job['estado'] | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const changeStatus = async (e: React.MouseEvent, estado: Job['estado']) => {
    e.stopPropagation();
    setStatusBusy(estado);
    setStatusError(null);
    try {
      await setJobStatus(job.id, estado);
      onStatusChanged?.(job.id, estado);
      toast(estado === 'aprobado' ? 'Publicación aprobada' : 'Publicación rechazada');
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'No se pudo actualizar.');
    } finally {
      setStatusBusy(null);
    }
  };

  const categoryInfo = CATEGORIES_CONFIG.find(c => c.id === job.category);
  const CategoryIcon = (categoryInfo && Icons[categoryInfo.iconName]) || Icons.HelpCircle;
  // En el listado se muestra el oficio (siempre prolijo); el título libre va en el perfil.
  const categoryLabel = categoryInfo?.label ?? job.category;
  const section = sectionOf(job.category);
  const hasImage = !!job.imageUrl && !imgError;
  const statusBadge = job.estado !== 'aprobado' ? (
    <span
      className={`ml-1 flex-none text-[11px] font-medium px-2 py-0.5 rounded-full ${
        job.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {job.estado === 'pendiente' ? 'En revisión' : 'Rechazada'}
    </span>
  ) : null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = shareUrl(job);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${job.title} · TucuOficios`, url });
      } catch {
        /* el usuario canceló */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copiado');
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* sin permiso de portapapeles */
    }
  };

  const handleCopyForChannel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = channelText(job, shareUrl(job));
    try {
      await navigator.clipboard.writeText(text);
      toast('Texto para el canal copiado');
      setCopiedChannel(true);
      setTimeout(() => setCopiedChannel(false), 2500);
    } catch {
      /* sin permiso de portapapeles */
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteJob(job);
      setShowConfirm(false);
      onDeleted?.(job.id);
      toast('Publicación borrada');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'No se pudo borrar.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="group relative flex flex-col bg-white/60 rounded-xl border border-white/75 shadow-[0_6px_24px_rgb(16_24_40/0.08)] p-3 sm:p-0 sm:overflow-hidden cursor-pointer transition-colors hover:bg-white/75"
    >
      {/* Confirmación de borrado */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={stop}
            className="absolute inset-0 z-20 bg-white/95 rounded-2xl flex flex-col items-center justify-center p-6 text-center"
          >
            <AlertCircle className="w-9 h-9 text-red-500 mb-3" />
            <h4 className="text-base font-semibold text-gray-900 mb-1">¿Borrar esta publicación?</h4>
            <p className="text-sm text-gray-500 mb-4">No se puede deshacer.</p>
            {deleteError && <p className="text-xs font-medium text-red-600 mb-3">{deleteError}</p>}
            <div className="flex gap-2 w-full">
              <button
                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? 'Borrando…' : 'Borrar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celular: fila compacta (varios profesionales por pantalla) */}
      <div className="flex items-center gap-3 sm:hidden">
        <div
          className="relative w-16 h-16 flex-none rounded-lg overflow-hidden flex items-center justify-center bg-gray-100"
          style={hasImage ? undefined : { backgroundColor: section.tint }}
        >
          {hasImage ? (
            <img
              src={thumbFailed ? job.imageUrl : job.thumbUrl || job.imageUrl}
              alt=""
              loading="lazy"
              width={64}
              height={64}
              onError={() => (thumbFailed ? setImgError(true) : setThumbFailed(true))}
              className="w-full h-full object-cover"
            />
          ) : (
            <CategoryIcon className="w-6 h-6" style={{ color: section.ink }} aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 font-semibold text-gray-900 min-w-0">
            <span className="truncate">{job.professionalName}</span>
            {job.verificado && <BadgeCheck className="w-4 h-4 flex-none text-sky-600" aria-label="Verificado" />}
          </p>
          <p className="text-sm text-gray-600 truncate">{categoryLabel}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 min-w-0">
            <MapPin className="w-3.5 h-3.5 flex-none" aria-hidden="true" />
            <span className="truncate">{job.zone}</span>
            {statusBadge}
          </p>
        </div>
        {job.estado === 'aprobado' && (
          <SaveButton jobId={job.id} name={job.professionalName} className="flex-none -mx-1 w-9 h-9 active:bg-gray-100" />
        )}
        <a
          href={whatsappLink(job)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { stop(e); contar('whatsapp', job.id); }}
          aria-label={`Contactar a ${job.professionalName} por WhatsApp`}
          data-tour="contacto"
          className="flex-none w-16 py-2 inline-flex flex-col items-center justify-center gap-0.5 rounded-xl bg-emerald-50 text-emerald-800 active:bg-emerald-100"
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] font-medium leading-none">WhatsApp</span>
        </a>
      </div>

      {/* Compu y tablet: tarjeta con la foto arriba */}
      <div className="hidden sm:flex flex-col flex-1">
        {/* Foto cuadrada y completa, sin recortar (muchas son flyers verticales u horizontales).
            Sin foto, el recuadro toma el tono del rubro. */}
        <div
          className="relative aspect-square overflow-hidden flex items-center justify-center border-b border-white/60 bg-white/35"
          style={hasImage ? undefined : { backgroundColor: section.tint }}
        >
          {statusBadge && <span className="absolute top-3 left-3 z-10">{statusBadge}</span>}
          {job.estado === 'aprobado' && (
            <SaveButton jobId={job.id} name={job.professionalName} className="absolute top-2.5 right-2.5 z-10 w-9 h-9 bg-white/85 hover:bg-white shadow-sm" />
          )}
          {hasImage ? (
            <img
              src={job.cardUrl || job.imageUrl}
              alt={`Trabajo de ${job.professionalName}: ${categoryLabel}`}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <CategoryIcon className="w-10 h-10" style={{ color: section.ink }} aria-label="Sin foto" />
          )}
          {job.photoUrls.length > 1 && (
            <span className="absolute bottom-2.5 right-2.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-dark/75 text-white">
              +{job.photoUrls.length - 1} {job.photoUrls.length === 2 ? 'foto' : 'fotos'}
            </span>
          )}
        </div>

        <div className="flex flex-col flex-1 p-4">
          <p className="flex items-start gap-1 font-semibold text-gray-900 leading-snug">
            <span className="line-clamp-2">{job.professionalName}</span>
            {job.verificado && <BadgeCheck className="w-4 h-4 mt-0.5 flex-none text-sky-600" aria-label="Verificado" />}
          </p>
          <h3 className="mt-1 text-sm text-gray-700">{categoryLabel}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500 min-w-0">
            <MapPin className="w-3.5 h-3.5 flex-none" aria-hidden="true" />
            <span className="truncate">{job.zone}</span>
          </p>

          <div className="mt-auto pt-4 flex items-center gap-2">
            <a
              href={whatsappLink(job)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { stop(e); contar('whatsapp', job.id); }}
              data-tour="contacto"
              aria-label={`Escribirle a ${job.professionalName} por WhatsApp`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-medium py-2.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              WhatsApp
            </a>
            {job.instagram && (
              <a
                href={instagramUrl(job.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stop}
                aria-label={`Instagram de ${job.professionalName}`}
                title={`@${job.instagram}`}
                className="w-10 h-10 flex-none inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={handleShare}
              aria-label="Compartir"
              className="w-10 h-10 flex-none inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              {shared ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Moderación rápida (admin) */}
      {isAdmin && job.estado !== 'aprobado' && (
        <div className="mt-3 sm:mt-0 sm:px-4 sm:pb-4 grid grid-cols-2 gap-2">
          <button
            onClick={(e) => changeStatus(e, 'aprobado')}
            disabled={!!statusBusy}
            className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-dark hover:bg-black text-white text-sm font-medium disabled:opacity-60"
          >
            {statusBusy === 'aprobado' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Aprobar
          </button>
          {job.estado !== 'rechazado' ? (
            <button
              onClick={(e) => changeStatus(e, 'rechazado')}
              disabled={!!statusBusy}
              className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-sm font-medium disabled:opacity-60"
            >
              {statusBusy === 'rechazado' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Rechazar
            </button>
          ) : (
            <span className="inline-flex items-center justify-center text-xs text-red-700">Rechazada</span>
          )}
          {statusError && <p className="col-span-2 text-xs text-red-600">{statusError}</p>}
        </div>
      )}

      {/* Herramientas del dueño / admin */}
      {canManage && (
        <div className="mt-3 sm:mt-0 pt-3 sm:px-3 sm:pb-3 border-t border-gray-100 flex items-center gap-1 text-xs">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(job); }}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-3.5 h-3.5" /> Borrar
          </button>
          {isAdmin && (
            <button
              onClick={handleCopyForChannel}
              title="Copiar texto para el canal de WhatsApp"
              className="ml-auto inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {copiedChannel ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Megaphone className="w-3.5 h-3.5" />}
              {copiedChannel ? 'Copiado' : 'Canal'}
            </button>
          )}
        </div>
      )}
    </motion.article>
  );
}
