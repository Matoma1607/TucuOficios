import { supabase } from './supabase';

// Link corto de cada publicación: tucuoficios.net.ar/<alias>
// Las mismas reglas que valida la base (supabase/migrations/*_link_corto.sql).

export const SITIO = 'tucuoficios.net.ar';
export const ALIAS_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

/** "Juan Pérez!" -> "juan-perez" (mismo formato que guarda la base) */
export function normalizarAlias(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

/** Mientras escribe: deja un guion al final para poder seguir tipeando */
export function limpiarMientrasEscribe(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .slice(0, 40);
}

export type EstadoAlias = 'libre' | 'usado' | 'reservado' | 'corto';

export interface ResultadoAlias {
  alias: string;
  estado: EstadoAlias;
  alternativa: string | null;
}

/** ¿Está libre? (sin contar la propia publicación cuando se edita) */
export async function consultarAlias(alias: string, jobId?: string): Promise<ResultadoAlias> {
  const { data, error } = await supabase.rpc('alias_disponible', { p_alias: alias, p_job: jobId ?? null });
  if (error) throw error;
  return data as ResultadoAlias;
}

/** Sugerencia de la base: primer nombre + oficio, ya libre */
export async function sugerirAlias(nombre: string, titulo: string, categoria: string, jobId?: string): Promise<string> {
  const { data, error } = await supabase.rpc('alias_sugerido', {
    p_nombre: nombre,
    p_titulo: titulo,
    p_categoria: categoria,
    p_excluir: jobId ?? null,
  });
  if (error) throw error;
  return data as string;
}
