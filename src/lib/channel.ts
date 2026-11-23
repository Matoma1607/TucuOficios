import { Job } from '../types';
import { instagramUrl } from './instagram';

/** Emoji que encabeza el aviso en el canal de WhatsApp, según el rubro. */
const EMOJI_BY_CATEGORY: Record<string, string> = {
  // Hogar
  'Electricidad': '⚡',
  'Plomería': '🚰',
  'Gasista Matriculado': '🔥',
  'Aires': '❄️',
  'Refrigeración': '🧊',
  'Electrodomésticos': '🔌',
  'Pintura': '🖌️',
  'Limpieza': '🧽',
  'Jardinería': '🌿',
  'Piletas': '🏊',
  'Control de Plagas': '🐜',
  'Cerrajería': '🔑',
  'Vidriería': '🪟',
  'Tapicería': '🛋️',
  'Fletes y Mudanzas': '🚚',
  // Construcción
  'Albañilería': '🧱',
  'Carpintería': '🪚',
  'Herrería': '⚒️',
  'Soldadura': '🔩',
  'Techos': '🏠',
  'Durlock': '📐',
  'Ferretería y Materiales': '🔧',
  // Tecnología
  'Soporte Técnico': '💻',
  'Servicio de Celulares': '📱',
  'Cámaras y Alarmas': '📹',
  'Desarrollo Web': '🌐',
  'Diseño y Marketing': '🎨',
  // Vehículos
  'Mecánica': '🔧',
  'Gomería': '🛞',
  'Chapa y Pintura': '🚗',
  'Clases de Manejo': '🚗',
  // Salud y cuidado
  'Enfermería': '🩺',
  'Cuidado de Personas': '🤝',
  'Niñera': '🍼',
  'Masajes': '💆',
  'Estética': '💇',
  // Educación
  'Apoyo Escolar': '📚',
  'Idiomas': '🗣️',
  'Música': '🎵',
  'Entrenamiento Personal': '🏋️',
  // Gastronomía
  'Comidas': '🍲',
  'Panadería': '🥐',
  'Repostería': '🍰',
  // Eventos
  'Fotografía': '📷',
  'DJ y Sonido': '🎧',
  'Catering': '🍽️',
  'Animación': '🎈',
  // Mascotas
  'Peluquería Canina': '🐶',
  'Veterinaria / Paseadores': '🐾',
  // Servicios profesionales
  'Contabilidad': '🧮',
  'Gestoría': '📄',
  // Emprendimientos
  'Ropa y Accesorios': '👕',
  'Cocina y Hogar': '🍳',
  'Celulares y Electrónica': '📱',
  'Belleza y Cosmética': '💄',
  'Otros Productos': '🛍️',
  // Varios
  'Costura': '🧵',
  'Otros': '📌',
};

export const categoryEmoji = (categoryId: string) => EMOJI_BY_CATEGORY[categoryId] ?? '📌';

/** Texto listo para pegar en el canal de WhatsApp (los links quedan clickeables allá). */
export function channelText(job: Job, profileUrl: string): string {
  const lines = [
    `${categoryEmoji(job.category)} *${job.title}*`,
    `👤 ${job.professionalName}`,
    `📍 ${job.zone}`,
    '',
    job.description,
    '',
  ];
  // Sin "https://": se ve más limpio y WhatsApp igual lo hace clickeable
  const limpio = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '');
  if (job.instagram) lines.push(`📸 Instagram: ${limpio(instagramUrl(job.instagram))}`);
  lines.push(`👉 Ver trabajos y contacto: ${limpio(profileUrl)}`, '', '#TucuOficios #Tucumán');
  return lines.join('\n');
}
