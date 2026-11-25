import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';

const CLAVE_VISTO = 'tucu_ayuda_presentada';

/**
 * Botón flotante de ayuda, siempre a mano en la esquina.
 * La primera vez muestra el texto "¿Dudas?" unos segundos
 * para que se entienda qué es; después queda solo el ícono.
 */
export default function AyudaFlotante({ hidden = false, onOpen }: { hidden?: boolean; onOpen: () => void }) {
  const [conTexto, setConTexto] = useState(false);

  useEffect(() => {
    let yaVisto = false;
    try { yaVisto = localStorage.getItem(CLAVE_VISTO) === '1'; } catch { /* sin almacenamiento */ }
    if (yaVisto) return;
    const mostrar = setTimeout(() => setConTexto(true), 2500);
    const ocultar = setTimeout(() => {
      setConTexto(false);
      try { localStorage.setItem(CLAVE_VISTO, '1'); } catch { /* sin almacenamiento */ }
    }, 11000);
    return () => { clearTimeout(mostrar); clearTimeout(ocultar); };
  }, []);

  const abrir = () => {
    setConTexto(false);
    try { localStorage.setItem(CLAVE_VISTO, '1'); } catch { /* sin almacenamiento */ }
    onOpen();
  };

  return (
    <button
      type="button"
      onClick={abrir}
      aria-label="Ayuda: preguntas frecuentes"
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      className={`fixed z-[80] right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6 h-12 rounded-full bg-brand-dark text-white border-2 border-white shadow-lg hover:bg-[#2A3870] inline-flex items-center justify-center transition-all duration-300 ${
        conTexto ? 'pl-3.5 pr-4 gap-2' : 'w-12'
      } ${hidden ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'}`}
    >
      <Bot className="w-6 h-6 flex-none" aria-hidden="true" />
      {conTexto && <span className="text-sm font-semibold whitespace-nowrap">¿Dudas?</span>}
    </button>
  );
}
