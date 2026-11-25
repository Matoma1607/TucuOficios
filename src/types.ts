export interface Job {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  extraCategories: string[]; // hasta 3 rubros más, además del principal
  zone: string;
  professionalName: string;
  alias: string | null;      // link corto: tucuoficios.net.ar/<alias>
  whatsapp: string; // formato 549XXXXXXXXXX
  instagram: string | null; // usuario, sin @
  imageUrl: string;          // portada
  thumbUrl: string;          // portada en miniatura (listado)
  cardUrl: string;           // portada mediana (tarjeta en compu)
  imagePath: string | null;
  photoUrls: string[];       // todas las fotos, la portada primero
  photoPaths: string[];
  createdAt: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  verificado: boolean;       // lo marca el admin después de comprobar los datos
  description: string;
}

export type Category = string;

export interface CategoryInfo {
  id: string;
  label: string;
  section: string;
  iconName: string; // Nombre del icono de Lucide
}

// Secciones en el orden en que se muestran, con su ícono de Lucide y sus colores
// (fondo suave + texto oscuro del mismo tono, con contraste AA).
export interface SectionInfo { id: string; iconName: string; tint: string; ink: string }

export const SECTIONS: SectionInfo[] = [
  { id: 'Hogar', iconName: 'House', tint: '#FDE7D3', ink: '#9A3412' },
  { id: 'Construcción', iconName: 'HardHat', tint: '#EFE9DF', ink: '#5C4628' },
  { id: 'Tecnología', iconName: 'Cpu', tint: '#E0EAFB', ink: '#1E3A8A' },
  { id: 'Vehículos', iconName: 'Car', tint: '#DCEEF9', ink: '#155E8B' },
  { id: 'Salud y Cuidado', iconName: 'HeartPulse', tint: '#FBE3EA', ink: '#9D174D' },
  { id: 'Educación', iconName: 'BookOpen', tint: '#E7E4F8', ink: '#4C3FA0' },
  { id: 'Gastronomía', iconName: 'Utensils', tint: '#FFF1C9', ink: '#7A5200' },
  { id: 'Eventos', iconName: 'PartyPopper', tint: '#F6E3F5', ink: '#86198F' },
  { id: 'Mascotas', iconName: 'Dog', tint: '#EAF3DE', ink: '#3F6212' },
  { id: 'Servicios Profesionales', iconName: 'Briefcase', tint: '#E8EEF2', ink: '#334155' },
  { id: 'Emprendimientos', iconName: 'Store', tint: '#DDF3EC', ink: '#065F46' },
  { id: 'Varios', iconName: 'Shapes', tint: '#F1EFE8', ink: '#44403C' },
];

const DEFAULT_SECTION: SectionInfo = { id: 'Varios', iconName: 'Shapes', tint: '#F1EFE8', ink: '#44403C' };

/** Colores e ícono de la sección a la que pertenece una categoría. */
export function sectionOf(categoryId: string): SectionInfo {
  const section = CATEGORIES_CONFIG.find(c => c.id === categoryId)?.section;
  return SECTIONS.find(s => s.id === section) ?? DEFAULT_SECTION;
}

// El "id" se guarda en la base de datos: no cambiar los existentes.
export const CATEGORIES_CONFIG: CategoryInfo[] = [
  // Hogar
  { id: 'Electricidad', label: 'Electricidad', section: 'Hogar', iconName: 'Zap' },
  { id: 'Plomería', label: 'Plomería', section: 'Hogar', iconName: 'Droplets' },
  { id: 'Gasista Matriculado', label: 'Gasista', section: 'Hogar', iconName: 'Flame' },
  { id: 'Aires', label: 'Aire acondicionado', section: 'Hogar', iconName: 'Wind' },
  { id: 'Refrigeración', label: 'Refrigeración', section: 'Hogar', iconName: 'Snowflake' },
  { id: 'Electrodomésticos', label: 'Reparación de electrodomésticos', section: 'Hogar', iconName: 'WashingMachine' },
  { id: 'Pintura', label: 'Pintura', section: 'Hogar', iconName: 'Paintbrush' },
  { id: 'Limpieza', label: 'Limpieza', section: 'Hogar', iconName: 'Sparkles' },
  { id: 'Jardinería', label: 'Jardinería', section: 'Hogar', iconName: 'Leaf' },
  { id: 'Piletas', label: 'Piletas', section: 'Hogar', iconName: 'Waves' },
  { id: 'Control de Plagas', label: 'Control de plagas', section: 'Hogar', iconName: 'Bug' },
  { id: 'Cerrajería', label: 'Cerrajería', section: 'Hogar', iconName: 'Key' },
  { id: 'Vidriería', label: 'Vidriería', section: 'Hogar', iconName: 'AppWindow' },
  { id: 'Tapicería', label: 'Tapicería', section: 'Hogar', iconName: 'Sofa' },
  { id: 'Fletes y Mudanzas', label: 'Fletes y mudanzas', section: 'Hogar', iconName: 'Truck' },

  // Construcción
  { id: 'Albañilería', label: 'Albañilería', section: 'Construcción', iconName: 'BrickWall' },
  { id: 'Carpintería', label: 'Carpintería', section: 'Construcción', iconName: 'Hammer' },
  { id: 'Herrería', label: 'Herrería', section: 'Construcción', iconName: 'Anvil' },
  { id: 'Soldadura', label: 'Soldadura', section: 'Construcción', iconName: 'Flame' },
  { id: 'Techos', label: 'Techos e impermeabilización', section: 'Construcción', iconName: 'House' },
  { id: 'Durlock', label: 'Durlock y yesería', section: 'Construcción', iconName: 'PanelsTopLeft' },
  { id: 'Ferretería y Materiales', label: 'Ferretería y materiales', section: 'Construcción', iconName: 'Wrench' },

  // Tecnología
  { id: 'Soporte Técnico', label: 'Soporte técnico', section: 'Tecnología', iconName: 'Monitor' },
  { id: 'Servicio de Celulares', label: 'Reparación de celulares', section: 'Tecnología', iconName: 'Smartphone' },
  { id: 'Cámaras y Alarmas', label: 'Cámaras y alarmas', section: 'Tecnología', iconName: 'Cctv' },
  { id: 'Desarrollo Web', label: 'Desarrollo web', section: 'Tecnología', iconName: 'Code' },
  { id: 'Diseño y Marketing', label: 'Diseño y marketing', section: 'Tecnología', iconName: 'Palette' },

  // Vehículos
  { id: 'Mecánica', label: 'Mecánica', section: 'Vehículos', iconName: 'Wrench' },
  { id: 'Gomería', label: 'Gomería', section: 'Vehículos', iconName: 'CircleDot' },
  { id: 'Chapa y Pintura', label: 'Chapa y pintura', section: 'Vehículos', iconName: 'SprayCan' },
  { id: 'Clases de Manejo', label: 'Clases de manejo', section: 'Vehículos', iconName: 'Car' },
  { id: 'Electricidad del Automotor', label: 'Electricidad del automotor', section: 'Vehículos', iconName: 'BatteryCharging' },
  { id: 'Lavadero de Autos', label: 'Lavadero de autos', section: 'Vehículos', iconName: 'Droplet' },
  { id: 'Motos', label: 'Motos', section: 'Vehículos', iconName: 'Motorbike' },
  { id: 'Bicicletas', label: 'Bicicletas', section: 'Vehículos', iconName: 'Bike' },

  // Salud y Cuidado
  { id: 'Enfermería', label: 'Enfermería', section: 'Salud y Cuidado', iconName: 'Stethoscope' },
  { id: 'Cuidado de Personas', label: 'Cuidado de personas', section: 'Salud y Cuidado', iconName: 'Heart' },
  { id: 'Niñera', label: 'Niñera', section: 'Salud y Cuidado', iconName: 'Baby' },
  { id: 'Masajes', label: 'Masajes', section: 'Salud y Cuidado', iconName: 'HandHeart' },
  { id: 'Kinesiología', label: 'Kinesiología', section: 'Salud y Cuidado', iconName: 'Activity' },
  { id: 'Nutrición', label: 'Nutrición', section: 'Salud y Cuidado', iconName: 'Apple' },
  { id: 'Psicología', label: 'Psicología', section: 'Salud y Cuidado', iconName: 'Brain' },
  { id: 'Estética', label: 'Estética', section: 'Salud y Cuidado', iconName: 'Sparkles' },
  { id: 'Peluquería', label: 'Peluquería', section: 'Salud y Cuidado', iconName: 'Scissors' },
  { id: 'Barbería', label: 'Barbería', section: 'Salud y Cuidado', iconName: 'Scissors' },
  { id: 'Uñas', label: 'Uñas', section: 'Salud y Cuidado', iconName: 'Sparkle' },
  { id: 'Maquillaje', label: 'Maquillaje', section: 'Salud y Cuidado', iconName: 'Brush' },

  // Educación
  { id: 'Apoyo Escolar', label: 'Apoyo escolar', section: 'Educación', iconName: 'GraduationCap' },
  { id: 'Idiomas', label: 'Idiomas', section: 'Educación', iconName: 'Languages' },
  { id: 'Música', label: 'Clases de música', section: 'Educación', iconName: 'Music' },
  { id: 'Entrenamiento Personal', label: 'Entrenamiento', section: 'Educación', iconName: 'Dumbbell' },

  // Gastronomía
  { id: 'Comidas', label: 'Comidas y viandas', section: 'Gastronomía', iconName: 'Utensils' },
  { id: 'Panadería', label: 'Panadería', section: 'Gastronomía', iconName: 'Croissant' },
  { id: 'Repostería', label: 'Repostería', section: 'Gastronomía', iconName: 'CakeSlice' },

  // Eventos
  { id: 'Fotografía', label: 'Fotografía y video', section: 'Eventos', iconName: 'Camera' },
  { id: 'DJ y Sonido', label: 'DJ y sonido', section: 'Eventos', iconName: 'Disc3' },
  { id: 'Catering', label: 'Catering', section: 'Eventos', iconName: 'ChefHat' },
  { id: 'Animación', label: 'Animación infantil', section: 'Eventos', iconName: 'PartyPopper' },
  { id: 'Decoración de Eventos', label: 'Decoración de eventos', section: 'Eventos', iconName: 'Flower2' },
  { id: 'Alquiler para Eventos', label: 'Alquiler de vajilla y mobiliario', section: 'Eventos', iconName: 'Armchair' },

  // Mascotas
  { id: 'Peluquería Canina', label: 'Peluquería canina', section: 'Mascotas', iconName: 'Dog' },
  { id: 'Veterinaria / Paseadores', label: 'Veterinaria', section: 'Mascotas', iconName: 'PawPrint' },
  { id: 'Paseo de Perros', label: 'Paseo de perros', section: 'Mascotas', iconName: 'Footprints' },
  { id: 'Guardería de Mascotas', label: 'Guardería de mascotas', section: 'Mascotas', iconName: 'HouseHeart' },

  // Servicios profesionales
  { id: 'Contabilidad', label: 'Contabilidad', section: 'Servicios Profesionales', iconName: 'Calculator' },
  { id: 'Gestoría', label: 'Gestoría y trámites', section: 'Servicios Profesionales', iconName: 'FileText' },
  { id: 'Abogacía', label: 'Abogacía', section: 'Servicios Profesionales', iconName: 'Gavel' },
  { id: 'Arquitectura', label: 'Arquitectura', section: 'Servicios Profesionales', iconName: 'DraftingCompass' },

  // Emprendimientos (venta de productos)
  { id: 'Ropa y Accesorios', label: 'Ropa y accesorios', section: 'Emprendimientos', iconName: 'Shirt' },
  { id: 'Cocina y Hogar', label: 'Cocina y hogar', section: 'Emprendimientos', iconName: 'CookingPot' },
  { id: 'Celulares y Electrónica', label: 'Celulares y electrónica', section: 'Emprendimientos', iconName: 'Smartphone' },
  { id: 'Belleza y Cosmética', label: 'Belleza y cosmética', section: 'Emprendimientos', iconName: 'Sparkles' },
  { id: 'Otros Productos', label: 'Otros productos', section: 'Emprendimientos', iconName: 'ShoppingBag' },

  // Varios
  { id: 'Costura', label: 'Costura y arreglos', section: 'Varios', iconName: 'Shirt' },
  { id: 'Sastrería', label: 'Sastrería', section: 'Varios', iconName: 'Shirt' },
  { id: 'Reparación de Calzado', label: 'Reparación de calzado', section: 'Varios', iconName: 'Hammer' },
  { id: 'Tatuajes', label: 'Tatuajes', section: 'Varios', iconName: 'PenTool' },
  { id: 'Otros', label: 'Otros servicios', section: 'Varios', iconName: 'Ellipsis' },
];

export const CATEGORIES = CATEGORIES_CONFIG.map(c => c.id);

// Localidades de Tucumán para el campo "Zona".
export const ZONES: string[] = [
  'San Miguel de Tucumán',
  'Yerba Buena',
  'Tafí Viejo',
  'Banda del Río Salí',
  'Alderetes',
  'Las Talitas',
  'El Manantial',
  'San Pablo',
  'Lules',
  'Famaillá',
  'Monteros',
  'Concepción',
  'Aguilares',
  'Simoca',
  'Bella Vista',
  'Tafí del Valle',
  'Trancas',
  'Burruyacú',
  'Todo Tucumán',
];

/** Máximo de rubros extra por publicación (además del principal) */
export const MAX_RUBROS_EXTRA = 3;

/** Todos los rubros de una publicación: el principal primero */
export function rubrosDe(job: { category: string; extraCategories?: string[] }): string[] {
  return [job.category, ...(job.extraCategories ?? [])];
}
