import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// Para sacar la duda de "¿dónde está la trampa?": qué es gratis, por qué, y qué pasaría a futuro.

export const TEXTO_POR_QUE_GRATIS =
  'TucuOficios es un proyecto tucumano que arrancó para que la gente encuentre profesionales y emprendedores de acá. ' +
  'Hoy publicar es gratis porque queremos que el sitio crezca. No te pedimos tarjeta, no cobramos comisión y los clientes ' +
  'te escriben directo a tu WhatsApp: no estamos en el medio. Si en el futuro sumamos opciones pagas, van a ser opcionales ' +
  'y te vamos a avisar antes.';

export const TEXTO_CORTO =
  'Hoy publicar es gratis porque queremos que el sitio crezca. Los clientes te escriben directo a tu WhatsApp, sin intermediarios. ' +
  'Si a futuro sumamos opciones pagas, van a ser opcionales y avisadas antes.';

const PUNTOS = ['Sin tarjeta', 'Sin comisiones', 'Lo borrás cuando quieras'];

/** Fila de "sin letra chica" + desplegable con la explicación */
export default function PorQueGratis({ oscuro = false, corto = false, className = '' }: { oscuro?: boolean; corto?: boolean; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className={className}>
      <ul className={`flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-medium ${oscuro ? 'text-gray-200' : 'text-gray-700'}`}>
        {PUNTOS.map((p) => (
          <li key={p} className="inline-flex items-center gap-1.5">
            <Check className={`w-4 h-4 ${oscuro ? 'text-brand-strong' : 'text-emerald-600'}`} aria-hidden="true" />
            {p}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2 ${oscuro ? 'text-white' : 'text-gray-900'}`}
      >
        ¿Por qué es gratis?
        <ChevronDown className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {abierto && (
        <p className={`mt-2 text-sm leading-relaxed max-w-xl ${oscuro ? 'text-gray-300' : 'text-gray-600'}`}>{corto ? TEXTO_CORTO : TEXTO_POR_QUE_GRATIS}</p>
      )}
    </div>
  );
}
