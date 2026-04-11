import { motion } from 'motion/react';
import { Home, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-7xl font-black text-gray-900 mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Ups! Página no encontrada</h2>
        <p className="text-gray-500 mb-10 leading-relaxed">
          Parece que el servicio que estás buscando se mudó de zona o nunca existió. 
          No te preocupes, podés volver al inicio para seguir buscando profesionales.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-brand-primary text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          <Home className="w-5 h-5" />
          Volver al Inicio
        </Link>
      </motion.div>

      <div className="absolute bottom-8 text-gray-400 text-sm font-medium">
        TucuOficios • San Miguel de Tucumán
      </div>
    </div>
  );
}
