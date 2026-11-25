import { CATEGORIES_CONFIG, Job, ZONES, rubrosDe } from '../types';

/** Minúsculas, sin acentos ni signos: "¿Plomero en Tafí?" -> "plomero en tafi" */
export const normalizar = (t: string) =>
  t.toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0001/g, 'ñ').replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Palabras que usa la gente para cada rubro (además del nombre del rubro).
 * Se comparan sin acentos y por comienzo de palabra ("plomer" encuentra plomero, plomera, plomeros).
 */
const SINONIMOS: Record<string, string[]> = {
  'Electricidad': ['electricist', 'electrici', 'luz', 'enchufe', 'instalacion electrica'],
  'Plomería': ['plomer', 'cañeri', 'caneri', 'perdida de agua', 'canilla', 'sanitari'],
  'Gasista Matriculado': ['gasist', 'gas'],
  'Aires': ['aire acondicionado', 'aires', 'split'],
  'Refrigeración': ['heladera', 'freezer', 'refrigeracion'],
  'Electrodomésticos': ['lavarropa', 'electrodomestic', 'microondas', 'cocina electrica'],
  'Pintura': ['pintor', 'pintura', 'pintar'],
  'Limpieza': ['limpieza', 'limpiar', 'empleada domestica'],
  'Jardinería': ['jardiner', 'jardin', 'pasto', 'poda'],
  'Piletas': ['pileta', 'piscina'],
  'Control de Plagas': ['plaga', 'plagas', 'fumiga', 'cucaracha', 'raton'],
  'Cerrajería': ['cerrajer', 'llave', 'llaves', 'cerradura'],
  'Vidriería': ['vidrier', 'vidrio'],
  'Tapicería': ['tapicer', 'tapizar', 'sillon'],
  'Fletes y Mudanzas': ['flete', 'fletes', 'mudanza'],
  'Albañilería': ['albañil', 'albanil', 'albañileria', 'albanileria', 'construccion', 'obra'],
  'Carpintería': ['carpinter', 'mueble'],
  'Herrería': ['herrer', 'reja', 'rejas', 'porton'],
  'Soldadura': ['soldad', 'soldar'],
  'Techos': ['techo', 'impermeabiliz', 'gotera', 'membrana'],
  'Durlock': ['durlock', 'yeseria', 'yesero', 'cielorraso'],
  'Ferretería y Materiales': ['ferreter', 'materiales', 'corralon'],
  'Soporte Técnico': ['computadora', 'notebook', 'pc', 'soporte tecnico', 'tecnico de pc', 'formatear'],
  'Servicio de Celulares': ['celular', 'pantalla rota'],
  'Cámaras y Alarmas': ['camara', 'alarma', 'seguridad'],
  'Desarrollo Web': ['pagina web', 'sitio web', 'desarrollo web', 'programador'],
  'Diseño y Marketing': ['diseño', 'diseno', 'logo', 'logos', 'marketing', 'redes sociales'],
  'Mecánica': ['mecanic', 'auto', 'autos', 'taller'],
  'Gomería': ['gomeria', 'gomero', 'goma', 'gomas', 'cubierta', 'neumatico'],
  'Chapa y Pintura': ['chapa', 'choque'],
  'Clases de Manejo': ['manejo', 'manejar', 'conducir'],
  'Electricidad del Automotor': ['electricidad del automotor', 'bateria', 'alternador'],
  'Lavadero de Autos': ['lavadero', 'lavado de auto'],
  'Motos': ['moto', 'motos'],
  'Bicicletas': ['bici', 'bicis', 'bicicleta'],
  'Enfermería': ['enfermer', 'inyeccion'],
  'Cuidado de Personas': ['cuidador', 'cuidado de', 'acompañante', 'acompanante', 'abuelo'],
  'Niñera': ['niñera', 'ninera', 'cuidar chicos', 'cuidar niños', 'cuidar ninos'],
  'Masajes': ['masaje', 'masajes', 'masoterap'],
  'Kinesiología': ['kinesi', 'kine'],
  'Nutrición': ['nutricion', 'nutricionista', 'dieta'],
  'Psicología': ['psicolog', 'terapia'],
  'Estética': ['estetica', 'depilacion', 'facial', 'pestaña', 'pestana'],
  'Peluquería': ['peluquer', 'corte de pelo', 'tintura'],
  'Barbería': ['barber', 'barba'],
  'Uñas': ['uña', 'uñas', 'manicur', 'esmaltado'],
  'Maquillaje': ['maquill', 'makeup'],
  'Apoyo Escolar': ['apoyo escolar', 'maestra', 'particular', 'profe', 'profesor', 'clases de matematica', 'tarea', 'tareas'],
  'Idiomas': ['ingles', 'idioma', 'frances', 'portugues', 'italiano'],
  'Música': ['musica', 'guitarra', 'piano', 'canto'],
  'Entrenamiento Personal': ['entrenador', 'personal trainer', 'gimnasio', 'entrenamiento'],
  'Comidas': ['comida', 'vianda', 'empanada'],
  'Panadería': ['panader', 'pan'],
  'Repostería': ['reposter', 'torta', 'tortas', 'postre', 'cumple'],
  'Fotografía': ['fotograf', 'foto', 'fotos', 'video', 'videos'],
  'DJ y Sonido': ['dj', 'sonido'],
  'Catering': ['catering'],
  'Animación': ['animacion', 'animador', 'payaso', 'infantil'],
  'Decoración de Eventos': ['decoracion', 'globos'],
  'Alquiler para Eventos': ['alquiler de', 'vajilla', 'mesas', 'sillas'],
  'Peluquería Canina': ['peluqueria canina', 'baño de perro', 'bano de perro'],
  'Veterinaria / Paseadores': ['veterinari', 'vete'],
  'Paseo de Perros': ['paseador', 'pasear perro', 'paseo de perro'],
  'Guardería de Mascotas': ['guarderia', 'cuidar perro', 'cuidar gato'],
  'Contabilidad': ['contador', 'contabilidad', 'monotributo', 'impuesto'],
  'Gestoría': ['gestor', 'tramite'],
  'Abogacía': ['abogad', 'legal'],
  'Arquitectura': ['arquitect', 'plano', 'planos'],
  'Ropa y Accesorios': ['ropa', 'accesorio', 'zapatilla', 'indumentaria'],
  'Cocina y Hogar': ['bazar', 'cocina y hogar'],
  'Celulares y Electrónica': ['funda', 'fundas', 'cargador', 'electronica', 'auricular'],
  'Belleza y Cosmética': ['cosmetic', 'perfume', 'crema', 'cremas', 'belleza'],
  'Costura': ['costur', 'modista', 'arreglo de ropa'],
  'Sastrería': ['sastre'],
  'Reparación de Calzado': ['zapater', 'calzado'],
  'Tatuajes': ['tatuaje', 'tatuajes', 'tatuador', 'tattoo'],
};

/** Palabras sueltas que no sirven para buscar */
const VACIAS = new Set(['busco', 'buscar', 'necesito', 'quiero', 'alguien', 'que', 'en', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'para', 'por', 'hay', 'tenes', 'tienen', 'algun', 'alguna', 'me', 'mi', 'zona', 'cerca', 'y', 'o', 'con', 'hola', 'por favor', 'donde', 'como', 'se', 'sea']);

/** Términos cortos (hasta 5 letras) tienen que coincidir con la palabra entera: "profe" no encuentra "profesional" */
const empiezaPalabra = (texto: string, termino: string) =>
  termino.length <= 5
    ? new RegExp(`(^|\\s)${termino}(\\s|$)`).test(texto)
    : new RegExp(`(^|\\s)${termino}`).test(texto);

/** Rubros que menciona el texto */
export function rubrosEn(texto: string): string[] {
  const t = normalizar(texto);
  const hallados: string[] = [];
  for (const cat of CATEGORIES_CONFIG) {
    if (cat.id === 'Otros' || cat.id === 'Otros Productos') continue;
    const terminos = [normalizar(cat.label), ...(SINONIMOS[cat.id] ?? []).map(normalizar)];
    if (terminos.some((x) => x && empiezaPalabra(t, x))) hallados.push(cat.id);
  }
  return hallados;
}

/** Zona que menciona el texto (la más larga que coincida, para no confundir "Tafí" con "Tafí del Valle") */
export function zonaEn(texto: string): string | null {
  const t = normalizar(texto);
  const alias: Record<string, string> = { 'san miguel': 'San Miguel de Tucumán', 'capital': 'San Miguel de Tucumán', 'centro': 'San Miguel de Tucumán', 'tafi': 'Tafí Viejo', 'banda': 'Banda del Río Salí', 'yb': 'Yerba Buena' };
  const zonas = ZONES.filter((z) => z !== 'Todo Tucumán').sort((a, b) => b.length - a.length);
  for (const z of zonas) if (t.includes(normalizar(z))) return z;
  for (const [k, z] of Object.entries(alias)) if (empiezaPalabra(t, k)) return z;
  return null;
}

export interface ResultadoBusqueda {
  rubros: string[];
  zona: string | null;
  jobs: Job[];          // los de esa zona (o todos, si no dijo zona)
  otrasZonas: Job[];    // del rubro pero en otras zonas, si en la pedida no hay
}

/**
 * Busca publicaciones aprobadas a partir de lo que escribió la persona.
 * Devuelve null si el texto no menciona ningún rubro ni palabra que coincida.
 */
export function buscarEnSitio(texto: string, jobs: Job[]): ResultadoBusqueda | null {
  const aprobados = jobs.filter((j) => j.estado === 'aprobado');
  const rubros = rubrosEn(texto);
  const zona = zonaEn(texto);

  let candidatos: Job[];
  if (rubros.length) {
    candidatos = aprobados.filter((j) => rubrosDe(j).some((r) => rubros.includes(r)));
  } else {
    // Sin rubro reconocido: probamos con las palabras sueltas en el título
    const palabras = normalizar(texto).split(' ').filter((p) => p.length >= 4 && !VACIAS.has(p));
    if (!palabras.length) return null;
    candidatos = aprobados.filter((j) => {
      const t = normalizar(`${j.title} ${j.description}`);
      return palabras.some((p) => empiezaPalabra(t, p));
    });
    if (!candidatos.length && !zona) return null;
    if (!candidatos.length && zona) candidatos = aprobados;
  }

  const enZona = (j: Job) => !zona || j.zone === zona || j.zone === 'Todo Tucumán';
  const deLaZona = candidatos.filter(enZona);
  return {
    rubros,
    zona,
    jobs: deLaZona,
    otrasZonas: zona && !deLaZona.length ? candidatos : [],
  };
}
