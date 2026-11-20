/**
 * Vista previa al compartir un perfil (/p/<id>/...).
 *
 * WhatsApp, Facebook, etc. no ejecutan JavaScript: leen las etiquetas <meta>
 * del HTML. Esta función corre en Netlify antes de servir la página y cambia
 * título, descripción e imagen por los del profesional.
 */

import { slugify } from '../../src/lib/slug.ts';

declare const Netlify: { env: { get(name: string): string | undefined } };

interface Context {
  next(): Promise<Response>;
}

interface JobRow {
  title: string;
  category: string;
  zone: string;
  professional_name: string;
  description: string;
  image_path: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function imageFor(path: string | null, supabaseUrl: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) {
    // Cloudinary: recorte 1200x630 en JPG, el formato que mejor aceptan todas las redes
    return path.includes('res.cloudinary.com') && path.includes('/upload/')
      ? path.replace('/upload/', '/upload/c_pad,b_auto,w_1200,h_630,f_jpg,q_auto/')
      : path;
  }
  return `${supabaseUrl}/storage/v1/object/public/job-images/${path}`;
}

function setMeta(html: string, attr: 'property' | 'name', key: string, value: string): string {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  return re.test(html)
    ? html.replace(re, `$1${value}$2`)
    : html.replace('</head>', `    <meta ${attr}="${key}" content="${value}" />\n  </head>`);
}

export default async (request: Request, context: Context) => {
  const response = await context.next();
  const url = new URL(request.url);
  const id = url.pathname.split('/')[2] ?? '';

  const supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL');
  const key = Netlify.env.get('VITE_SUPABASE_ANON_KEY');
  if (!UUID.test(id) || !supabaseUrl || !key) return response;

  try {
    const api = `${supabaseUrl}/rest/v1/jobs?select=title,category,zone,professional_name,description,image_path&id=eq.${id}&estado=eq.aprobado`;
    const res = await fetch(api, { headers: { apikey: key } });
    if (!res.ok) return response;
    const [job] = (await res.json()) as JobRow[];
    if (!job) {
      // Aviso borrado, rechazado o id inexistente: 404 real y "noindex" para que Google lo saque.
      let html = await response.text();
      html = setMeta(html, 'name', 'robots', 'noindex');
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      return new Response(html, { status: 404, headers });
    }

    const title = escapeHtml(`${job.professional_name} · ${job.category} en ${job.zone} | TucuOficios`);
    const description = escapeHtml(
      job.description.length > 150 ? `${job.description.slice(0, 147)}…` : job.description
    );
    const image = imageFor(job.image_path, supabaseUrl);
    // Dirección "oficial" del perfil (la misma que el sitemap), aunque entren con otro texto al final.
    const pageUrl = escapeHtml(`https://tucuoficios.net.ar/p/${id}/${slugify(`${job.professional_name} ${job.title}`)}`);

    let html = await response.text();
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
    html = setMeta(html, 'name', 'description', description);
    html = setMeta(html, 'property', 'og:type', 'profile');
    html = setMeta(html, 'property', 'og:url', pageUrl);
    html = html.replace('</head>', `    <link rel="canonical" href="${pageUrl}" />\n  </head>`);
    html = setMeta(html, 'property', 'og:title', title);
    html = setMeta(html, 'property', 'og:description', description);
    if (image) html = setMeta(html, 'property', 'og:image', escapeHtml(image));

    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control', 'public, max-age=0, must-revalidate');
    return new Response(html, { status: response.status, headers });
  } catch {
    return response;
  }
};

export const config = { path: '/p/*' };
