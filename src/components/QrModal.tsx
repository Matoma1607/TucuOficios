import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import type { Job } from '../types';
import { dibujarTarjetaQR, aBlob } from '../lib/qrTarjeta';
import { SITIO } from '../lib/alias';

interface Props {
  job: Job & { alias: string };
  onClose: () => void;
}

/** QR del perfil para descargar o compartir (se carga recién cuando se abre). */
export default function QrModal({ job, onClose }: Props) {
  const [img, setImg] = useState('');
  const blob = useRef<Blob | null>(null);
  const archivo = `tucuoficios-${job.alias}.png`;
  const puedeCompartir = typeof navigator.canShare === 'function';

  useEffect(() => {
    let url = '';
    dibujarTarjetaQR({ alias: job.alias, nombre: job.professionalName, titulo: job.title })
      .then(aBlob)
      .then((b) => {
        blob.current = b;
        url = URL.createObjectURL(b);
        setImg(url);
      })
      .catch(() => undefined);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [job.alias, job.professionalName, job.title]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const compartir = async () => {
    if (!blob.current) return;
    const file = new File([blob.current], archivo, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `Mirá mis trabajos en https://${SITIO}/${job.alias}` });
      } catch {
        /* canceló */
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 id="qr-titulo" className="text-lg font-bold text-gray-900">Tu QR</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 -mr-2 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Imprimilo para el local o subilo a tus historias. Al escanearlo se abre tu perfil.</p>

        <div className="aspect-[4/5] w-full max-w-[280px] mx-auto rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
          {img ? <img src={img} alt={`QR que lleva a ${SITIO}/${job.alias}`} className="w-full h-full object-contain" /> : <Loader2 className="w-6 h-6 animate-spin text-gray-400" aria-label="Armando el QR" />}
        </div>

        <div className={`mt-5 grid gap-2 ${puedeCompartir ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <a
            href={img || undefined}
            download={archivo}
            aria-disabled={!img}
            className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-strong hover:bg-brand-strong-hover text-brand-dark font-semibold aria-disabled:opacity-60"
          >
            <Download className="w-4 h-4" /> Descargar
          </a>
          {puedeCompartir && (
            <button
              onClick={compartir}
              disabled={!img}
              className="inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              <Share2 className="w-4 h-4" /> Compartir
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
