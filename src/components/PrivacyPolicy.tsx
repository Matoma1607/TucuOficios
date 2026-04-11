import { motion } from 'motion/react';
import { Shield, Lock, Eye, UserCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FDFDFF]">
      {/* Header simple para volver */}
      <header className="glass-header">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-brand-dark hover:text-brand-primary transition-colors font-bold">
            <ArrowLeft className="w-5 h-5" />
            Volver
          </Link>
          <div className="text-xl font-extrabold tracking-tighter text-brand-dark">
            Tucu<span className="text-brand-primary">Oficios</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-12 rounded-[2.5rem]"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-brand-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-dark tracking-tight">
              Política de Privacidad
            </h1>
          </div>

          <p className="text-lg text-gray-600 mb-12 leading-relaxed">
            En <strong>TucuOficios</strong>, tomamos muy en serio la privacidad de nuestros usuarios. 
            Nos comprometemos a usar y proteger tu información personal con los más altos estándares de seguridad.
          </p>

          <div className="grid gap-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-dark">
                <Eye className="w-5 h-5 text-brand-primary" />
                <h2 className="text-xl font-bold">Uso de la Información</h2>
              </div>
              <p className="text-gray-500 leading-relaxed">
                Utilizamos tu información para procesar pedidos, mejorar nuestros servicios, 
                comunicarnos contigo y personalizar tu experiencia en nuestra plataforma. 
                Esto nos permite conectarte con los mejores profesionales de Tucumán de manera eficiente.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-dark">
                <Lock className="w-5 h-5 text-brand-primary" />
                <h2 className="text-xl font-bold">Cookies</h2>
              </div>
              <p className="text-gray-500 leading-relaxed">
                Utilizamos cookies para mejorar tu experiencia de navegación y analizar el uso de nuestro sitio web. 
                Las cookies nos ayudan a recordar tus preferencias y a entender cómo interactúas con TucuOficios para ofrecerte un mejor servicio.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-dark">
                <UserCheck className="w-5 h-5 text-brand-primary" />
                <h2 className="text-xl font-bold">Tus Derechos y Términos</h2>
              </div>
              <p className="text-gray-500 leading-relaxed">
                Tienes derecho a acceder, modificar o eliminar tu información personal en cualquier momento. 
                Al utilizar nuestra plataforma, aceptas que TucuOficios actúa como un nexo entre profesionales y clientes, 
                y que la responsabilidad de los trabajos realizados recae sobre los profesionales contratados.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-white/20 text-center text-gray-400 text-sm">
            Última actualización: Abril 2026 • San Miguel de Tucumán
          </div>
        </motion.div>
      </main>
    </div>
  );
}
