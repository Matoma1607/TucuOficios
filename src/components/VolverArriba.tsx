import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** Botón flotante para volver arriba: aparece recién cuando bajaste bastante. */
export default function VolverArriba({ hidden = false }: { hidden?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const revisar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVisible(window.scrollY > window.innerHeight * 1.5));
    };
    revisar();
    window.addEventListener('scroll', revisar, { passive: true });
    return () => {
      window.removeEventListener('scroll', revisar);
      cancelAnimationFrame(raf);
    };
  }, []);

  const mostrar = visible && !hidden;
  const subir = () => {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
  };

  return (
    <button
      type="button"
      onClick={subir}
      aria-label="Volver arriba"
      tabIndex={mostrar ? 0 : -1}
      aria-hidden={!mostrar}
      className={`fixed z-[80] right-[18px] bottom-[calc(144px+env(safe-area-inset-bottom))] sm:right-[26px] sm:bottom-[88px] w-11 h-11 rounded-full bg-[#E3E7F3] border border-[#C9D0E6] shadow-md text-brand-dark hover:bg-[#D6DCEE] inline-flex items-center justify-center transition-all duration-200 ${
        mostrar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
