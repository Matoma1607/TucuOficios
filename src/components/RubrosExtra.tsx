import { X } from 'lucide-react';
import { CATEGORIES_CONFIG, MAX_RUBROS_EXTRA } from '../types';

interface Props {
  id: string;
  principal: string;
  value: string[];
  onChange: (rubros: string[]) => void;
}

const etiqueta = (id: string) => CATEGORIES_CONFIG.find((c) => c.id === id)?.label ?? id;

/** "¿Hacés algo más?": hasta 3 rubros además del principal, en la misma publicación */
export default function RubrosExtra({ id, principal, value, onChange }: Props) {
  const elegidos = value.filter((r) => r !== principal);
  const secciones = [...new Set(CATEGORIES_CONFIG.map((c) => c.section))];
  const lleno = elegidos.length >= MAX_RUBROS_EXTRA;

  return (
    <div>
      {elegidos.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2">
          {elegidos.map((r) => (
            <li key={r} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-800">
              {etiqueta(r)}
              <button
                type="button"
                onClick={() => onChange(elegidos.filter((x) => x !== r))}
                aria-label={`Quitar ${etiqueta(r)}`}
                className="w-6 h-6 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <select
        id={id}
        value=""
        disabled={lleno || !principal}
        onChange={(e) => e.target.value && onChange([...elegidos, e.target.value])}
        className="w-full bg-white border border-gray-300 focus:border-gray-900 rounded-lg py-3 px-3 outline-none transition-colors text-gray-500 disabled:bg-gray-50"
      >
        <option value="">
          {!principal ? 'Primero elegí la categoría' : lleno ? `Máximo ${MAX_RUBROS_EXTRA} rubros más` : '+ Sumar otro rubro'}
        </option>
        {secciones.map((s) => (
          <optgroup key={s} label={s}>
            {CATEGORIES_CONFIG.filter((c) => c.section === s && c.id !== principal && !elegidos.includes(c.id)).map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="mt-1.5 ml-1 text-xs text-gray-500">Si hacés varias cosas, sumalas acá en vez de publicar de nuevo: te encuentran en todos esos rubros.</p>
    </div>
  );
}
