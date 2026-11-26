import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Copy, Check, MessageCircle } from 'lucide-react';
import type { Job } from '../types';
import { nombreVisible } from '../types';
import { crearEntrega, anularEntrega, linkEntrega, mensajeEntrega } from '../lib/entregas';

interface Props {
  job: Job;
  onClose: () => void;
}

/** Admin: arma el link para que la persona se quede con la publicación que le creaste */
export default function EntregarModal({ job, onClose }: Props) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [anulado, setAnulado] = useState(false);

  useEffect(() => {
    crearEntrega(job.id).then(setCodigo).catch((e) => setError(e.message));
  }, [job.id]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const texto = codigo ? mensajeEntrega(job.professionalName, codigo) : '';
  const wa = codigo ? `https://wa.me/${job.whatsapp}?text=${encodeURIComponent(texto)}` : undefined;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkEntrega(codigo));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sin portapapeles: el link igual queda a la vista */
    }
  };

  const anular = async () => {
    try {
      await anularEntrega(job.id);
      setAnulado(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entregar-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 id="entregar-titulo" className="text-lg font-bold text-gray-900">Entregar a su dueño</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 -mr-2 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Mandale este link a <b className="text-gray-900">{nombreVisible(job)}</b>. Inicia sesión con su Google y la publicación pasa a su cuenta,
          sin perder la aprobación, el link ni las visitas.
        </p>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 min-h-[64px] flex items-center" aria-live="polite">
          {error ? (
            <p className="text-sm font-medium text-red-600">{error}</p>
          ) : anulado ? (
            <p className="text-sm font-medium text-gray-700">Link anulado. Ya no sirve.</p>
          ) : codigo ? (
            <p className="text-[15px] break-all text-gray-700">{linkEntrega(codigo).replace('https://', '')}</p>
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-label="Armando el link" />
          )}
        </div>
        {codigo && !anulado && !error && (
          <p className="mt-2 text-xs text-gray-500">Sirve una sola vez y vence en 7 días. Si armás otro, este deja de funcionar.</p>
        )}

        <div className="mt-5 grid gap-2">
          <a
            href={!anulado ? wa : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!codigo || anulado || !!error}
            className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:brightness-95 text-white font-semibold aria-disabled:opacity-50 aria-disabled:pointer-events-none"
          >
            <MessageCircle className="w-4 h-4" /> Enviar por WhatsApp
          </a>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copiar}
              disabled={!codigo || anulado || !!error}
              className="inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />} {copiado ? 'Copiado' : 'Copiar link'}
            </button>
            <button
              onClick={anular}
              disabled={!codigo || anulado || !!error}
              className="inline-flex items-center justify-center py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Anular link
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
