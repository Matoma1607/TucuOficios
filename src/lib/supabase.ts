import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en el archivo .env');
}

// La "anon key" es pública por diseño: la seguridad real está en las
// políticas RLS de la base de datos (supabase/schema.sql).
export const supabase = createClient(url, anonKey);
