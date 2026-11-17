import { supabase } from '../lib/supabase';
import type { Job } from '../types';

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
  description: string;
  image_path: string | null;
  gallery: string[] | null;
  estado: Job['estado'];
  created_at: string;
}

export interface JobInput {
  title: string;
  category: string;
  zone: string;
  professionalName: string;
  whatsapp: string;
  description: string;
}

// Las publicaciones migradas del sistema viejo guardan la URL completa de Cloudinary.
const isExternal = (path: string) => /^https?:\/\//.test(path);

export const publicImageUrl = (path: string | null) => {
  if (!path) return '';
  return isExternal(path) ? path : supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
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
    description: r.description,
    imagePath: r.image_path,
    imageUrl: publicImageUrl(r.image_path),
    photoPaths: paths,
    photoUrls: paths.map(publicImageUrl),
    estado: r.estado,
    createdAt: r.created_at,
  };
};

const toRow = (input: JobInput) => ({
  title: input.title.trim(),
  category: input.category,
  zone: input.zone.trim(),
  professional_name: input.professionalName.trim(),
  whatsapp: input.whatsapp,
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

/**
 * Convierte cualquier formato argentino al que usa WhatsApp: 549 + área + número.
 * Acepta: "381 412-3456", "0381 15 412 3456", "+54 9 381 4123456", etc.
 * Devuelve null si no es un número válido.
 */
export function normalizeWhatsapp(raw: string): string | null {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('9') && d.length === 11) d = d.slice(1);
  if (d.startsWith('0')) d = d.slice(1);

  // Quita el "15" que va después del código de área (2, 3 o 4 dígitos)
  if (d.length === 12) {
    for (const areaLen of [3, 2, 4]) {
      if (d.slice(areaLen, areaLen + 2) === '15') {
        d = d.slice(0, areaLen) + d.slice(areaLen + 2);
        break;
      }
    }
  }

  return d.length === 10 ? `549${d}` : null;
}

/** Muestra 5493814123456 como "381 412-3456" para editar. */
export function formatWhatsappForInput(stored: string): string {
  const d = stored.startsWith('549') ? stored.slice(3) : stored;
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}` : d;
}

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

export async function uploadJobImage(userId: string, image: Blob): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, image, { contentType: 'image/webp', upsert: false });

  if (error) throw new Error('No se pudo subir una de las fotos. Probá con otra.');
  return path;
}

/** Borra fotos del storage (ignora las externas de Cloudinary). */
export async function removeImages(paths: string[]): Promise<void> {
  const own = paths.filter(p => p && !isExternal(p));
  if (own.length) await supabase.storage.from(BUCKET).remove(own);
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
  estado?: Job['estado'] // solo lo respeta la base si sos admin
): Promise<void> {
  const [cover, ...gallery] = photoPaths;
  const { error } = await supabase
    .from('jobs')
    .update({ ...toRow(input), image_path: cover ?? null, gallery, ...(estado ? { estado } : {}) })
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
