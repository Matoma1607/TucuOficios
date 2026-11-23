import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { SITIO, consultarAlias, sugerirAlias, limpiarMientrasEscribe, normalizarAlias, type ResultadoAlias } from '../lib/alias';

interface Props {
  id: string;
  value: string;
  /** manual = lo escribió/eligió la persona (deja de sugerirse solo) */
  onChange: (alias: string, manual: boolean) => void;
  /** Para sugerir el link mientras no lo toque a mano */
  nombre: string;
  titulo: string;
  categoria: string;
  jobId?: string;
  /** true si ya tiene link (editar): no se sugiere otro */
  fijo?: boolean;
  onEstado?: (ok: boolean) => void;
}

/** Campo "Tu link": tucuoficios.net.ar/<alias>, con chequeo de disponibilidad. */
export default function AliasField({ id, value, onChange, nombre, titulo, categoria, jobId, fijo, onEstado }: Props) {
  const tocado = useRef(Boolean(fijo));
  const [res, setRes] = useState<ResultadoAlias | null>(null);
  const [revisando, setRevisando] = useState(false);
  const ultimo = useRef(0);

  // Sugerencia automática mientras no lo edite a mano
  useEffect(() => {
    if (tocado.current || !nombre.trim()) return;
    const t = setTimeout(() => {
      sugerirAlias(nombre, titulo, categoria, jobId)
        .then((s) => !tocado.current && onChange(s, false))
        .catch(() => undefined);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, titulo, categoria]);

  // Chequeo de disponibilidad
  useEffect(() => {
    const v = normalizarAlias(value);
    if (!v) {
      setRes(null);
      onEstado?.(true); // vacío: la base lo genera sola
      return;
    }
    const n = ++ultimo.current;
    setRevisando(true);
    const t = setTimeout(() => {
      consultarAlias(v, jobId)
        .then((r) => {
          if (n !== ultimo.current) return;
          setRes(r);
          onEstado?.(r.estado === 'libre');
        })
        .catch(() => {
          if (n !== ultimo.current) return;
          setRes(null);
          onEstado?.(true); // sin conexión: lo valida la base al guardar
        })
        .finally(() => n === ultimo.current && setRevisando(false));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, jobId]);

  const mensaje = (() => {
    if (revisando) return <span className="inline-flex items-center gap-1 text-gray-500"><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />Revisando…</span>;
    if (!res) return <span className="text-gray-500">Ideal para la bio de Instagram o tu estado de WhatsApp.</span>;
    if (res.estado === 'libre') return <span className="inline-flex items-center gap-1 text-emerald-700 font-medium"><Check className="w-3.5 h-3.5" aria-hidden="true" />Disponible</span>;
    const textos = {
      usado: 'Ese link ya lo usa otra publicación.',
      reservado: 'Ese link está reservado.',
      corto: 'Tiene que tener al menos 3 letras o números.',
    } as const;
    return (
      <span className="inline-flex flex-wrap items-center gap-1 text-red-600 font-medium">
        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
        {textos[res.estado]}
        {res.alternativa && (
          <button type="button" onClick={() => { tocado.current = true; onChange(res.alternativa!, true); }} className="underline text-gray-900">
            Usar {res.alternativa}
          </button>
        )}
      </span>
    );
  })();

  return (
    <div>
      <div className={`flex items-center bg-white border rounded-lg transition-colors ${
        res && res.estado !== 'libre' ? 'border-red-300 focus-within:border-red-500' : 'border-gray-300 focus-within:border-gray-900'
      }`}>
        <span className="pl-4 text-gray-500 whitespace-nowrap text-[15px]" aria-hidden="true">{SITIO}/</span>
        <input
          id={id}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
          placeholder="tu-nombre-oficio"
          value={value}
          onChange={(e) => { tocado.current = true; onChange(limpiarMientrasEscribe(e.target.value), true); }}
          onBlur={() => tocado.current && onChange(normalizarAlias(value), true)}
          aria-describedby={`${id}-estado`}
          className="w-full min-w-0 bg-transparent py-3 pr-4 outline-none font-medium text-gray-900"
        />
      </div>
      <p id={`${id}-estado`} aria-live="polite" className="mt-1.5 ml-1 text-xs">{mensaje}</p>
    </div>
  );
}
