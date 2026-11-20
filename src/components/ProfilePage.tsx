import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Link as LinkIcon, MessageCircle, Instagram } from 'lucide-react';
import { instagramUrl } from '../lib/instagram';
import type { Job } from '../types';
import { fetchJob } from '../services/jobs';
import { jobPath } from '../lib/slug';
import { whatsappLink, shareUrl } from './JobCard';
import { JobInfo } from './JobDetailModal';
import Gallery from './Gallery';
import { useToast } from './Toast';

const DEFAULT_TITLE = 'TucuOficios | Profesionales de confianza en Tucumán';

export default function ProfilePage() {
  const { id = '', slug } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchJob(id)
      .then(found => {
        if (cancelled) return;
        if (!found) return setStatus('notfound');
        setJob(found);
        setStatus('ok');
        // Corrige la URL si el nombre cambió o llegó sin slug
        const canonical = jobPath(found);
        if (`/p/${id}/${slug ?? ''}` !== canonical) navigate(canonical, { replace: true });
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (job) document.title = `${job.professionalName} · ${job.title} | TucuOficios`;
    return () => { document.title = DEFAULT_TITLE; };
  }, [job]);

  const copyLink = async () => {
    if (!job) return;
    try {
      await navigator.clipboard.writeText(shareUrl(job));
      toast('Link copiado');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permiso de portapapeles */
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-gray-900" translate="no">
            Tucu<span className="text-brand-strong">Oficios</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Ver todos
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {status === 'loading' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden md:flex animate-pulse" aria-busy="true">
            <div className="md:w-1/2 h-80 md:h-[480px] bg-gray-100" />
            <div className="md:w-1/2 p-8 space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-gray-100" />
                <div className="h-4 w-40 bg-gray-100 rounded" />
              </div>
              <div className="h-7 w-3/4 bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
            </div>
          </div>
        )}

        {(status === 'notfound' || status === 'error') && (
          <div className="py-20 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {status === 'notfound' ? 'Esta publicación no está disponible' : 'No pudimos cargar la publicación'}
            </h1>
            <p className="mt-2 text-gray-500">
              {status === 'notfound'
                ? 'Puede que se haya borrado o que todavía esté en revisión.'
                : 'Revisá tu conexión y probá de nuevo.'}
            </p>
            <Link
              to="/"
              className="mt-8 inline-block px-5 py-2.5 rounded-lg bg-brand-strong hover:bg-brand-strong-hover text-white font-semibold"
            >
              Ver todos los profesionales
            </Link>
          </div>
        )}

        {status === 'ok' && job && (
          <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden md:flex">
            <Gallery
              urls={job.photoUrls}
              alt={`Trabajo de ${job.professionalName}: ${job.title}`}
              className="md:w-1/2 h-80 md:h-auto md:min-h-[520px]"
            />
            <div className="md:w-1/2 flex flex-col">
              <div className="p-6 md:p-8 flex-1">
                <JobInfo job={job} titleId="profile-title" />
              </div>
              <div className="p-6 md:p-8 pt-4 border-t border-gray-100 flex gap-2">
                <a
                  href={whatsappLink(job)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-3 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  Contactar por WhatsApp
                </a>
                {job.instagram && (
                  <a
                    href={instagramUrl(job.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram de ${job.professionalName}`}
                    className="px-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Instagram className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Instagram</span>
                  </a>
                )}
                <button
                  onClick={copyLink}
                  className="px-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar link'}</span>
                </button>
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
