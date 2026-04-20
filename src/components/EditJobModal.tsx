import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2 } from 'lucide-react';
import { Job, CATEGORIES_CONFIG, Category } from '../types';
import { CONFIG } from '../config';

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

const EditJobModal = ({ isOpen, onClose, job }: EditJobModalProps) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES_CONFIG[0].id);
  const [zone, setZone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [profName, setProfName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [estado, setEstado] = useState<Job['estado']>('pendiente');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sections = Array.from(new Set(CATEGORIES_CONFIG.map(c => c.section)));

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setCategory(job.category as Category);
      setZone(job.zone);
      setWhatsapp(String(job.whatsapp || ''));
      setProfName(job.professionalName);
      setEmail(job.email || '');
      setDescription(job.description || '');
      setEstado(job.estado);
      setErrors({});
    }
  }, [job]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim() || title.length < 5) newErrors.title = 'Requerido (min 5)';
    if (!zone.trim()) newErrors.zone = 'Requerido';
    if (!profName.trim()) newErrors.profName = 'Requerido';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email inválido';
    // Asegurarse de que whatsapp sea string antes de usar replace
    const phoneStr = String(whatsapp || '');
    const phoneClean = phoneStr.replace(/\D/g, '');
    if (phoneClean.length < 6) newErrors.whatsapp = 'Mínimo 6 dígitos';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !validate()) return;

    setIsSubmitting(true);

    try {
      const scriptUrl = CONFIG.GOOGLE_SCRIPT_URL;
      if (!scriptUrl) throw new Error('GAS URL missing');

      await fetch(`${scriptUrl}?action=update`, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: job.id,
          title,
          category,
          zone,
          whatsapp,
          email,
          professionalName: profName,
          description,
          estado
        })
      });
      
      // Simular un pequeño delay para que GAS procese antes de cerrar
      setTimeout(() => {
        onClose();
        window.location.reload(); // Recargar para ver cambios
      }, 1000);
    } catch (error) {
      console.error(error);
      setErrors({ submit: 'Error al guardar.' });
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
              <h2 className="text-xl font-black text-brand-dark transition-all">Editar Publicación</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Título</label>
                    {errors.title && <span className="text-[9px] font-black text-red-500 uppercase">{errors.title}</span>}
                  </div>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                      errors.title ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold appearance-none transition-all"
                    >
                      {sections.map(section => (
                        <optgroup key={section} label={section}>
                          {CATEGORIES_CONFIG.filter(c => c.section === section).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Zona</label>
                      {errors.zone && <span className="text-[9px] font-black text-red-500 uppercase">{errors.zone}</span>}
                    </div>
                    <input
                      required
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                        errors.zone ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre</label>
                    {errors.profName && <span className="text-[9px] font-black text-red-500 uppercase">{errors.profName}</span>}
                  </div>
                  <input
                    required
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                      errors.profName ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">WhatsApp</label>
                      {errors.whatsapp && <span className="text-[9px] font-black text-red-500 uppercase">{errors.whatsapp}</span>}
                    </div>
                    <input
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                        errors.whatsapp ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                      {errors.email && <span className="text-[9px] font-black text-red-500 uppercase">{errors.email}</span>}
                    </div>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                        errors.email ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Estado de Publicación</label>
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

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Descripción</label>
                  <textarea
                    placeholder="Descripción del oficio..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all resize-none"
                  />
                </div>
              </div>

              {errors.submit && <p className="text-red-500 text-xs font-bold text-center">{errors.submit}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-brand-primary hover:bg-orange-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
