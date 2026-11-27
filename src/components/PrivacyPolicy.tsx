import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, Eye, Lock, FileText, Smartphone, BarChart3, Server, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const WA_OFICIAL = 'https://wa.me/5493813217398';

function Seccion({ icono, titulo, children }: { icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-brand-primary">{icono}</div>
        <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
      </div>
      <div className="text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-brand-primary/10">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver
          </Link>
          <span className="text-lg font-extrabold tracking-tight text-gray-900" translate="no">Tucu<span className="text-brand-strong">Oficios</span></span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
            <Shield className="w-3 h-3" />
            Política de privacidad
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Qué datos usamos <br />y para qué.
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
            En TucuOficios conectamos personas. Pedimos lo justo para que te encuentren, no vendemos datos y no mostramos publicidad.
          </p>
          <p className="text-sm text-gray-500">
            Las reglas para publicar están en los <Link to="/terminos" className="underline text-gray-900">Términos de uso</Link>.
          </p>
        </motion.header>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-16">
          <Seccion icono={<FileText className="w-4 h-4" />} titulo="¿Qué datos pedimos al publicar?">
            <p>Solo lo necesario para que tus clientes te encuentren y te escriban:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Tu nombre y, si querés, el nombre de tu emprendimiento o negocio.</li>
              <li>Qué ofrecés, el rubro, la descripción y la zona donde trabajás.</li>
              <li>Tu WhatsApp de contacto y, si querés, tu usuario de Instagram.</li>
              <li>Hasta 3 fotos de tus trabajos.</li>
              <li>Los datos básicos de tu cuenta de Google (nombre, email y foto), solo para identificarte. Tu email nunca se muestra en el sitio.</li>
            </ul>
            <p className="px-4 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
              No pedimos contraseñas, documentos ni datos bancarios. Para publicar tenés que ser mayor de 18 años.
            </p>
          </Seccion>

          <Seccion icono={<Eye className="w-4 h-4" />} titulo="Qué se ve y cómo lo moderamos">
            <p>
              Cada publicación se revisa antes de mostrarse, y también cada vez que se edita. Una vez aprobada, cualquiera puede ver tu nombre
              (o el de tu negocio), lo que ofrecés, tu zona, tus fotos, tu Instagram si lo pusiste y el botón para escribirte por WhatsApp.
              También tiene un link propio (por ejemplo, tucuoficios.net.ar/tu-nombre) y puede aparecer en buscadores como Google.
            </p>
            <p>
              Podés editar o borrar tus publicaciones cuando quieras entrando con la misma cuenta de Google. Si nosotros armamos la
              publicación por vos, te mandamos un link de un solo uso para que pase a tu cuenta.
            </p>
          </Seccion>

          <Seccion icono={<BarChart3 className="w-4 h-4" />} titulo="Estadísticas, ubicación y lo que queda en tu dispositivo">
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <b className="text-gray-800">Estadísticas propias:</b> contamos visitas al sitio, vistas de cada perfil y toques en el botón de
                WhatsApp, para mostrarle a cada profesional cómo le va. Usamos un número al azar guardado en tu navegador, sin tu nombre ni tu IP.
                Estos datos se borran a los 90 días.
              </li>
              <li>
                <b className="text-gray-800">Búsquedas sin resultado:</b> si buscás algo y no aparece nadie, guardamos solo el rubro (o la
                palabra, sin números) y la zona, para saber qué oficios faltan. Se borran a los 6 meses.
              </li>
              <li>
                <b className="text-gray-800">Chat de ayuda:</b> no guardamos tus conversaciones.
              </li>
              <li>
                <b className="text-gray-800">Cerca tuyo:</b> si nos das permiso, tu ubicación se usa solo en tu celular para ordenar los resultados.
                No se envía ni se guarda.
              </li>
              <li>
                <b className="text-gray-800">En tu navegador</b> quedan tu sesión, tus guardados y algunas preferencias (como el aviso de cookies).
                No usamos cookies de publicidad ni de seguimiento.
              </li>
            </ul>
          </Seccion>

          <Seccion icono={<Smartphone className="w-4 h-4" />} titulo="WhatsApp">
            <p>
              Al tocar el botón de WhatsApp se abre la aplicación de WhatsApp (de Meta) con un mensaje listo. Lo que hablés ahí queda entre vos y el
              profesional.
            </p>
            <p>
              Si publicás, podemos escribirte al WhatsApp que cargaste, desde nuestro número oficial (
              <a href={WA_OFICIAL} target="_blank" rel="noopener noreferrer" className="underline text-gray-900">381 321-7398</a>
              ), solo por temas de tu publicación: la bienvenida, cuando se aprueba, para contarte cuántas visitas tuvo o para entregártela.
              No usamos tu número para publicidad ni lo compartimos. Si no querés que te escribamos, avisanos por ese mismo chat.
            </p>
          </Seccion>

          <Seccion icono={<Server className="w-4 h-4" />} titulo="Dónde se guardan los datos">
            <p>Usamos servicios de terceros que cumplen estándares de seguridad, y algunos tienen sus servidores fuera de Argentina:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><b className="text-gray-800">Supabase:</b> base de datos y fotos.</li>
              <li><b className="text-gray-800">Netlify:</b> aloja el sitio.</li>
              <li><b className="text-gray-800">Google:</b> el inicio de sesión.</li>
              <li><b className="text-gray-800">Cloudinary:</b> algunas fotos.</li>
              <li><b className="text-gray-800">Telegram:</b> avisos internos al administrador cuando hay publicaciones nuevas o cambios.</li>
            </ul>
            <p>La conexión al sitio va cifrada (HTTPS) y cada cuenta solo puede modificar sus propias publicaciones.</p>
          </Seccion>

          <Seccion icono={<UserCheck className="w-4 h-4" />} titulo="Tus derechos">
            <p className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
              <b className="text-gray-800">Responsable de los datos:</b> TucuOficios, a cargo de Matías Salazar · Tucumán, Argentina.
            </p>
            <p>
              Según la Ley 25.326 de Protección de Datos Personales, podés pedir ver, corregir o borrar tus datos. Lo más rápido es editarlos o
              borrarlos vos desde "Mis publicaciones". Para cualquier otro pedido, como borrar tu cuenta, escribinos al{' '}
              <a href={WA_OFICIAL} target="_blank" rel="noopener noreferrer" className="underline text-gray-900">381 321-7398</a> o a{' '}
              <a href="mailto:contacto@tucuoficios.net.ar" className="underline text-gray-900">contacto@tucuoficios.net.ar</a> y lo resolvemos
              dentro de los plazos de la ley: 10 días corridos para darte acceso y 5 días hábiles para corregir o borrar.
            </p>
            <p className="text-sm">
              La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las denuncias y reclamos por
              incumplimiento de las normas de protección de datos personales.
            </p>
          </Seccion>

          <Seccion icono={<Lock className="w-4 h-4" />} titulo="Responsabilidad">
            <p>
              TucuOficios es un nexo gratuito entre quienes ofrecen un servicio y quienes lo necesitan. No intervenimos en los pagos ni en los
              trabajos: la calidad y el cumplimiento son responsabilidad de cada profesional. Revisamos las publicaciones, pero no podemos
              garantizar la información que cada uno carga.
            </p>
          </Seccion>

          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
            <Link to="/" className="inline-flex justify-center items-center px-5 py-3 rounded-xl bg-brand-dark text-white font-semibold hover:opacity-95">
              Entendido, volver al inicio
            </Link>
            <div className="text-xs text-gray-500">Última actualización: noviembre de 2026 · Tucumán, Argentina</div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
