import { CATEGORIES_CONFIG } from '../types';
import { isGenericTitle } from './text';
import { normalizeWhatsapp } from './whatsapp';
import { normalizeInstagram } from './instagram';

// Validación del formulario de publicar y de editar (la misma regla en los dos).
// La base vuelve a controlar largos y formatos al guardar.

export interface DatosPublicacion {
  title: string;
  category: string;
  zone: string;
  nombre: string;
  negocio?: string | null;
  whatsapp: string;
  instagram?: string | null;
  description: string;
  fotos: number;
}

export type ErroresPublicacion = Partial<Record<
  'title' | 'category' | 'zone' | 'nombre' | 'negocio' | 'whatsapp' | 'instagram' | 'description' | 'image',
  string
>>;

const letras = (t: string) => (t.match(/\p{L}/gu) ?? []).length;
const tieneLink = (t: string) => /https?:\/\/|www\.|\.com\b|\.ar\b/i.test(t);
/** 7 o más dígitos seguidos (con espacios o guiones): parece un teléfono */
const tieneTelefono = (t: string) => /(\d[\s-]?){7,}/.test(t);

export function validarPublicacion(d: DatosPublicacion): ErroresPublicacion {
  const e: ErroresPublicacion = {};
  const title = d.title.trim();
  const nombre = d.nombre.trim().replace(/\s+/g, ' ');
  const negocio = (d.negocio ?? '').trim().replace(/\s+/g, ' ');
  const description = d.description.trim();

  if (title.length < 5) e.title = 'Mínimo 5 caracteres';
  else if (title.length > 80) e.title = 'Máximo 80 caracteres';
  else if (isGenericTitle(title)) e.title = 'Contá qué hacés (ej: Venta de ropa)';
  else if (tieneTelefono(title) || tieneLink(title)) e.title = 'Sin teléfonos ni links acá';

  if (!CATEGORIES_CONFIG.some((c) => c.id === d.category)) e.category = 'Elegí una';
  if (!d.zone.trim()) e.zone = 'Elegí una';

  if (nombre.length < 2 || letras(nombre) < 2) e.nombre = 'Escribí tu nombre';
  else if (nombre.length > 60) e.nombre = 'Máximo 60 caracteres';
  else if (/\d/.test(nombre) || tieneLink(nombre) || nombre.includes('@')) e.nombre = 'Solo tu nombre, sin números ni links';

  if (negocio) {
    if (negocio.length < 2 || letras(negocio) < 2) e.negocio = 'Muy corto';
    else if (negocio.length > 60) e.negocio = 'Máximo 60 caracteres';
    else if (tieneTelefono(negocio) || tieneLink(negocio)) e.negocio = 'Sin teléfonos ni links acá';
  }

  if (!normalizeWhatsapp(d.whatsapp)) e.whatsapp = 'Ej: 381 412-3456';
  if (normalizeInstagram(d.instagram ?? '') === null) e.instagram = 'Revisá el usuario';

  if (description.length < 10) e.description = 'Mínimo 10 caracteres';
  else if (description.length > 600) e.description = 'Máximo 600 caracteres';

  if (d.fotos < 1) e.image = 'Subí al menos una foto de tu trabajo.';
  return e;
}
