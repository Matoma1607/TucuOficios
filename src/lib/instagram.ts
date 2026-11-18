/**
 * Acepta lo que la gente suele pegar ("@usuario", "usuario",
 * "instagram.com/usuario", "https://www.instagram.com/usuario/?igsh=…")
 * y devuelve solo el usuario. '' si está vacío, null si no es válido.
 */
export function normalizeInstagram(raw: string): string | null {
  let s = (raw || '').trim();
  if (!s) return '';
  s = s.replace(/^https?:\/\//i, '').replace(/^(www\.)?instagram\.com\//i, '');
  s = s.split(/[/?#]/)[0].replace(/^@/, '');
  const valid = /^[A-Za-z0-9._]{1,30}$/.test(s) && !s.startsWith('.') && !s.endsWith('.') && !s.includes('..');
  return valid ? s.toLowerCase() : null;
}

export const instagramUrl = (user: string) => `https://www.instagram.com/${user}/`;
