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
            className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver
          </Link>
          <div className="flex items-center gap-1.5 grayscale opacity-80">
            <div className="w-5 h-5 bg-brand-primary rounded flex items-center justify-center">
              <span className="text-white font-black text-[10px]">T</span>
            </div>
            <span className="text-sm font-black tracking-tighter">TucuOficios</span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
        <motion.header 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
            <Shield className="w-3 h-3" />
            Compromiso de Privacidad
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-dark tracking-tight leading-none">
            Transparencia <br />y Seguridad.
          </h1>
          <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-lg">
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
              <h2 className="text-lg font-black text-gray-800">¿Qué datos recopilamos?</h2>
            </div>
            <div className="text-gray-500 leading-relaxed font-medium">
              <p>Al publicar un oficio, solo solicitamos la información necesaria para que tus clientes te encuentren:</p>
              <ul className="mt-4 space-y-2 list-disc list-inside">
                <li>Nombre o nombre profesional.</li>
                <li>Zona de trabajo (San Miguel de Tucumán, Yerba Buena, etc).</li>
                <li>WhatsApp de contacto.</li>
                <li>Categoría del oficio y descripción del servicio.</li>
                <li>Imagen referencial del trabajo.</li>
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
              <h2 className="text-lg font-black text-gray-800">Uso y Notificaciones</h2>
            </div>
            <p className="text-gray-500 leading-relaxed font-medium">
              Tu anuncio será enviado a moderación antes de ser visible. El administrador del sitio recibirá una notificación por correo electrónico con los detalles del posteo para proceder a su aprobación. Una vez aprobado, cualquier usuario de la web podrá ver tu nombre y botón de contacto para contratarte.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-brand-primary" />
              </div>
              <h2 className="text-lg font-black text-gray-800">WhatsApp y Cookies</h2>
            </div>
            <p className="text-gray-500 leading-relaxed font-medium">
              Al hacer clic en el botón de WhatsApp, el sitio redirige a la aplicación oficial de Meta. Utilizamos cookies mínimas para que la web cargue más rápido y para fines estadísticos anónimos.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-brand-primary" />
              </div>
              <h2 className="text-lg font-black text-gray-800">Responsabilidad</h2>
            </div>
            <p className="text-gray-500 leading-relaxed font-medium">
              TucuOficios es un nexo gratuito. No intervenimos en las transacciones de pago ni en la ejecución de los trabajos. La calidad y cumplimiento del servicio es responsabilidad exclusiva del profesional.
            </p>
          </section>

          <footer className="pt-16 border-t border-gray-100 flex flex-col items-center gap-6">
            <Link 
              to="/" 
              className="bg-brand-primary text-white px-8 py-3 rounded-xl font-black text-sm shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              Entendido, volver al inicio
            </Link>
            <div className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-300">
              Última actualización: 17 de Abril, 2026 • Tucumán, Argentina
            </div>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}
