import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, AlertCircle, Link2 } from 'lucide-react';
import { SITIO, consultarAlias, sugerirAlias, limpiarMientrasEscribe, normalizarAlias, type ResultadoAlias } from '../lib/alias';

interface Props {
  id: string;
  value: string;
  /** manual = lo escribió/eligió la persona (deja de sugerirse solo) */
  onChange: (alias: string, manual: boolean) => void;
  /** Para armar el link solo mientras no lo toque a mano */
  nombre: string;
  negocio?: string;
  titulo: string;
  categoria: string;
  jobId?: string;
  /** true si ya tiene link (editar): no se sugiere otro */
  fijo?: boolean;
  onEstado?: (ok: boolean) => void;
}

/**
 * "Tu link": tucuoficios.net.ar/<alias>. Se arma solo (del nombre del negocio, o del nombre + oficio)
 * y se muestra como una línea; solo quien quiere cambiarlo toca "Cambiar" y lo edita.
 */
export default function AliasField({ id, value, onChange, nombre, negocio = '', titulo, categoria, jobId, fijo, onEstado }: Props) {
  const tocado = useRef(Boolean(fijo));
  const [editando, setEditando] = useState(false);
  const [res, setRes] = useState<ResultadoAlias | null>(null);
  const [revisando, setRevisando] = useState(false);
  const ultimo = useRef(0);

  // Link automático mientras no lo edite a mano: del negocio si hay, si no nombre + oficio
  useEffect(() => {
    if (tocado.current || (!nombre.trim() && !negocio.trim())) return;
    const t = setTimeout(async () => {
      try {
        let s: string | null = null;
        const base = normalizarAlias(negocio);
        if (base.length >= 3) {
          const r = await consultarAlias(base, jobId);
          s = r.estado === 'libre' ? base : r.alternativa;
        }
        if (!s) s = await sugerirAlias(nombre || negocio, titulo, categoria, jobId);
        if (!tocado.current && s) onChange(s, false);
      } catch {
        /* sin conexión: la base lo arma sola al guardar */
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, negocio, titulo, categoria]);

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
          if (r.estado !== 'libre') setEditando(true); // si hay que elegir otro, se muestra el campo
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

  const textos = {
    usado: 'Ese link ya lo usa otra publicación.',
    reservado: 'Ese link está reservado.',
    corto: 'Tiene que tener al menos 3 letras o números.',
  } as const;

  // Vista compacta: solo la línea con el link y "Cambiar"
  if (!editando) {
    return (
      <div id={id} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-[15px]" aria-live="polite">
        <Link2 className="w-4 h-4 flex-none text-gray-500" aria-hidden="true" />
        {value ? (
          <span className="min-w-0 break-all text-gray-600">
            {SITIO}/<span className="font-semibold text-gray-900">{value}</span>
          </span>
        ) : (
          <span className="text-gray-500">Se arma solo cuando pongas tu nombre</span>
        )}
        {revisando && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" aria-label="Revisando" />}
        {value && !revisando && res?.estado === 'libre' && <Check className="w-4 h-4 text-emerald-700" aria-label="Disponible" />}
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="ml-auto text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-brand-strong"
        >
          Cambiar
        </button>
      </div>
    );
  }

  const mensaje = (() => {
    if (revisando) return <span className="inline-flex items-center gap-1 text-gray-500"><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />Revisando…</span>;
    if (!res) return <span className="text-gray-500">Solo letras, números y guiones. Ideal para la bio de Instagram o tu estado.</span>;
    if (res.estado === 'libre') return <span className="inline-flex items-center gap-1 text-emerald-700 font-medium"><Check className="w-3.5 h-3.5" aria-hidden="true" />Disponible</span>;
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
          autoFocus={!res || res.estado === 'libre'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
          maxLength={40}
          placeholder="tu-negocio"
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
