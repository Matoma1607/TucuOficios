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

/** Registra un evento sin frenar nada: si falla, no pasa nada. */
export function contar(tipo: Tipo, jobId?: string) {
  if (!SITIO_REAL) return; // los admins los descarta la base de datos
  if (typeof navigator !== 'undefined' && navigator.webdriver) return; // robots de prueba
  // Dispositivos marcados para no contar (el navegador de los controles automáticos)
  try {
    if (localStorage.getItem('tucu_no_contar') === '1') return;
  } catch {
    /* sin almacenamiento: se cuenta igual */
  }
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
