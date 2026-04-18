export interface Job {
  id: string;
  title: string;
  category: string;
  zone: string;
  professionalName: string;
  professionalId?: string;
  whatsapp: string;
  imageUrl: string;
  createdAt: number | string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  description?: string;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: string;
}

export type Category = string;

export interface CategoryInfo {
  id: string;
  label: string;
  section: string;
  iconName: string; // Nombre del icono de Lucide
}

export const CATEGORIES_CONFIG: CategoryInfo[] = [
  // Gastronomía
  { id: 'Comidas', label: 'Comidas / Viandas', section: 'Gastronomía', iconName: 'Utensils' },
  { id: 'Repostería', label: 'Repostería', section: 'Gastronomía', iconName: 'CakeSlice' },

  // Salud y Mascotas
  { id: 'Enfermería', label: 'Enfermería', section: 'Salud y Cuidado', iconName: 'Stethoscope' },
  { id: 'Cuidado de Personas', label: 'Cuidado de Personas', section: 'Salud y Cuidado', iconName: 'Heart' },
  { id: 'Estética', label: 'Estética / Peluquería', section: 'Salud y Cuidado', iconName: 'Scissors' },
  { id: 'Peluquería Canina', label: 'Peluquería Canina', section: 'Mascotas', iconName: 'Dog' },
  { id: 'Veterinaria / Paseadores', label: 'Veterinaria / Paseos', section: 'Mascotas', iconName: 'PawPrint' },
  
  // Educación
  { id: 'Apoyo Escolar', label: 'Apoyo Escolar', section: 'Educación', iconName: 'GraduationCap' },
  { id: 'Idiomas', label: 'Idiomas', section: 'Educación', iconName: 'Languages' },
  { id: 'Música', label: 'Clases de Música', section: 'Educación', iconName: 'Music' },
  { id: 'Entrenamiento Personal', label: 'Entrenamiento', section: 'Educación', iconName: 'Dumbbell' },
  
  // Servicios Técnicos
  { id: 'Soporte Técnico', label: 'Soporte Técnico', section: 'Tecnología', iconName: 'Monitor' },
  { id: 'Servicio de Celulares', label: 'Reparación Celulares', section: 'Tecnología', iconName: 'Smartphone' },
  { id: 'Diseño y Marketing', label: 'Diseño y Marketing', section: 'Tecnología', iconName: 'Palette' },
  
  // Hogar
  { id: 'Gasista Matriculado', label: 'Gasista', section: 'Hogar', iconName: 'Flame' },
  { id: 'Electricidad', label: 'Electricidad', section: 'Hogar', iconName: 'Zap' },
  { id: 'Plomería', label: 'Plomería', section: 'Hogar', iconName: 'Droplets' },
  { id: 'Jardinería', label: 'Jardinería', section: 'Hogar', iconName: 'Leaf' },
  { id: 'Limpieza', label: 'Limpieza', section: 'Hogar', iconName: 'Sparkles' },
  { id: 'Herrería', label: 'Herrería', section: 'Hogar', iconName: 'Hammer' },
  { id: 'Cerrajería', label: 'Cerrajería', section: 'Hogar', iconName: 'Key' },
  { id: 'Pintura', label: 'Pintura', section: 'Hogar', iconName: 'Paintbrush' },
  { id: 'Aires', label: 'Aire Acondicionado', section: 'Hogar', iconName: 'Wind' },
  { id: 'Fletes y Mudanzas', label: 'Fletes y Mudanzas', section: 'Hogar', iconName: 'Truck' },
  { id: 'Costura', label: 'Costura y Arreglos', section: 'Varios', iconName: 'Shirt' },
  { id: 'Otros', label: 'Otros Servicios', section: 'Varios', iconName: 'MoreHorizontal' },
];

export const CATEGORIES = CATEGORIES_CONFIG.map(c => c.id);
