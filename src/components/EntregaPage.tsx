import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Check, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { verEntrega, reclamarEntrega, type EntregaInfo } from '../lib/entregas';
import { publicImageUrl } from '../services/jobs';
import { CATEGORIES_CONFIG } from '../types';

/** La persona abre el link que le mandó el admin y se queda con su publicación */
export default function EntregaPage() {
  const { codigo = '' } = useParams();
  const navigate = useNavigate();
  const { user, loading, signingIn, signInWithGoogle } = useAuth();
  const [info, setInfo] = useState<EntregaInfo | null>(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    document.title = 'Tu publicación | TucuOficios';
    verEntrega(codigo).then(setInfo).catch(() => setInfo({ valida: false }));
  }, [codigo]);

  const aceptar = async () => {
    setEnviando(true);
    setError('');
    try {
      await reclamarEntrega(codigo);
      setListo(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const rubro = info?.category ? CATEGORIES_CONFIG.find((c) => c.id === info.category)?.label ?? info.category : '';
  const nombre = info?.negocio || info?.nombre || '';

  return (
    <main className="min-h-screen bg-brand-bg flex items-start sm:items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center text-2xl font-extrabold tracking-tight text-brand-dark mb-6">
          Tucu<span className="text-brand-strong">Oficios</span>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {!info ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" aria-label="Cargando" /></div>
          ) : !info.valida && !listo ? (
            <>
              <h1 className="text-xl font-bold text-gray-900">Este link ya no sirve</h1>
              <p className="mt-2 text-gray-600">Puede que ya se haya usado o que haya vencido (dura 7 días). Pedile a TucuOficios que te mande uno nuevo.</p>
              <Link to="/" className="mt-6 inline-flex w-full items-center justify-center py-3 rounded-xl border border-gray-300 font-semibold text-gray-800 hover:bg-gray-50">Ir al inicio</Link>
            </>
          ) : listo ? (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4"><Check className="w-6 h-6" /></div>
              <h1 className="text-xl font-bold text-gray-900">¡Listo, ya es tuya!</h1>
              <p className="mt-2 text-gray-600">
                La encontrás en <b>Mis publicaciones</b>. Desde ahí la podés editar y descargar tu QR y la imagen para historias.
              </p>
              <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">Tené en cuenta</p>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-700 list-disc pl-5">
                  <li>Cada publicación puede tener hasta <b>3 fotos</b>. La primera es la portada.</li>
                  <li>Podés tener hasta <b>5 publicaciones</b> por cuenta.</li>
                  <li>Si la editás, la revisamos antes de volver a mostrarla. Suele estar en el día.</li>
                </ul>
              </div>
              <button onClick={() => navigate('/?ver=mias')} className="mt-6 w-full py-3 rounded-xl bg-brand-strong hover:bg-brand-strong-hover text-brand-dark font-semibold">
                Ver mis publicaciones
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-500">TucuOficios armó esta publicación para vos</p>
              <h1 className="mt-1 text-xl font-bold text-gray-900">¿Querés quedártela?</h1>

              <div className="mt-5 flex gap-4 items-center rounded-xl border border-gray-200 p-3">
                {info.image_path ? (
                  <img src={publicImageUrl(info.image_path)} alt="" className="w-20 h-20 rounded-lg object-cover bg-gray-100 flex-none" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex-none" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{nombre}</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{info.title}</p>
                  <p className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{rubro} · {info.zone}</p>
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 text-emerald-700 flex-none" aria-hidden="true" />Queda en tu cuenta y la podés editar cuando quieras.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 text-emerald-700 flex-none" aria-hidden="true" />Sigue publicada, con su link y sus visitas.</li>
              </ul>

              {error && <p className="mt-4 text-sm font-medium text-red-600" role="alert">{error}</p>}

              {loading ? (
                <div className="mt-6 py-3 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : user ? (
                <>
                  <button onClick={aceptar} disabled={enviando} className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-strong hover:bg-brand-strong-hover text-brand-dark font-semibold disabled:opacity-60">
                    {enviando && <Loader2 className="w-4 h-4 animate-spin" />} Sí, es mía
                  </button>
                  <p className="mt-3 text-xs text-gray-500 text-center">Va a quedar en la cuenta {user.email}</p>
                </>
              ) : (
                <>
                  <button onClick={signInWithGoogle} disabled={signingIn} className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-dark text-white font-semibold hover:opacity-95 disabled:opacity-60">
                    {signingIn && <Loader2 className="w-4 h-4 animate-spin" />} Iniciar sesión con Google
                  </button>
                  <p className="mt-3 text-xs text-gray-500 text-center inline-flex w-full justify-center items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />Usá la cuenta con la que vas a manejar tu publicación.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
