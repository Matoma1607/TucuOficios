import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2 } from 'lucide-react';
import { Job, CATEGORIES, Category } from '../types';
import { CONFIG } from '../config';

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

const EditJobModal = ({ isOpen, onClose, job }: EditJobModalProps) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [zone, setZone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [profName, setProfName] = useState('');
  const [estado, setEstado] = useState<Job['estado']>('pendiente');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setCategory(job.category as Category);
      setZone(job.zone);
      setWhatsapp(job.whatsapp);
      setProfName(job.professionalName);
      setEstado(job.estado);
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setIsSubmitting(true);

    try {
      const scriptUrl = CONFIG.GOOGLE_SCRIPT_URL;
      if (!scriptUrl) throw new Error('GAS URL missing');

      await fetch(`${scriptUrl}?action=update`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          id: job.id,
          title,
          category,
          zone,
          whatsapp,
          professionalName: profName,
          estado
        })
      });
      
      alert('Solicitud enviada.');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && job && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-brand-dark">Editar Publicación</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Título</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold appearance-none transition-all"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Zona</label>
                    <input
                      required
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Nombre</label>
                  <input
                    required
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Estado de Publicación</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as any)}
                    className={`w-full border-2 rounded-2xl py-4 px-5 outline-none font-black appearance-none transition-all ${
                      estado === 'aprobado' ? 'bg-green-50 border-green-200 text-green-700' : 
                      estado === 'rechazado' ? 'bg-red-50 border-red-200 text-red-700' : 
                      'bg-orange-50 border-orange-200 text-orange-700'
                    }`}
                  >
                    <option value="pendiente">En Revisión (Pendiente)</option>
                    <option value="aprobado">Aprobado (Visible)</option>
                    <option value="rechazado">Rechazado (Oculto)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditJobModal;
