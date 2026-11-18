import { supabase } from '../lib/supabase';
import type { Job } from '../types';
import { compressImage } from '../lib/image';

const BUCKET = 'job-images';
export const MAX_PHOTOS = 4; // portada + 3 de galería

interface JobRow {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  zone: string;
  professional_name: string;
  whatsapp: string;
  instagram: string | null;
  description: string;
  image_path: string | null;
  gallery: string[] | null;
  estado: Job['estado'];
  verificado: boolean | null;
  created_at: string;
}

export interface JobInput {
  title: string;
  category: string;
  zone: string;
  professionalName: string;
  whatsapp: string;
  instagram?: string | null; // usuario sin @, '' o null = sin Instagram
  description: string;
}

// Las publicaciones migradas del sistema viejo guardan la URL completa de Cloudinary.
const isExternal = (path: string) => /^https?:\/\//.test(path);

/** Cloudinary achica y convierte la imagen por URL (los originales de los avisos migrados pesan varios MB). */
const cloudinary = (url: string, transform: string) =>
  url.includes('res.cloudinary.com') && url.includes('/upload/') ? url.replace('/upload/', `/upload/${transform}/`) : url;

/** Foto para verla grande (detalle, galería): hasta 1600px de ancho. */
export const publicImageUrl = (path: string | null) => {
  if (!path) return '';
  return isExternal(path)
    ? cloudinary(path, 'c_limit,w_1600,f_auto,q_auto')
    : supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

/** Foto para la tarjeta del listado en compu: hasta 640px (las de Supabase ya se suben comprimidas). */
export const cardImageUrl = (path: string | null) => {
  if (!path) return '';
  return isExternal(path) ? cloudinary(path, 'c_limit,w_640,f_auto,q_auto') : publicImageUrl(path);
};

/**
 * Miniatura para el listado (la foto completa pesa hasta ~400 KB).
 * - Cloudinary (avisos migrados): se pide recortada por URL.
 * - Supabase: al subir guardamos "<foto>_thumb.webp" al lado de la original.
 */
export const thumbPathFor = (path: string) => path.replace(/\.webp$/, '_thumb.webp');

export const thumbImageUrl = (path: string | null) => {
  if (!path) return '';
  if (isExternal(path)) {
    return cloudinary(path, 'c_fill,w_240,h_240,f_auto,q_auto');
  }
  return publicImageUrl(thumbPathFor(path));
};

const toJob = (r: JobRow): Job => {
  const paths = [r.image_path, ...(r.gallery ?? [])].filter((p): p is string => Boolean(p));
  return {
    id: r.id,
    ownerId: r.owner_id,
    title: r.title,
    category: r.category,
    zone: r.zone,
    professionalName: r.professional_name,
    whatsapp: r.whatsapp,
    instagram: r.instagram ?? null,
    description: r.description,
    imagePath: r.image_path,
    imageUrl: publicImageUrl(r.image_path),
    thumbUrl: thumbImageUrl(r.image_path),
    cardUrl: cardImageUrl(r.image_path),
    photoPaths: paths,
    photoUrls: paths.map(publicImageUrl),
    estado: r.estado,
    verificado: r.verificado === true,
    createdAt: r.created_at,
  };
};

const toRow = (input: JobInput) => ({
  title: input.title.trim(),
  category: input.category,
  zone: input.zone.trim(),
  professional_name: input.professionalName.trim(),
  whatsapp: input.whatsapp,
  instagram: input.instagram ? input.instagram : null,
  description: input.description.trim(),
});

/** Traduce los errores de Postgres a mensajes entendibles. */
function friendlyError(error: { message: string; code?: string }): Error {
  if (error.message.includes('límite') || error.message.includes('Esperá')) {
    return new Error(error.message);
  }
  if (error.code === '23514') return new Error('Algún dato no es válido. Revisá el formulario.');
  if (error.code === '42501') return new Error('No tenés permiso para hacer esto.');
  return new Error('Hubo un problema de conexión. Probá de nuevo.');
}

export { normalizeWhatsapp, formatWhatsappForInput } from '../lib/whatsapp';

export async function fetchJobs(): Promise<Job[]> {
  // RLS ya filtra: aprobadas para todos + las propias + todo si sos admin.
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw friendlyError(error);
  return (data as JobRow[]).map(toJob);
}

/** Una sola publicación (para la página del profesional). null si no existe o no es visible. */
export async function fetchJob(id: string): Promise<Job | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw friendlyError(error);
  return data ? toJob(data as JobRow) : null;
}

/** Comprime la foto, sube la versión grande y una miniatura. Devuelve la ruta de la grande. */
export async function uploadJobImage(userId: string, file: File): Promise<string> {
  const [full, thumb] = await Promise.all([compressImage(file), compressImage(file, 320, 0.75)]);
  const path = `${userId}/${crypto.randomUUID()}.webp`;
  const opts = { contentType: 'image/webp', upsert: false };

  const { error } = await supabase.storage.from(BUCKET).upload(path, full, opts);
  if (error) throw new Error('No se pudo subir una de las fotos. Probá con otra.');

  // Si falla la miniatura no pasa nada: el listado usa la foto grande.
  await supabase.storage.from(BUCKET).upload(thumbPathFor(path), thumb, opts);
  return path;
}

/** Borra fotos del storage (ignora las externas de Cloudinary). */
export async function removeImages(paths: string[]): Promise<void> {
  const own = paths.filter(p => p && !isExternal(p));
  if (own.length) await supabase.storage.from(BUCKET).remove([...own, ...own.map(thumbPathFor)]);
}

/** photoPaths: la primera es la portada, el resto la galería. */
export async function createJob(input: JobInput, photoPaths: string[]): Promise<Job> {
  const [cover, ...gallery] = photoPaths;
  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...toRow(input), image_path: cover, gallery })
    .select()
    .single();

  if (error) {
    // Si falla el alta, borramos las fotos para no dejar basura
    await removeImages(photoPaths);
    throw friendlyError(error);
  }
  return toJob(data as JobRow);
}

export async function updateJob(
  id: string,
  input: JobInput,
  photoPaths: string[],
  admin?: { estado: Job['estado']; verificado: boolean } // solo lo respeta la base si sos admin
): Promise<void> {
  const [cover, ...gallery] = photoPaths;
  const { error } = await supabase
    .from('jobs')
    .update({ ...toRow(input), image_path: cover ?? null, gallery, ...(admin ?? {}) })
    .eq('id', id);

  if (error) throw friendlyError(error);
}

/** Aprobar / rechazar (la base solo lo permite si sos admin). */
export async function setJobStatus(id: string, estado: Job['estado']): Promise<void> {
  const { data, error } = await supabase.from('jobs').update({ estado }).eq('id', id).select('estado').single();
  if (error) throw friendlyError(error);
  if (data?.estado !== estado) throw new Error('No tenés permiso para cambiar el estado.');
}

export async function deleteJob(job: Job): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', job.id);
  if (error) throw friendlyError(error);
  await removeImages(job.photoPaths);
}
