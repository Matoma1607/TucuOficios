import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  // El servidor responde 200 a cualquier dirección (es una app de una sola página):
  // con "noindex" Google no guarda estas páginas vacías como si fueran contenido.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 text-center">
      <Link to="/" className="text-2xl font-extrabold tracking-tight text-gray-900 mb-10" translate="no">
        Tucu<span className="text-brand-strong">Oficios</span>
      </Link>
      <p className="text-sm font-semibold text-brand-strong">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">No encontramos esta página</h1>
      <p className="mt-3 text-gray-500 max-w-sm">
        Puede que el link esté mal escrito o que la publicación ya no exista.
      </p>
      <Link
        to="/"
        className="mt-8 px-5 py-2.5 rounded-lg bg-brand-strong hover:bg-brand-strong-hover text-white font-semibold transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
