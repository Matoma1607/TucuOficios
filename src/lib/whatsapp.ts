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
