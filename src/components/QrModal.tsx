import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { CATEGORIES_CONFIG, rubrosDe, type Job } from '../types';
import { dibujarTarjetaQR, aBlob } from '../lib/qrTarjeta';
import { dibujarHistoria } from '../lib/historia';
import { SITIO } from '../lib/alias';

interface Props {
  job: Job & { alias: string };
  /** qr: tarjeta con el QR · historia: imagen vertical con sus fotos */
  tipo?: 'qr' | 'historia';
  onClose: () => void;
}

const TEXTOS = {
  qr: {
    titulo: 'Tu QR',
    ayuda: 'Imprimilo para el local o subilo a tus historias. Al escanearlo se abre tu perfil.',
  },
  historia: {
    titulo: 'Para tus historias',
    ayuda: 'Subila a tu estado de WhatsApp o a tus historias de Instagram. En Instagram podés sumarle el sticker de link sobre la parte de abajo de la foto.',
  },
};

/** Imagen para descargar o compartir: QR o historia (se carga recién cuando se abre). */
export default function QrModal({ job, tipo = 'qr', onClose }: Props) {
  const [img, setImg] = useState('');
  const blob = useRef<Blob | null>(null);
  const archivo = tipo === 'qr' ? `tucuoficios-${job.alias}.png` : `tucuoficios-${job.alias}-historia.png`;
  const textos = TEXTOS[tipo];
  const puedeCompartir = typeof navigator.canShare === 'function';

  useEffect(() => {
    let url = '';
    const datos = {
      alias: job.alias,
      nombre: job.professionalName,
      titulo: job.title,
      categoria: job.category,
      zona: job.zone,
      verificado: job.verificado,
      fotos: job.photoUrls,
    };
    const historia = {
      ...datos,
      rubros: rubrosDe(job).map((id) => CATEGORIES_CONFIG.find((c) => c.id === id)?.label ?? id),
      descripcion: job.description,
    };
    const armar =
      tipo === 'qr'
        ? dibujarTarjetaQR(datos).then(aBlob)
        // Si alguna foto no deja usarse en la imagen, se arma sin fotos antes que fallar
        : dibujarHistoria(historia).then(aBlob).catch(() => dibujarHistoria({ ...historia, fotos: [] }).then(aBlob));
    armar
      .then((b) => {
        blob.current = b;
        url = URL.createObjectURL(b);
        setImg(url);
      })
      .catch(() => undefined);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [tipo, job.alias, job.professionalName, job.title]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <h2 id="qr-titulo" className="text-lg font-bold text-gray-900">{textos.titulo}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 -mr-2 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{textos.ayuda}</p>

        <div className={`${tipo === 'qr' ? 'aspect-[4/5] max-w-[280px]' : 'aspect-[9/16] max-w-[230px]'} w-full mx-auto rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center`}>
          {img ? <img src={img} alt={tipo === 'qr' ? `QR que lleva a ${SITIO}/${job.alias}` : `Imagen para historias de ${job.professionalName}`} className="w-full h-full object-contain" /> : <Loader2 className="w-6 h-6 animate-spin text-gray-400" aria-label="Armando la imagen" />}
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
