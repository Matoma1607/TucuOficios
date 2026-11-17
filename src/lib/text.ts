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
