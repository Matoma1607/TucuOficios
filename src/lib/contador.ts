import { supabase } from './supabase';

// Contador de visitas propio: guarda en Supabase visitas, perfiles vistos y
// clics en WhatsApp. Sin cookies: usa un número al azar guardado en el
// dispositivo, que no identifica a la persona.

type Tipo = 'visita' | 'perfil' | 'whatsapp';

const KEY = 'tucu_visitante';
// Solo se cuenta en el sitio real (ni en la web de prueba ni en la compu de desarrollo)
const SITIO_REAL = typeof location !== 'undefined' && location.hostname === 'tucuoficios.net.ar';

function visitante(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      const b = new Uint8Array(12);
      crypto.getRandomValues(b);
      id = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'sin-almacenamiento';
  }
}

function dispositivo(): 'celu' | 'compu' | 'otro' {
  if (typeof window === 'undefined') return 'otro';
  if (window.matchMedia?.('(pointer: coarse)').matches && window.innerWidth < 900) return 'celu';
  if (window.innerWidth >= 900) return 'compu';
  return 'otro';
}

const enCola = (fn: () => void) => {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  if (ric) ric(fn);
  else setTimeout(fn, 300);
};

/** ¿Se cuenta desde este dispositivo? (sitio real, sin robots de prueba ni dispositivos marcados) */
function seCuenta(): boolean {
  if (!SITIO_REAL) return false; // los admins los descarta la base de datos
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false; // robots de prueba
  // Dispositivos marcados para no contar (el navegador de los controles automáticos)
  try {
    if (localStorage.getItem('tucu_no_contar') === '1') return false;
  } catch {
    /* sin almacenamiento: se cuenta igual */
  }
  return true;
}

/** Registra un evento sin frenar nada: si falla, no pasa nada. */
export function contar(tipo: Tipo, jobId?: string) {
  if (!seCuenta()) return;
  const p_visitante = visitante();
  const p_dispositivo = dispositivo();
  enCola(() => {
    supabase
      .rpc('registrar_evento', { p_tipo: tipo, p_job: jobId ?? null, p_visitante, p_dispositivo })
      .then(() => undefined, () => undefined);
  });
}

export interface Estadisticas {
  dias: number;
  personas: number;
  visitas: number;
  perfiles: number;
  whatsapp: number;
  celu: number;
  compu: number;
  por_dia: { dia: string; personas: number; perfiles: number; whatsapp: number }[];
  top: { id: string; nombre: string; titulo: string; vistas: number; whatsapp: number }[];
  historico: { visitas: number; whatsapp: number; desde: string | null };
}

export async function traerEstadisticas(dias: number): Promise<Estadisticas> {
  const { data, error } = await supabase.rpc('estadisticas', { p_dias: dias });
  if (error) throw error;
  return data as Estadisticas;
}

// ---------------------------------------------------------------------
// Búsquedas sin resultado: solo el rubro (o la palabra, sin números) y la zona
// ---------------------------------------------------------------------
export interface BusquedaVacia {
  rubro?: string | null;
  texto?: string | null;
  zona?: string | null;
  origen: 'buscador' | 'chat';
}

const yaAnotadas = new Set<string>();

/** Limpia la palabra buscada: minúsculas, sin números ni signos (así no se guarda un teléfono) */
export function limpiarTexto(t: string): string | null {
  const limpio = t
    .toLowerCase()
    .replace(/[^a-zñáéíóúü ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
    .trim();
  return limpio.length >= 3 ? limpio : null;
}

export function contarBusquedaVacia(b: BusquedaVacia) {
  const rubro = b.rubro || null;
  const texto = rubro ? null : b.texto ? limpiarTexto(b.texto) : null;
  const zona = b.zona || null;
  if (!rubro && !texto && !zona) return;
  const clave = `${rubro}|${texto}|${zona}`;
  if (yaAnotadas.has(clave)) return;
  yaAnotadas.add(clave);
  if (!seCuenta()) return;
  const p_visitante = visitante();
  enCola(() => {
    supabase
      .rpc('registrar_busqueda_vacia', { p_rubro: rubro, p_texto: texto, p_zona: zona, p_origen: b.origen, p_visitante })
      .then(() => undefined, () => undefined);
  });
}

export interface FilaBusquedaVacia {
  que: string | null;
  es_texto: boolean;
  zona: string | null;
  veces: number;
  personas: number;
  ultima: string;
}

export async function traerBusquedasVacias(dias: number): Promise<FilaBusquedaVacia[]> {
  const { data, error } = await supabase.rpc('busquedas_sin_resultado', { p_dias: dias });
  if (error) throw error;
  return (data ?? []) as FilaBusquedaVacia[];
}
