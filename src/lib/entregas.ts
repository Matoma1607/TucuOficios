import { supabase } from './supabase';
import { SITIO } from './alias';

// Entregar una publicación que creó el admin a su dueño real (link de un solo uso, 7 días)

export interface EntregaInfo {
  valida: boolean;
  id?: string;
  title?: string;
  nombre?: string;
  negocio?: string | null;
  category?: string;
  zone?: string;
  alias?: string | null;
  image_path?: string | null;
  vence?: string;
}

const msg = (e: unknown) => (e as { message?: string })?.message?.replace(/^.*?:\s*/, '') || 'No se pudo completar.';

export async function crearEntrega(jobId: string): Promise<string> {
  const { data, error } = await supabase.rpc('crear_entrega', { p_job: jobId });
  if (error) throw new Error(msg(error));
  return data as string;
}

export async function anularEntrega(jobId: string): Promise<void> {
  const { error } = await supabase.rpc('anular_entrega', { p_job: jobId });
  if (error) throw new Error(msg(error));
}

export async function verEntrega(codigo: string): Promise<EntregaInfo> {
  const { data, error } = await supabase.rpc('ver_entrega', { p_codigo: codigo });
  if (error) throw new Error(msg(error));
  return data as EntregaInfo;
}

export async function reclamarEntrega(codigo: string): Promise<void> {
  const { error } = await supabase.rpc('reclamar_entrega', { p_codigo: codigo });
  if (error) throw new Error(error.message || 'No se pudo completar.');
}

export const linkEntrega = (codigo: string) => `https://${SITIO}/entregar/${codigo}`;

/** Mensaje listo para mandarle por WhatsApp */
export function mensajeEntrega(nombre: string, codigo: string) {
  const primer = nombre.trim().split(/\s+/)[0] || nombre;
  return `¡Hola ${primer}! 👋 Desde TucuOficios te dejamos tu publicación para que la manejes vos.\n\n` +
    `Entrá a este link, iniciá sesión con tu cuenta de Google y queda a tu nombre:\n${linkEntrega(codigo)}\n\n` +
    `Después la podés editar y descargar tu QR e imagen para historias desde "Mis publicaciones". El link vence en 7 días.`;
}
