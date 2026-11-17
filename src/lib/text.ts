/**
 * Muchos títulos llegan en MAYÚSCULAS ("TRABAJOS EN GENERAL").
 * Si el texto está casi todo en mayúsculas, lo pasa a oración ("Trabajos en general").
 */
export function prettyTitle(text: string): string {
  const letters = text.replace(/[^a-záéíóúüñ]/gi, '');
  if (letters.length < 4) return text;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length;
  if (upper / letters.length < 0.8) return text;
  const lower = text.toLocaleLowerCase('es-AR');
  return lower.charAt(0).toLocaleUpperCase('es-AR') + lower.slice(1);
}

const GENERIC_TITLES = new Set([
  'venta', 'ventas', 'servicio', 'servicios', 'trabajo', 'trabajos',
  'trabajos en general', 'varios', 'oficios', 'hola', 'consultas',
]);

/** true si el título no dice qué hace la persona ("Venta", "Trabajos en general"). */
export function isGenericTitle(title: string): boolean {
  const t = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return GENERIC_TITLES.has(t);
}

/** "hace 3 meses", "hace 2 días", "hoy" */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
  const years = Math.floor(days / 365);
  return years === 1 ? 'hace 1 año' : `hace ${years} años`;
}
