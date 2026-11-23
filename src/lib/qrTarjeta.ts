import qrcode from 'qrcode-generator';
import { SITIO } from './alias';

// Tarjeta con el QR del perfil, lista para imprimir o subir a una historia (1080 x 1350).

const NAVY = '#1E2A5A';
const NARANJA = '#FF7A1A';
const GRIS = '#4B5368';
const BORDE = '#E4E7EC';
const FUENTE = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';

interface Datos {
  alias: string;
  nombre: string;
  titulo: string;
}

/** Achica la letra hasta que entre en el ancho (y si igual no entra, corta con "…") */
function textoQueEntre(ctx: CanvasRenderingContext2D, texto: string, peso: number, tam: number, min: number, ancho: number) {
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

function rectRedondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export async function dibujarTarjetaQR({ alias, nombre, titulo }: Datos): Promise<HTMLCanvasElement> {
  // Que la tipografía del sitio esté cargada antes de dibujar
  try {
    await Promise.all([
      document.fonts.load(`800 60px "Plus Jakarta Sans"`),
      document.fonts.load(`600 40px "Plus Jakarta Sans"`),
      document.fonts.load(`500 36px "Plus Jakarta Sans"`),
    ]);
  } catch {
    /* sin fuentes: usa la del sistema */
  }

  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Marca
  ctx.font = `800 64px ${FUENTE}`;
  const wTucu = ctx.measureText('Tucu').width;
  const wTodo = ctx.measureText('TucuOficios').width;
  ctx.textAlign = 'left';
  ctx.fillStyle = NAVY;
  ctx.fillText('Tucu', (W - wTodo) / 2, 150);
  ctx.fillStyle = NARANJA;
  ctx.fillText('Oficios', (W - wTodo) / 2 + wTucu, 150);
  ctx.textAlign = 'center';

  ctx.fillStyle = GRIS;
  ctx.font = `500 36px ${FUENTE}`;
  ctx.fillText('Escaneá y mirá mis trabajos', W / 2, 232);

  // QR
  const url = `https://${SITIO}/${alias}`;
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const caja = 640;
  const cx = (W - caja) / 2;
  const cy = 292;
  rectRedondo(ctx, cx, cy, caja, caja, 40);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = BORDE;
  ctx.stroke();

  const lado = Math.floor(540 / n) * n; // módulos de tamaño entero: bordes nítidos
  const m = lado / n;
  const qx = Math.round((W - lado) / 2);
  const qy = Math.round(cy + (caja - lado) / 2);
  ctx.fillStyle = NAVY;
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (qr.isDark(r, col)) ctx.fillRect(qx + col * m, qy + r * m, m, m);
    }
  }

  // Nombre y oficio
  ctx.fillStyle = NAVY;
  ctx.fillText(textoQueEntre(ctx, nombre, 800, 60, 40, 920), W / 2, 1036);
  ctx.fillStyle = GRIS;
  ctx.fillText(textoQueEntre(ctx, titulo, 500, 38, 30, 920), W / 2, 1094);

  // Link
  const link = textoQueEntre(ctx, `${SITIO}/${alias}`, 700, 38, 28, 860);
  const wLink = ctx.measureText(link).width;
  const pw = wLink + 88;
  rectRedondo(ctx, (W - pw) / 2, 1160, pw, 84, 42);
  ctx.fillStyle = NARANJA;
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.fillText(link, W / 2, 1215);

  return c;
}

export const aBlob = (c: HTMLCanvasElement) =>
  new Promise<Blob>((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error('sin imagen'))), 'image/png'));
