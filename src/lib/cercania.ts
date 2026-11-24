// "Cerca tuyo": ordena las publicaciones por la distancia entre la zona de cada una
// y la ubicación de la persona. La ubicación se usa solo en el navegador, no se guarda ni se envía.

/** Centro aproximado de cada zona (lat, lng) */
export const COORDS_ZONAS: Record<string, [number, number]> = {
  'San Miguel de Tucumán': [-26.8083, -65.2176],
  'Yerba Buena': [-26.8160, -65.3000],
  'Tafí Viejo': [-26.7320, -65.2590],
  'Banda del Río Salí': [-26.8370, -65.1650],
  'Alderetes': [-26.8160, -65.1370],
  'Las Talitas': [-26.7680, -65.2040],
  'El Manantial': [-26.8490, -65.2830],
  'San Pablo': [-26.8740, -65.3070],
  'Lules': [-26.9260, -65.3370],
  'Famaillá': [-27.0540, -65.4030],
  'Monteros': [-27.1670, -65.4980],
  'Concepción': [-27.3430, -65.5900],
  'Aguilares': [-27.4310, -65.6140],
  'Simoca': [-27.2630, -65.3560],
  'Bella Vista': [-27.0340, -65.3070],
  'Tafí del Valle': [-26.8520, -65.7100],
  'Trancas': [-26.2310, -65.2800],
  'Burruyacú': [-26.5000, -64.7420],
};

/** Quien trabaja en "Todo Tucumán" cuenta como cercano (a ~5 km) */
const DIST_TODO_TUCUMAN = 5;
/** Más lejos que esto del centro de la provincia: no está en Tucumán */
const MAX_KM_PROVINCIA = 150;

export function distanciaKm(a: [number, number], b: [number, number]): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export interface Ubicacion {
  punto: [number, number];
  zona: string; // zona más cercana, para mostrar
}

export function zonaMasCercana(punto: [number, number]): { zona: string; km: number } {
  let mejor = { zona: 'San Miguel de Tucumán', km: Infinity };
  for (const [zona, c] of Object.entries(COORDS_ZONAS)) {
    const km = distanciaKm(punto, c);
    if (km < mejor.km) mejor = { zona, km };
  }
  return mejor;
}

/** Distancia de una publicación a la persona (según la zona de la publicación) */
export function distanciaAZona(zona: string, punto: [number, number]): number {
  if (zona === 'Todo Tucumán') return DIST_TODO_TUCUMAN;
  const c = COORDS_ZONAS[zona];
  return c ? distanciaKm(punto, c) : 999;
}

/** Ordena de más cerca a más lejos; a igual distancia respeta el orden que ya tenían */
export function ordenarPorCercania<T extends { zone: string }>(lista: T[], punto: [number, number]): T[] {
  return lista
    .map((item, i) => ({ item, i, d: distanciaAZona(item.zone, punto) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((x) => x.item);
}

/** Pide la ubicación al navegador */
export function pedirUbicacion(): Promise<Ubicacion> {
  return new Promise((ok, mal) => {
    if (!('geolocation' in navigator)) return mal(new Error('sin-geo'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const punto: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const { zona } = zonaMasCercana(punto);
        if (distanciaKm(punto, COORDS_ZONAS['San Miguel de Tucumán']) > MAX_KM_PROVINCIA) return mal(new Error('fuera'));
        ok({ punto, zona });
      },
      (err) => mal(new Error(err.code === err.PERMISSION_DENIED ? 'denegado' : 'error')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  });
}
