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
  // Salud y Cuidado Personal
  { id: 'Enfermería', label: 'Enfermería', section: 'Salud y Cuidado Personal', iconName: 'Stethoscope' },
  { id: 'Cuidado de Personas', label: 'Cuidado de Personas', section: 'Salud y Cuidado Personal', iconName: 'Heart' },
  { id: 'Estética a domicilio', label: 'Estética a domicilio', section: 'Salud y Cuidado Personal', iconName: 'Scissors' },
  { id: 'Veterinaria / Paseadores', label: 'Veterinaria', section: 'Salud y Cuidado Personal', iconName: 'Dog' },
  
  // Educación y Clases
  { id: 'Apoyo Escolar', label: 'Apoyo Escolar', section: 'Educación y Clases', iconName: 'GraduationCap' },
  { id: 'Idiomas', label: 'Idiomas', section: 'Educación y Clases', iconName: 'Languages' },
  { id: 'Música', label: 'Música', section: 'Educación y Clases', iconName: 'Music' },
  { id: 'Entrenamiento Personal', label: 'Entrenamiento', section: 'Educación y Clases', iconName: 'Dumbbell' },
  
  // Servicios Técnicos y Digitales
  { id: 'Soporte Técnico', label: 'Soporte Técnico', section: 'Servicios Técnicos y Digitales', iconName: 'Monitor' },
  { id: 'Servicio de Celulares', label: 'Servicio de Celulares', section: 'Servicios Técnicos y Digitales', iconName: 'Smartphone' },
  { id: 'Diseño y Marketing', label: 'Diseño y Marketing', section: 'Servicios Técnicos y Digitales', iconName: 'Palette' },
  
  // Mantenimiento de Hogar
  { id: 'Jardinería', label: 'Jardinería', section: 'Mantenimiento de Hogar', iconName: 'Leaf' },
  { id: 'Limpieza', label: 'Limpieza', section: 'Mantenimiento de Hogar', iconName: 'Sparkles' },
  { id: 'Gasista Matriculado', label: 'Gasista', section: 'Mantenimiento de Hogar', iconName: 'Flame' },
  { id: 'Herrería', label: 'Herrería', section: 'Mantenimiento de Hogar', iconName: 'Hammer' },
  { id: 'Mudanzas', label: 'Mudanzas', section: 'Mantenimiento de Hogar', iconName: 'Truck' },
  { id: 'Plomería', label: 'Plomería', section: 'Mantenimiento de Hogar', iconName: 'Droplets' },
  { id: 'Electricidad', label: 'Electricidad', section: 'Mantenimiento de Hogar', iconName: 'Zap' },
  { id: 'Pintura', label: 'Pintura', section: 'Mantenimiento de Hogar', iconName: 'Paintbrush' },
  { id: 'Cerrajería', label: 'Cerrajería', section: 'Mantenimiento de Hogar', iconName: 'Key' },
  { id: 'Aires', label: 'Aire Acondicionado', section: 'Mantenimiento de Hogar', iconName: 'Wind' },
  { id: 'Otros', label: 'Otros', section: 'Mantenimiento de Hogar', iconName: 'MoreHorizontal' },
];

export const CATEGORIES = CATEGORIES_CONFIG.map(c => c.id);
