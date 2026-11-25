/**
 * Vista previa al compartir un perfil: el link corto (/<alias>) o el viejo (/p/<id>/...).
 *
 * WhatsApp, Facebook, etc. no ejecutan JavaScript: leen las etiquetas <meta>
 * del HTML. Esta función corre en Netlify antes de servir la página y cambia
 * título, descripción e imagen por los del profesional.
 */

import { slugify } from '../../src/lib/slug.ts';

/** Nombre que ve la gente para los rubros cuyo id interno es distinto (igual que en src/types.ts) */
const RUBRO_LABEL: Record<string, string> = {
  'Gasista Matriculado': 'Gasista',
  'Aires': 'Aire acondicionado',
  'Electrodomésticos': 'Reparación de electrodomésticos',
  'Control de Plagas': 'Control de plagas',
  'Fletes y Mudanzas': 'Fletes y mudanzas',
  'Techos': 'Techos e impermeabilización',
  'Durlock': 'Durlock y yesería',
  'Ferretería y Materiales': 'Ferretería y materiales',
  'Soporte Técnico': 'Soporte técnico',
  'Servicio de Celulares': 'Reparación de celulares',
  'Cámaras y Alarmas': 'Cámaras y alarmas',
  'Desarrollo Web': 'Desarrollo web',
  'Diseño y Marketing': 'Diseño y marketing',
  'Chapa y Pintura': 'Chapa y pintura',
  'Clases de Manejo': 'Clases de manejo',
  'Electricidad del Automotor': 'Electricidad del automotor',
  'Lavadero de Autos': 'Lavadero de autos',
  'Cuidado de Personas': 'Cuidado de personas',
  'Apoyo Escolar': 'Apoyo escolar',
  'Música': 'Clases de música',
  'Entrenamiento Personal': 'Entrenamiento',
  'Comidas': 'Comidas y viandas',
  'Fotografía': 'Fotografía y video',
  'DJ y Sonido': 'DJ y sonido',
  'Animación': 'Animación infantil',
  'Decoración de Eventos': 'Decoración de eventos',
  'Alquiler para Eventos': 'Alquiler de vajilla y mobiliario',
  'Peluquería Canina': 'Peluquería canina',
  'Veterinaria / Paseadores': 'Veterinaria',
  'Paseo de Perros': 'Paseo de perros',
  'Guardería de Mascotas': 'Guardería de mascotas',
  'Gestoría': 'Gestoría y trámites',
  'Ropa y Accesorios': 'Ropa y accesorios',
  'Cocina y Hogar': 'Cocina y hogar',
  'Celulares y Electrónica': 'Celulares y electrónica',
  'Belleza y Cosmética': 'Belleza y cosmética',
  'Otros Productos': 'Otros productos',
  'Costura': 'Costura y arreglos',
  'Reparación de Calzado': 'Reparación de calzado',
  'Otros': 'Otros servicios',
};
const rubro = (id: string) => RUBRO_LABEL[id] ?? id;


declare const Netlify: { env: { get(name: string): string | undefined } };

interface Context {
  next(): Promise<Response>;
}

interface JobRow {
  id: string;
  alias: string | null;
  title: string;
  category: string;
  zone: string;
  professional_name: string;
  description: string;
  image_path: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALIAS = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
// Páginas propias del sitio (no son perfiles)
const PAGINAS = new Set(['privacidad', 'estadisticas']);

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
  const url = new URL(request.url);
  const partes = url.pathname.split('/').filter(Boolean);

  // /p/<id>/... (link viejo) o /<alias> (link corto); cualquier otra cosa pasa de largo
  let filtro = '';
  if (partes[0] === 'p' && UUID.test(partes[1] ?? '')) {
    filtro = `id=eq.${partes[1]}`;
  } else if (partes.length === 1 && ALIAS.test(partes[0]) && !PAGINAS.has(partes[0])) {
    filtro = `alias=eq.${partes[0]}`;
  } else {
    return context.next();
  }

  const response = await context.next();
  const supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL');
  const key = Netlify.env.get('VITE_SUPABASE_ANON_KEY');
  if (!supabaseUrl || !key) return response;

  try {
    const api = `${supabaseUrl}/rest/v1/jobs?select=id,alias,title,category,zone,professional_name,description,image_path&${filtro}&estado=eq.aprobado`;
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

    const title = escapeHtml(`${job.professional_name} · ${rubro(job.category)} en ${job.zone} | TucuOficios`);
    const description = escapeHtml(
      job.description.length > 150 ? `${job.description.slice(0, 147)}…` : job.description
    );
    const image = imageFor(job.image_path, supabaseUrl);
    // Dirección "oficial" del perfil (la misma que el sitemap): el link corto si tiene.
    const pageUrl = escapeHtml(
      job.alias
        ? `https://tucuoficios.net.ar/${job.alias}`
        : `https://tucuoficios.net.ar/p/${job.id}/${slugify(`${job.professional_name} ${job.title}`)}`
    );

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

export const config = {
  path: ['/p/*', '/*'],
  // Archivos (js, css, imágenes, sitemap...) nunca son perfiles
  excludedPath: ['/assets/*', '/*.*'],
};
