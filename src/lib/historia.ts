import { SITIO } from './alias';

// Imagen vertical (1080 x 1920) para estados de WhatsApp e historias de Instagram,
// armada con las fotos y los datos de la publicación.

const NAVY = '#1E2A5A';
const NAVY_OSC = '#151E44';
const NARANJA = '#FF7A1A';
const CLARO = '#C9CFE0';
const FUENTE = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';

export interface DatosHistoria {
  alias: string;
  nombre: string;
  titulo: string;
  categoria: string;
  zona: string;
  verificado: boolean;
  fotos: string[]; // URLs, la portada primero
  fondo?: Fondo;
}

export type Fondo = 'azul' | 'claro' | 'naranja' | 'foto';

function cargar(url: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = url;
  });
}

/**
 * Dibuja la foto en el recuadro. Si la forma de la foto se parece a la del recuadro, la llena (recorta un poco);
 * si es muy distinta (por ejemplo un flyer vertical en un recuadro apaisado), la muestra entera sobre una
 * copia desenfocada de sí misma, así no se corta el texto de los afiches.
 */
function fotoCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  const relFoto = img.width / img.height;
  const relCaja = w / h;
  const parecidas = Math.max(relFoto, relCaja) / Math.min(relFoto, relCaja) < 1.25;
  const cubrir = Math.max(w / img.width, h / img.height);
  if (parecidas) {
    ctx.drawImage(img, x + (w - img.width * cubrir) / 2, y + (h - img.height * cubrir) / 2, img.width * cubrir, img.height * cubrir);
  } else {
    // fondo: la misma foto agrandada y desenfocada
    ctx.filter = 'blur(28px) brightness(0.75)';
    const c2 = cubrir * 1.2;
    ctx.drawImage(img, x + (w - img.width * c2) / 2, y + (h - img.height * c2) / 2, img.width * c2, img.height * c2);
    ctx.filter = 'none';
    // encima: la foto entera
    const entra = Math.min(w / img.width, h / img.height);
    ctx.drawImage(img, x + (w - img.width * entra) / 2, y + (h - img.height * entra) / 2, img.width * entra, img.height * entra);
  }
  ctx.restore();
}

function ajustar(ctx: CanvasRenderingContext2D, texto: string, peso: number, tam: number, min: number, ancho: number) {
  let t = tam;
  ctx.font = `${peso} ${t}px ${FUENTE}`;
  while (ctx.measureText(texto).width > ancho && t > min) {
    t -= 2;
    ctx.font = `${peso} ${t}px ${FUENTE}`;
  }
  let s = texto;
  while (ctx.measureText(s).width > ancho && s.length > 1) s = s.slice(0, -2) + '…';
  return s;
}

/** Tilde de "verificado" dentro de un círculo */
function insigniaVerificado(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.font = `700 30px ${FUENTE}`;
  const txt = 'Verificado';
  const w = ctx.measureText(txt).width + 100;
  ctx.beginPath();
  ctx.roundRect(x - w, y, w, 64, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - w + 38, y + 32, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#1D9BF0';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w + 30, y + 32);
  ctx.lineTo(x - w + 36, y + 38);
  ctx.lineTo(x - w + 47, y + 26);
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.textAlign = 'left';
  ctx.fillText(txt, x - w + 64, y + 43);
}

/** Marcador de ubicación simple */
function pin(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 13, Math.PI, 0);
  ctx.lineTo(x, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

export async function dibujarHistoria(d: DatosHistoria): Promise<HTMLCanvasElement> {
  try {
    await Promise.all([
      document.fonts.load(`800 72px "Plus Jakarta Sans"`),
      document.fonts.load(`700 40px "Plus Jakarta Sans"`),
      document.fonts.load(`500 40px "Plus Jakarta Sans"`),
    ]);
  } catch {
    /* sin fuentes: usa la del sistema */
  }
  const fotos = (await Promise.all(d.fotos.slice(0, 3).map(cargar))).filter((f): f is HTMLImageElement => f !== null);

  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  const fondo = d.fondo ?? 'foto';
  const oscuro = fondo === 'azul' || fondo === 'foto';
  const TXT = oscuro ? '#FFFFFF' : NAVY;
  const SUB = oscuro ? CLARO : '#4B5368';
  if (fondo === 'claro') {
    ctx.fillStyle = '#F4F5F7';
    ctx.fillRect(0, 0, W, H);
  } else if (fondo === 'naranja') {
    ctx.fillStyle = NARANJA;
    ctx.fillRect(0, 0, W, H);
  } else if (fondo === 'foto' && fotos[0]) {
    // La portada de fondo, desenfocada y oscurecida
    ctx.filter = 'blur(40px)';
    const f = fotos[0];
    const esc = Math.max(W / f.width, H / f.height) * 1.15;
    ctx.drawImage(f, (W - f.width * esc) / 2, (H - f.height * esc) / 2, f.width * esc, f.height * esc);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(21,30,68,0.72)';
    ctx.fillRect(0, 0, W, H);
  } else {
    // Azul con un brillo naranja suave arriba
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, W, H);
    const brillo = ctx.createRadialGradient(W * 0.85, 80, 0, W * 0.85, 80, 900);
    brillo.addColorStop(0, 'rgba(255,122,26,0.35)');
    brillo.addColorStop(1, 'rgba(255,122,26,0)');
    ctx.fillStyle = brillo;
    ctx.fillRect(0, 0, W, H);
  }

  // Marca
  ctx.textAlign = 'left';
  ctx.font = `800 52px ${FUENTE}`;
  const wT = ctx.measureText('Tucu').width;
  ctx.fillStyle = TXT;
  ctx.fillText('Tucu', 60, 200);
  ctx.fillStyle = fondo === 'naranja' ? '#FFFFFF' : NARANJA;
  ctx.fillText('Oficios', 60 + wT, 200);

  // Fotos
  const X = 60;
  const ANCHO = W - 120;
  let y = 250; // arriba y abajo dejamos lugar para los controles de las historias
  const vertical = (f: HTMLImageElement) => f.width / f.height < 0.8;
  const columnas = fotos.length >= 2 && vertical(fotos[0]);
  if (columnas) {
    // Fotos verticales (por ejemplo flyers): la principal alta a la izquierda y las otras en columna
    const wGrande = 600;
    const wCol = ANCHO - wGrande - 20;
    fotoCover(ctx, fotos[0], X, y, wGrande, 960, 36);
    if (fotos.length >= 3) {
      fotoCover(ctx, fotos[1], X + wGrande + 20, y, wCol, 470, 28);
      fotoCover(ctx, fotos[2], X + wGrande + 20, y + 490, wCol, 470, 28);
    } else {
      fotoCover(ctx, fotos[1], X + wGrande + 20, y, wCol, 960, 28);
    }
    y += 960;
  } else if (fotos.length >= 3) {
    fotoCover(ctx, fotos[0], X, y, ANCHO, 660, 36);
    const w2 = (ANCHO - 20) / 2;
    fotoCover(ctx, fotos[1], X, y + 680, w2, 280, 28);
    fotoCover(ctx, fotos[2], X + w2 + 20, y + 680, w2, 280, 28);
    y += 960;
  } else if (fotos.length === 2) {
    fotoCover(ctx, fotos[0], X, y, ANCHO, 660, 36);
    fotoCover(ctx, fotos[1], X, y + 680, ANCHO, 280, 28);
    y += 960;
  } else if (fotos.length === 1) {
    fotoCover(ctx, fotos[0], X, y, ANCHO, 960, 36);
    y += 960;
  } else {
    ctx.beginPath();
    ctx.roundRect(X, y, ANCHO, 960, 36);
    ctx.fillStyle = NAVY_OSC;
    ctx.fill();
    y += 960;
  }
  if (d.verificado) insigniaVerificado(ctx, X + (columnas ? 600 : ANCHO) - 24, 274);

  // Datos
  y += 70;
  ctx.textAlign = 'left';
  ctx.font = `700 30px ${FUENTE}`;
  const cat = d.categoria;
  const wc = ctx.measureText(cat).width + 48;
  ctx.beginPath();
  ctx.roundRect(X, y, wc, 56, 28);
  ctx.fillStyle = oscuro ? 'rgba(255,122,26,0.18)' : fondo === 'naranja' ? 'rgba(30,42,90,0.12)' : '#FDE7D3';
  ctx.fill();
  ctx.fillStyle = oscuro ? '#FFB27A' : fondo === 'naranja' ? NAVY : '#9A3412';
  ctx.fillText(cat, X + 24, y + 39);

  y += 130;
  ctx.fillStyle = TXT;
  ctx.fillText(ajustar(ctx, d.nombre, 800, 76, 48, ANCHO), X, y);
  y += 64;
  ctx.fillStyle = fondo === 'naranja' ? NAVY : SUB;
  ctx.fillText(ajustar(ctx, d.titulo, 500, 40, 30, ANCHO), X, y);
  y += 62;
  pin(ctx, X + 13, y - 22, fondo === 'naranja' ? NAVY : NARANJA);
  ctx.fillStyle = fondo === 'naranja' ? NAVY : SUB;
  ctx.fillText(ajustar(ctx, d.zona, 500, 36, 28, ANCHO - 50), X + 44, y);

  // Llamado a la acción
  const by = H - 340;
  ctx.beginPath();
  ctx.roundRect(X, by, ANCHO, 170, 40);
  ctx.fillStyle = fondo === 'naranja' ? NAVY : NARANJA;
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = fondo === 'naranja' ? '#FFFFFF' : NAVY;
  ctx.font = `800 42px ${FUENTE}`;
  ctx.fillText('Pedí presupuesto por WhatsApp', W / 2, by + 72);
  ctx.fillText(ajustar(ctx, `${SITIO}/${d.alias}`, 600, 36, 26, ANCHO - 80), W / 2, by + 126);

  return c;
}
