import { useCallback, useSyncExternalStore } from 'react';

// Profesionales guardados: se guardan en el mismo celular/compu, sin cuenta.
const KEY = 'tucu_guardados';
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    cache = Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* modo privado: queda solo por esta visita */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, read, () => []);
  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
    write(next);
    return next.includes(id);
  }, []);
  return { ids, isSaved, toggle };
}
