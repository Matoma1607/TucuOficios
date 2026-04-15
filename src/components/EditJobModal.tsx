import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Job, CATEGORIES, Category } from '../types';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setCategory(job.category as Category);
      setZone(job.zone);
      setWhatsapp(job.whatsapp);
      setProfName(job.professionalName);
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) throw new Error('GAS URL missing');

      await fetch(`${scriptUrl}?action=update`, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: job.id,
          title,
          category,
          zone,
          whatsapp,
          professionalName: profName,
        })
      });
      
      alert('Cambios guardados (pueden tardar un minuto en reflejarse)');
      onClose();
    } catch (error: any) {
      console.error('Error updating job:', error);
      setErrorMessage('Error al actualizar el trabajo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && job && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Editar Trabajo</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Título</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Zona</label>
                  <input
                    required
                    type="text"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Nombre Profesional</label>
                <input
                  required
                  type="text"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">WhatsApp</label>
                <input
                  required
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Guardar Cambios
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
