import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2 } from 'lucide-react';
import { Job, CATEGORIES_CONFIG, Category, ZONES } from '../types';
import { updateJob, uploadJobImage, removeImages, normalizeWhatsapp, formatWhatsappForInput } from '../services/jobs';
import PhotoPicker, { PhotoItem } from './PhotoPicker';
import { useToast } from './Toast';

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  isAdmin: boolean;
  userId: string | undefined;
  onSaved: () => void;
}

const EditJobModal = ({ isOpen, onClose, job, isAdmin, userId, onSaved }: EditJobModalProps) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES_CONFIG[0].id);
  const [zone, setZone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [profName, setProfName] = useState('');
  const [description, setDescription] = useState('');
  const [estado, setEstado] = useState<Job['estado']>('pendiente');
  const [verificado, setVerificado] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sections = Array.from(new Set(CATEGORIES_CONFIG.map(c => c.section)));

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setCategory(job.category as Category);
      setZone(job.zone);
      setWhatsapp(formatWhatsappForInput(job.whatsapp || ''));
      setProfName(job.professionalName);
      setDescription(job.description || '');
      setEstado(job.estado);
      setVerificado(job.verificado);
      setPhotos(job.photoPaths.map((path, i) => ({ key: path, path, url: job.photoUrls[i] })));
      setErrors({});
    }
  }, [job]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim() || title.length < 5) newErrors.title = 'Requerido (min 5)';
    if (!zone.trim()) newErrors.zone = 'Requerido';
    if (!profName.trim()) newErrors.profName = 'Requerido';
    if (!description.trim() || description.trim().length < 10) newErrors.description = 'Mínimo 10 caracteres';
    if (!normalizeWhatsapp(whatsapp)) newErrors.whatsapp = 'Ej: 381 412-3456';
    if (photos.length === 0) newErrors.image = 'Dejá al menos una foto.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !userId || !validate()) return;

    setIsSubmitting(true);

    const uploaded: string[] = [];
    let saved = false;
    try {
      // Subimos las fotos nuevas y armamos la lista final (la primera es la portada)
      const finalPaths: string[] = [];
      for (const photo of photos) {
        if (photo.path) {
          finalPaths.push(photo.path);
        } else if (photo.file) {
          const path = await uploadJobImage(userId, photo.file);
          uploaded.push(path);
          finalPaths.push(path);
        }
      }

      await updateJob(
        job.id,
        {
          title,
          category,
          zone,
          professionalName: profName,
          whatsapp: normalizeWhatsapp(whatsapp)!,
          description,
        },
        finalPaths,
        isAdmin ? { estado, verificado } : undefined
      );
      saved = true;

      // Borramos del storage las fotos que se quitaron
      await removeImages(job.photoPaths.filter(p => !finalPaths.includes(p)));

      onSaved();
      onClose();
      toast(isAdmin ? 'Cambios guardados' : 'Cambios guardados. Vuelve a revisión.');
    } catch (error) {
      if (!saved) await removeImages(uploaded);
      setErrors({ submit: error instanceof Error ? error.message : 'Error al guardar.' });
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
            className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Editar publicación</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Fotos</label>
                  <PhotoPicker
                    items={photos}
                    onChange={(items) => { setPhotos(items); setErrors(prev => ({ ...prev, image: '' })); }}
                    error={errors.image}
                    onError={(message) => setErrors(prev => ({ ...prev, image: message }))}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-sm font-medium text-gray-700">Título</label>
                    {errors.title && <span className="text-xs font-medium text-red-600">{errors.title}</span>}
                  </div>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full bg-white border rounded-lg py-3 px-4 outline-none transition-colors ${
                      errors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full bg-white border border-gray-300 focus:border-gray-900 rounded-lg py-3 px-3 outline-none transition-colors"
                    >
                      {!CATEGORIES_CONFIG.some(c => c.id === category) && <option value={category}>{category} (anterior)</option>}
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
                      <label className="text-sm font-medium text-gray-700">Zona</label>
                      {errors.zone && <span className="text-xs font-medium text-red-600">{errors.zone}</span>}
                    </div>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className={`w-full bg-white border rounded-lg py-3 px-3 outline-none transition-colors ${
                        errors.zone ? 'border-red-300' : 'border-gray-300 focus:border-gray-900'
                      }`}
                    >
                      {/* Publicaciones viejas pueden tener una zona escrita a mano */}
                      {zone && !ZONES.includes(zone) && <option value={zone}>{zone} (anterior)</option>}
                      {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                    {errors.profName && <span className="text-xs font-medium text-red-600">{errors.profName}</span>}
                  </div>
                  <input
                    required
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className={`w-full bg-white border rounded-lg py-3 px-4 outline-none transition-colors ${
                      errors.profName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-sm font-medium text-gray-700">WhatsApp</label>
                    {errors.whatsapp && <span className="text-xs font-medium text-red-600">{errors.whatsapp}</span>}
                  </div>
                  <input
                    required
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className={`w-full bg-white border rounded-lg py-3 px-4 outline-none transition-colors ${
                      errors.whatsapp ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                    }`}
                  />
                </div>

                {isAdmin ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Estado</label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as Job['estado'])}
                      className={`w-full border rounded-lg py-3 px-3 outline-none font-medium transition-colors ${
                        estado === 'aprobado' ? 'bg-green-50 border-green-200 text-green-700' : 
                        estado === 'rechazado' ? 'bg-red-50 border-red-200 text-red-700' : 
                        'bg-orange-50 border-orange-200 text-orange-700'
                      }`}
                    >
                      <option value="pendiente">En revisión</option>
                      <option value="aprobado">Aprobada (visible)</option>
                      <option value="rechazado">Rechazada (oculta)</option>
                    </select>
                    <label className="mt-3 flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verificado}
                        onChange={(e) => setVerificado(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-gray-900"
                      />
                      <span className="text-sm">
                        <span className="font-medium text-gray-900">Profesional verificado</span>
                        <span className="block text-gray-500">Marcalo solo si comprobaste que el número y el trabajo son reales.</span>
                      </span>
                    </label>
                  </div>
                ) : (
                  <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-4 py-3">
                    Al guardar cambios, tu publicación vuelve a revisión antes de mostrarse.
                  </p>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                    {errors.description && <span className="text-xs font-medium text-red-600">{errors.description}</span>}
                  </div>
                  <textarea
                    placeholder="Descripción del oficio..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-gray-300 focus:border-gray-900 rounded-lg py-3 px-4 outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {errors.submit && <p className="text-red-600 text-sm font-medium text-center">{errors.submit}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-brand-primary hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
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
