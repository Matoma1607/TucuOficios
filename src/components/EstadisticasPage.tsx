import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Eye, MessageCircle, Smartphone, Monitor, RefreshCw, SearchX } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { traerEstadisticas, traerBusquedasVacias, type Estadisticas, type FilaBusquedaVacia } from '../lib/contador';

const PERIODOS = [
  { dias: 7, label: '7 días' },
  { dias: 30, label: '30 días' },
  { dias: 90, label: '90 días' },
];

const fmt = (n: number) => n.toLocaleString('es-AR');

function diaCorto(iso: string) {
  const [, m, d] = iso.split('-');
  return `${Number(d)}/${Number(m)}`;
}

function diaLargo(iso: string) {
  const f = new Date(`${iso}T12:00:00`);
  return f.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Panel de estadísticas del sitio: solo para el administrador. */
export default function EstadisticasPage() {
  const { user, isAdmin, loading } = useAuth();
  const [dias, setDias] = useState(30);
  const [data, setData] = useState<Estadisticas | null>(null);
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [vacias, setVacias] = useState<FilaBusquedaVacia[] | null>(null);

  const cargar = () => {
    setCargando(true);
    setError(false);
    traerEstadisticas(dias)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setCargando(false));
    // Si esto falla (por ejemplo, antes de crear la función) el resto del panel se ve igual
    traerBusquedasVacias(dias).then(setVacias, () => setVacias(null));
  };

  useEffect(() => {
    document.title = 'Estadísticas | TucuOficios';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (isAdmin) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, dias]);

  const max = useMemo(() => Math.max(1, ...(data?.por_dia.map((d) => d.personas) ?? [1])), [data]);
  const totalDisp = (data?.celu ?? 0) + (data?.compu ?? 0);

  if (loading) return <div className="min-h-screen bg-brand-bg" />;

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-brand-bg grid place-items-center px-6 text-center">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Esta página es solo para el administrador</h1>
          <p className="mt-2 text-gray-600">Entrá con la cuenta de administrador para ver las estadísticas.</p>
          <Link to="/" className="mt-5 inline-flex h-11 items-center px-5 rounded-xl bg-brand-strong hover:bg-brand-strong-hover font-bold">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver al sitio
          </Link>
          <span className="text-lg font-extrabold text-gray-900">
            Tucu<span className="text-brand-strong">Oficios</span>
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Estadísticas</h1>
            <p className="mt-1 text-sm text-gray-600">
              Visitas reales al sitio. Tus propias visitas como administrador no se cuentan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div role="tablist" aria-label="Período" className="inline-flex rounded-xl bg-white border border-gray-200 p-1">
              {PERIODOS.map((p) => (
                <button
                  key={p.dias}
                  type="button"
                  role="tab"
                  aria-selected={dias === p.dias}
                  onClick={() => setDias(p.dias)}
                  className={`h-9 px-3.5 rounded-lg text-sm font-semibold transition-colors ${
                    dias === p.dias ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={cargar}
              aria-label="Actualizar"
              className="h-11 w-11 grid place-items-center rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 text-red-800 px-4 py-3 text-sm">
            No se pudieron cargar las estadísticas. Revisá la conexión y tocá actualizar.
          </p>
        )}

        {data && (
          <>
            {/* Números principales */}
            <section aria-label="Resumen" className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Tile icon={<Users className="w-5 h-5" />} valor={fmt(data.personas)} label="Personas" detalle={`${fmt(data.visitas)} visitas`} />
              <Tile icon={<Eye className="w-5 h-5" />} valor={fmt(data.perfiles)} label="Publicaciones abiertas" />
              <Tile
                icon={<MessageCircle className="w-5 h-5" />}
                valor={fmt(data.whatsapp)}
                label="Clics en WhatsApp"
                destacado
              />
              <div className="rounded-2xl bg-white border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-600">Desde dónde entran</p>
                {totalDisp === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">Todavía sin datos</p>
                ) : (
                  <>
                    <div className="mt-3 h-2.5 rounded-full bg-gray-100 overflow-hidden flex gap-0.5" aria-hidden="true">
                      <div className="bg-gray-900 rounded-full" style={{ width: `${(data.celu / totalDisp) * 100}%` }} />
                      <div className="bg-gray-300 rounded-full flex-1" />
                    </div>
                    <div className="mt-2.5 flex justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5 text-gray-900 font-semibold">
                        <Smartphone className="w-4 h-4" aria-hidden="true" />
                        {Math.round((data.celu / totalDisp) * 100)}% celu
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <Monitor className="w-4 h-4" aria-hidden="true" />
                        {Math.round((data.compu / totalDisp) * 100)}% compu
                      </span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Personas por día */}
            <section className="mt-4 rounded-2xl bg-white border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3">
                <h2 className="text-lg font-extrabold text-gray-900">Personas por día</h2>
                <p className="text-sm text-gray-600" aria-live="polite">
                  {hover !== null && data.por_dia[hover]
                    ? `${diaLargo(data.por_dia[hover].dia)}: ${fmt(data.por_dia[hover].personas)} personas, ${fmt(data.por_dia[hover].whatsapp)} WhatsApp`
                    : 'Tocá una barra para ver el detalle'}
                </p>
              </div>
              <div className="mt-5 relative h-48">
                {/* Líneas de referencia */}
                {[1, 0.5, 0].map((f) => (
                  <div key={f} className="absolute left-0 right-0 border-t border-gray-100" style={{ bottom: `${f * 100}%` }}>
                    <span className="absolute -top-2.5 left-0 text-[11px] text-gray-500 bg-white pr-1">{Math.round(max * f)}</span>
                  </div>
                ))}
                <div className="absolute inset-0 pl-8 flex items-end gap-[2px]">
                  {data.por_dia.map((d, i) => (
                    <button
                      key={d.dia}
                      type="button"
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      onClick={() => setHover(i)}
                      aria-label={`${diaLargo(d.dia)}: ${d.personas} personas`}
                      className="group relative flex-1 h-full flex items-end"
                    >
                      <span
                        className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-brand-strong' : 'bg-gray-900'}`}
                        style={{ height: d.personas ? `${Math.max(3, (d.personas / max) * 100)}%` : '2px', opacity: d.personas ? 1 : 0.25 }}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 pl-8 flex justify-between text-[11px] text-gray-500">
                <span>{data.por_dia[0] && diaCorto(data.por_dia[0].dia)}</span>
                <span>Hoy</span>
              </div>
            </section>

            {/* Publicaciones */}
            <section className="mt-4 rounded-2xl bg-white border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-extrabold text-gray-900">Publicaciones más buscadas</h2>
              <p className="mt-1 text-sm text-gray-600">Cuántas veces abrieron cada publicación y cuántos tocaron WhatsApp.</p>
              {data.top.length === 0 ? (
                <p className="mt-5 text-sm text-gray-500">Todavía no hay datos en este período.</p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="py-2 font-semibold">Profesional</th>
                      <th className="py-2 font-semibold text-right w-24">Vistas</th>
                      <th className="py-2 font-semibold text-right w-24">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2.5 pr-2">
                          <p className="font-semibold text-gray-900">{t.nombre}</p>
                          <p className="text-gray-500 truncate max-w-[180px] sm:max-w-none">{t.titulo}</p>
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-gray-700">{fmt(t.vistas)}</td>
                        <td className="py-2.5 text-right tabular-nums font-bold text-emerald-800">{fmt(t.whatsapp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Lo que buscaron y no encontraron */}
            {vacias && (
              <section className="mt-4 rounded-2xl bg-white border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-extrabold text-gray-900 inline-flex items-center gap-2">
                  <SearchX className="w-5 h-5 text-brand-strong" aria-hidden="true" />
                  Buscaron y no encontraron
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Búsquedas que no mostraron a nadie, en el buscador o en el chat. Te dice qué oficios conviene salir a buscar y dónde.
                </p>
                {vacias.length === 0 ? (
                  <p className="mt-5 text-sm text-gray-500">En este período todas las búsquedas encontraron algo.</p>
                ) : (
                  <table className="mt-4 w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-200">
                        <th className="py-2 font-semibold">Qué buscaron</th>
                        <th className="py-2 font-semibold">Zona</th>
                        <th className="py-2 font-semibold text-right w-24">Personas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacias.map((v, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="py-2.5 pr-2 font-semibold text-gray-900">
                            {v.que ? (v.es_texto ? `"${v.que}"` : v.que) : <span className="font-normal text-gray-500">Cualquier rubro</span>}
                          </td>
                          <td className="py-2.5 pr-2 text-gray-700">{v.zona ?? <span className="text-gray-500">Toda la provincia</span>}</td>
                          <td className="py-2.5 text-right tabular-nums font-bold text-gray-900">
                            {fmt(v.personas)}
                            {v.veces > v.personas && <span className="block text-xs font-normal text-gray-500">{fmt(v.veces)} búsquedas</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="mt-3 text-xs text-gray-500">Las palabras entre comillas no coinciden con ningún rubro: pueden ser oficios que todavía no están en la lista.</p>
              </section>
            )}

            {data.historico.desde && (
              <p className="mt-4 text-sm text-gray-500">
                Desde que se empezó a contar ({new Date(data.historico.desde).toLocaleDateString('es-AR')}):{' '}
                {fmt(data.historico.visitas)} visitas y {fmt(data.historico.whatsapp)} clics en WhatsApp.
              </p>
            )}
          </>
        )}

        {!data && !error && (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white border border-gray-200 animate-pulse" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Tile({ icon, valor, label, detalle, destacado }: { icon: React.ReactNode; valor: string; label: string; detalle?: string; destacado?: boolean }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
        <span className={destacado ? 'text-emerald-700' : 'text-gray-500'} aria-hidden="true">{icon}</span>
        {label}
      </div>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${destacado ? 'text-emerald-800' : 'text-gray-900'}`}>{valor}</p>
      {detalle && <p className="mt-0.5 text-sm text-gray-500">{detalle}</p>}
    </div>
  );
}
