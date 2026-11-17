import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

/**
 * Recorrido guiado para quien entra por primera vez: oscurece la página y
 * resalta, paso a paso, los elementos marcados con data-tour="<id>".
 * Si un paso no tiene su elemento en pantalla (ej. todavía no cargaron los
 * avisos), espera un momento y lo saltea.
 */

interface Step {
  target: string;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    target: 'buscar',
    title: 'Buscá lo que necesitás',
    text: 'Escribí el oficio que buscás, por ejemplo “plomero” o “clases de inglés”.',
  },
  {
    target: 'categorias',
    title: 'O explorá por categoría',
    text: 'Tocá una categoría para ver solo esos profesionales. También podés filtrar por zona.',
  },
  {
    target: 'contacto',
    title: 'Escribile directo',
    text: 'Con este botón le hablás por WhatsApp. Sin intermediarios ni comisiones. Tocá el aviso para ver más fotos y detalles.',
  },
  {
    target: 'publicar',
    title: '¿Tenés un oficio? Publicalo acá',
    text: 'Es gratis: entrás con tu cuenta de Google, subís fotos de tus trabajos y te escriben por WhatsApp.',
  },
];

const PAD = 8;          // aire alrededor del elemento resaltado
const GAP = 14;         // distancia entre el resaltado y la tarjeta
const WAIT_MS = 1500;   // cuánto esperar un elemento antes de saltear el paso

interface Rect { top: number; left: number; width: number; height: number }

/** El primer elemento visible con ese data-tour (hay botones distintos en celular y compu). */
function findTarget(id: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el;
  }
  return null;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuidedTour({ isOpen, onClose }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = useState(180);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const next = useCallback(() => {
    if (isLast) onClose();
    else setIndex(i => i + 1);
  }, [isLast, onClose]);

  // Reinicia cada vez que se abre
  useEffect(() => {
    if (isOpen) setIndex(0);
  }, [isOpen]);

  // Lleva el elemento a la vista y sigue su posición (scroll, rotación, carga)
  useEffect(() => {
    if (!isOpen || !step) return;
    let raf = 0;
    let scrolled = false;
    const started = performance.now();

    const tick = () => {
      const el = findTarget(step.target);
      if (!el) {
        if (performance.now() - started > WAIT_MS) { next(); return; }
        setRect(null);
      } else {
        if (!scrolled) {
          scrolled = true;
          const fixed = getComputedStyle(el).position === 'fixed';
          if (!fixed) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        const r = el.getBoundingClientRect();
        setRect(prev =>
          prev && Math.abs(prev.top - r.top) < 0.5 && Math.abs(prev.left - r.left) < 0.5 &&
          prev.width === r.width && prev.height === r.height
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height }
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, step, next]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  }, [index, rect?.width]);

  useEffect(() => {
    if (!isOpen) return;
    nextRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, index, next, onClose]);

  if (!isOpen || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardWidth = Math.min(340, vw - 32);

  // Tarjeta debajo del elemento si entra; si no, arriba
  let cardTop = vh / 2 - cardHeight / 2;
  let cardLeft = vw / 2 - cardWidth / 2;
  if (rect) {
    const below = rect.top + rect.height + PAD + GAP;
    const above = rect.top - PAD - GAP - cardHeight;
    cardTop = below + cardHeight <= vh - 12 ? below : Math.max(12, above);
    cardLeft = Math.min(Math.max(16, rect.left + rect.width / 2 - cardWidth / 2), vw - cardWidth - 16);
  }

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Bloquea los clics en la página mientras dura el recorrido */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Resaltado: el box-shadow enorme oscurece todo menos este hueco */}
      {rect ? (
        <motion.div
          aria-hidden="true"
          className="absolute rounded-xl ring-2 ring-brand-primary pointer-events-none"
          initial={false}
          animate={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          style={{ boxShadow: '0 0 0 9999px rgba(28, 25, 23, 0.62)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(28,25,23,0.62)]" aria-hidden="true" />
      )}

      <motion.div
        ref={cardRef}
        key={index}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute bg-white rounded-2xl shadow-xl p-5"
        style={{ top: cardTop, left: cardLeft, width: cardWidth }}
      >
        <p className="text-xs font-semibold text-brand-strong" aria-live="polite">
          Paso {index + 1} de {STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-1 text-lg font-bold text-gray-900">{step.title}</h2>
        <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{step.text}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-2 -ml-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Saltar
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex(i => i - 1)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Atrás
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              className="px-4 py-2 rounded-lg bg-brand-strong hover:bg-brand-strong-hover text-white text-sm font-semibold"
            >
              {isLast ? 'Entendido' : 'Siguiente'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
