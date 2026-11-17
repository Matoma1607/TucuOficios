import { motion } from 'motion/react';
import { ArrowLeft, Shield, Eye, Lock, FileText, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-brand-primary/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            to="/" 
            className="group flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold tracking-tight text-gray-900" translate="no">Tucu<span className="text-brand-strong">Oficios</span></span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
        <motion.header 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
            <Shield className="w-3 h-3" />
            Compromiso de Privacidad
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Transparencia <br />y Seguridad.
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
            En TucuOficios conectamos personas. No vendemos datos ni recopilamos información sensible.
          </p>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-16"
        >
          {/* Simple Grid sections */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-brand-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">¿Qué datos recopilamos?</h2>
            </div>
            <div className="text-gray-600 leading-relaxed">
              <p>Al publicar un oficio, solo solicitamos la información necesaria para que tus clientes te encuentren:</p>
              <ul className="mt-4 space-y-2 list-disc list-inside">
                <li>Nombre o nombre profesional.</li>
                <li>Zona de trabajo (San Miguel de Tucumán, Yerba Buena, etc).</li>
                <li>WhatsApp de contacto.</li>
                <li>Categoría del oficio y descripción del servicio.</li>
                <li>Imagen referencial del trabajo.</li>
                <li>Los datos básicos de tu cuenta de Google (nombre, email y foto de perfil), solo para identificarte. Tu email nunca se muestra en la página.</li>
              </ul>
              <p className="mt-4 px-4 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm italic">
                No recopilamos contraseñas, documentos de identidad ni información bancaria.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Eye className="w-4 h-4 text-brand-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Uso y moderación</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Tu anuncio pasa por moderación antes de ser visible, y también cada vez que lo editás. Una vez aprobado, cualquier usuario de la web podrá ver tu nombre, tu zona y el botón de contacto. Podés editar o borrar tus publicaciones cuando quieras entrando con la misma cuenta de Google. Los datos se guardan en Supabase, un proveedor de bases de datos.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-brand-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">WhatsApp y Cookies</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Al hacer clic en el botón de WhatsApp, el sitio redirige a la aplicación oficial de Meta. Utilizamos cookies mínimas para que la web cargue más rápido y para fines estadísticos anónimos.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-brand-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Responsabilidad</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              TucuOficios es un nexo gratuito. No intervenimos en las transacciones de pago ni en la ejecución de los trabajos. La calidad y cumplimiento del servicio es responsabilidad exclusiva del profesional.
            </p>
          </section>

          <footer className="pt-16 border-t border-gray-100 flex flex-col items-center gap-6">
            <Link 
              to="/" 
              className="bg-brand-strong hover:bg-brand-strong-hover text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            >
              Entendido, volver al inicio
            </Link>
            <div className="text-center text-xs text-gray-400">
              Última actualización: noviembre de 2026 · Tucumán, Argentina
            </div>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}
