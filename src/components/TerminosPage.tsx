import { useEffect, type ReactNode } from 'react';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';

const WA_OFICIAL = 'https://wa.me/5493813217398';

function Punto({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
      <div className="text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TerminosPage() {
  useEffect(() => {
    document.title = 'Términos de uso | TucuOficios';
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
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
        <header className="mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
            <ScrollText className="w-3 h-3" />
            Términos de uso
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">Reglas claras para usar TucuOficios.</h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Al usar el sitio o publicar, aceptás estos términos y la{' '}
            <Link to="/privacidad" className="underline text-gray-900">Política de privacidad</Link>.
          </p>
        </header>

        <div className="space-y-12">
          <Punto titulo="1. Qué es TucuOficios">
            <p>
              Un sitio gratuito donde personas de Tucumán publican los servicios u oficios que ofrecen o los productos que venden, para que otros
              los encuentren y les escriban directo por WhatsApp. No cobramos comisiones ni intervenimos en los acuerdos, los pagos ni los trabajos.
            </p>
          </Punto>

          <Punto titulo="2. Quién puede publicar">
            <ul className="space-y-2 list-disc list-inside">
              <li>Personas mayores de 18 años, con una cuenta de Google.</li>
              <li>Solo a tu nombre o al de tu negocio. No se puede publicar a nombre de otra persona sin su permiso.</li>
              <li>Hasta 5 publicaciones por cuenta, con hasta 3 fotos cada una.</li>
            </ul>
          </Punto>

          <Punto titulo="3. Qué no se puede publicar">
            <ul className="space-y-2 list-disc list-inside">
              <li>Servicios o productos ilegales, peligrosos o que requieran una habilitación que no tenés.</li>
              <li>Datos falsos o engañosos: experiencia, matrículas, precios o trabajos que no son tuyos.</li>
              <li>Fotos de otras personas sin su permiso, o fotos que no sean de tus trabajos o productos.</li>
              <li>Contenido ofensivo, discriminatorio, sexual o violento.</li>
              <li>Spam, links a otros sitios o publicaciones repetidas.</li>
            </ul>
          </Punto>

          <Punto titulo="4. Moderación">
            <p>
              Revisamos cada publicación antes de mostrarla y cada vez que se edita. Podemos rechazar, ocultar o borrar una publicación, o suspender
              una cuenta, si no cumple estos términos o si recibimos reclamos fundados. Si es posible, te avisamos por WhatsApp.
            </p>
          </Punto>

          <Punto titulo="5. Responsabilidad">
            <p>
              Cada persona es responsable de lo que publica y del servicio o producto que ofrece. Revisamos las publicaciones, pero no podemos
              garantizar la calidad, el precio ni el cumplimiento de los trabajos. Antes de contratar, consultá, pedí referencias y acordá las
              condiciones directamente.
            </p>
            <p>
              Si tenés un problema con alguien que encontraste acá, o ves una publicación que no cumple estas reglas, avisanos por{' '}
              <a href={WA_OFICIAL} target="_blank" rel="noopener noreferrer" className="underline text-gray-900">WhatsApp al 381 321-7398</a> y la revisamos.
            </p>
          </Punto>

          <Punto titulo="6. Lo que publicás">
            <p>
              Seguís siendo dueño o dueña de tus fotos y textos. Al publicarlos, nos permitís mostrarlos en el sitio y usarlos para difundirlo (por
              ejemplo en nuestro Instagram), siempre vinculados a tu publicación. Si no querés que usemos tu publicación en redes, avisanos.
            </p>
          </Punto>

          <Punto titulo="7. Cambios">
            <p>
              El servicio es gratuito y puede cambiar, pausarse o dejar de funcionar. Si cambiamos estos términos de forma importante, lo avisamos en
              el sitio. Se rigen por las leyes de la República Argentina.
            </p>
          </Punto>

          <Punto titulo="8. Contacto">
            <p>
              Para consultas, reclamos o pedir que bajemos una publicación, escribinos a{' '}
              <a href="mailto:contacto@tucuoficios.net.ar" className="underline text-gray-900">contacto@tucuoficios.net.ar</a> o por WhatsApp al{' '}
              <a href={WA_OFICIAL} target="_blank" rel="noopener noreferrer" className="underline text-gray-900">381 321-7398</a>.
            </p>
          </Punto>

          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
            <Link to="/" className="inline-flex justify-center items-center px-5 py-3 rounded-xl bg-brand-dark text-white font-semibold hover:opacity-95">
              Volver al inicio
            </Link>
            <div className="text-xs text-gray-500">Última actualización: noviembre de 2026 · Tucumán, Argentina</div>
          </div>
        </div>
      </main>
    </div>
  );
}
