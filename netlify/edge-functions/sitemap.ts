/**
 * sitemap.xml dinámico: la portada, la política de privacidad y el perfil de
 * cada profesional aprobado, para que Google los encuentre.
 */
import { slugify } from '../../src/lib/slug.ts';

declare const Netlify: { env: { get(name: string): string | undefined } };

const SITE = 'https://tucuoficios.net.ar';

interface Row {
  id: string;
  alias: string | null;
  professional_name: string;
  title: string;
  updated_at: string;
}

const url = (loc: string, lastmod?: string) =>
  `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`;

export default async () => {
  const supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL');
  const key = Netlify.env.get('VITE_SUPABASE_ANON_KEY');
  let rows: Row[] = [];
  if (supabaseUrl && key) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/jobs?select=id,alias,professional_name,title,updated_at&estado=eq.aprobado&order=updated_at.desc`,
        { headers: { apikey: key } }
      );
      if (res.ok) rows = await res.json();
    } catch {
      /* sin conexión a la base: sitemap solo con las páginas fijas */
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    url(`${SITE}/`),
    url(`${SITE}/privacidad`),
    url(`${SITE}/terminos`),
    ...rows.map(r =>
      url(r.alias ? `${SITE}/${r.alias}` : `${SITE}/p/${r.id}/${slugify(`${r.professional_name} ${r.title}`)}`, r.updated_at)
    ),
    '</urlset>',
  ].join('\n');

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};

export const config = { path: '/sitemap.xml' };
