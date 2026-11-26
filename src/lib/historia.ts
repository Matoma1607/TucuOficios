import { SITIO } from './alias';

// Imagen vertical (1080 x 1920) para estados de WhatsApp e historias de Instagram,
// armada con las fotos y los datos de la publicación.

const NAVY = '#1E2A5A';
const NARANJA = '#FF7A1A';
const FONDO = '#FAF7F2';
const GRIS = '#6E7488';
const LINEA = '#E7E2D9';
const FUENTE = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';

export interface DatosHistoria {
  alias: string;
  nombre: string;
  titulo: string;
  /** Rubros ya con su nombre visible, el principal primero */
  rubros: string[];
  descripcion: string;
  zona: string;
  verificado: boolean;
  fotos: string[]; // URLs, la portada primero
}

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

/** Tilde dentro de un círculo naranja */
function tilde(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = NARANJA;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = r * 0.26;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y);
  ctx.lineTo(x - r * 0.1, y + r * 0.35);
  ctx.lineTo(x + r * 0.5, y - r * 0.35);
  ctx.stroke();
}

/** Corta el texto en renglones; si sobra, el último termina en "…" */
function renglones(ctx: CanvasRenderingContext2D, texto: string, ancho: number, max: number): string[] {
  const palabras = texto.replace(/\s+/g, ' ').trim().split(' ');
  const out: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && actual) {
      out.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) out.push(actual);
  if (out.length > max) {
    out.length = max;
    let ult = out[max - 1];
    while (ctx.measureText(`${ult}…`).width > ancho && ult.includes(' ')) ult = ult.replace(/\s*\S+$/, '');
    out[max - 1] = `${ult}…`;
  }
  return out;
}

/**
 * Imagen para historias: la foto del trabajo de borde a borde arriba y, abajo, los datos en un fondo crema.
 * Sin botones (en una imagen no se pueden tocar): el espacio de abajo queda libre para el sticker de enlace.
 */
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
  const portada = d.fotos[0] ? await cargar(d.fotos[0]) : null;

  const W = 1080;
  const H = 1920;
  const X = 80;
  const ANCHO = W - 2 * X;
  const FOTO_H = 1000;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = FONDO;
  ctx.fillRect(0, 0, W, H);

  // Foto de borde a borde (si es un flyer muy vertical se ve entera sobre una copia desenfocada)
  if (portada) fotoCover(ctx, portada, 0, 0, W, FOTO_H, 0);
  else {
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, W, FOTO_H);
  }
  // sombra suave arriba para que el logo se lea sobre cualquier foto
  const sombra = ctx.createLinearGradient(0, 0, 0, 300);
  sombra.addColorStop(0, 'rgba(0,0,0,0.35)');
  sombra.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sombra;
  ctx.fillRect(0, 0, W, 300);
  ctx.textAlign = 'left';
  ctx.font = `800 40px ${FUENTE}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('TucuOficios', X, 190);

  // Rubros como texto: el principal en naranja, los demás en gris, separados por puntos
  let y = FOTO_H + 110;
  let x = X;
  d.rubros.slice(0, 4).forEach((r, i) => {
    if (i) {
      if (x + 30 > W - X) return;
      ctx.fillStyle = LINEA;
      ctx.beginPath();
      ctx.arc(x + 14, y - 10, 4, 0, Math.PI * 2);
      ctx.fill();
      x += 30;
    }
    ctx.font = `${i ? 500 : 700} 30px ${FUENTE}`;
    const w = ctx.measureText(r).width;
    if (x + w > W - X) return;
    ctx.fillStyle = i ? GRIS : NARANJA;
    ctx.fillText(r, x, y);
    x += w + 2;
  });

  // Nombre (+ tilde si está verificado)
  y += 104;
  const nombre = ajustar(ctx, d.nombre, 800, 86, 52, ANCHO - (d.verificado ? 70 : 0));
  const tam = Number(/(\d+)px/.exec(ctx.font)?.[1] ?? 86);
  ctx.fillStyle = NAVY;
  ctx.fillText(nombre, X, y);
  if (d.verificado) tilde(ctx, X + ctx.measureText(nombre).width + 38, y - tam * 0.36, 22);

  // Título y descripción
  y += 66;
  ctx.fillStyle = NAVY;
  ctx.fillText(ajustar(ctx, d.titulo, 500, 40, 30, ANCHO), X, y);
  y += 70;
  ctx.font = `500 34px ${FUENTE}`;
  ctx.fillStyle = GRIS;
  renglones(ctx, d.descripcion, ANCHO, 3).forEach((l, i) => ctx.fillText(l, X, y + i * 50));

  // Zona y estado
  y = 1620;
  ctx.fillStyle = LINEA;
  ctx.fillRect(X, y - 62, ANCHO, 2);
  ctx.fillStyle = GRIS;
  ctx.fillText(ajustar(ctx, d.zona, 500, 30, 24, ANCHO - 220), X, y);
  ctx.font = `500 30px ${FUENTE}`;
  ctx.textAlign = 'right';
  ctx.fillText(d.verificado ? 'Verificado' : 'Revisado', W - X, y);

  // Dónde encontrarlo; debajo queda libre para el sticker de enlace
  ctx.textAlign = 'center';
  ctx.font = `500 28px ${FUENTE}`;
  ctx.fillText('Encontrame en', W / 2, 1720);
  ctx.fillStyle = NAVY;
  ctx.fillText(ajustar(ctx, `${SITIO}/${d.alias}`, 700, 36, 24, ANCHO), W / 2, 1770);
  ctx.textAlign = 'left';

  return c;
}
