export interface Job {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  zone: string;
  professionalName: string;
  whatsapp: string; // formato 549XXXXXXXXXX
  imageUrl: string;          // portada
  imagePath: string | null;
  photoUrls: string[];       // todas las fotos, la portada primero
  photoPaths: string[];
  createdAt: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  description: string;
}

export type Category = string;

export interface CategoryInfo {
  id: string;
  label: string;
  section: string;
  iconName: string; // Nombre del icono de Lucide
}

// Secciones en el orden en que se muestran, con su ícono de Lucide.
export const SECTIONS: { id: string; iconName: string }[] = [
  { id: 'Hogar', iconName: 'House' },
  { id: 'Construcción', iconName: 'HardHat' },
  { id: 'Tecnología', iconName: 'Cpu' },
  { id: 'Vehículos', iconName: 'Car' },
  { id: 'Salud y Cuidado', iconName: 'HeartPulse' },
  { id: 'Educación', iconName: 'BookOpen' },
  { id: 'Gastronomía', iconName: 'Utensils' },
  { id: 'Eventos', iconName: 'PartyPopper' },
  { id: 'Mascotas', iconName: 'Dog' },
  { id: 'Servicios Profesionales', iconName: 'Briefcase' },
  { id: 'Varios', iconName: 'Shapes' },
];

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

  // Salud y Cuidado
  { id: 'Enfermería', label: 'Enfermería', section: 'Salud y Cuidado', iconName: 'Stethoscope' },
  { id: 'Cuidado de Personas', label: 'Cuidado de personas', section: 'Salud y Cuidado', iconName: 'Heart' },
  { id: 'Niñera', label: 'Niñera', section: 'Salud y Cuidado', iconName: 'Baby' },
  { id: 'Masajes', label: 'Masajes', section: 'Salud y Cuidado', iconName: 'HandHeart' },
  { id: 'Estética', label: 'Estética y peluquería', section: 'Salud y Cuidado', iconName: 'Scissors' },

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

  // Mascotas
  { id: 'Peluquería Canina', label: 'Peluquería canina', section: 'Mascotas', iconName: 'Dog' },
  { id: 'Veterinaria / Paseadores', label: 'Veterinaria y paseos', section: 'Mascotas', iconName: 'PawPrint' },

  // Servicios profesionales
  { id: 'Contabilidad', label: 'Contabilidad', section: 'Servicios Profesionales', iconName: 'Calculator' },
  { id: 'Gestoría', label: 'Gestoría y trámites', section: 'Servicios Profesionales', iconName: 'FileText' },

  // Varios
  { id: 'Costura', label: 'Costura y arreglos', section: 'Varios', iconName: 'Shirt' },
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
