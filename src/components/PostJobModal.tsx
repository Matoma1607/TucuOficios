import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Camera, Check, ChevronRight, Loader2 } from 'lucide-react';
import { CATEGORIES_CONFIG, Category } from '../types';
import { CONFIG } from '../config';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PostJobModal = ({ isOpen, onClose }: PostJobModalProps) => {
  // Form state with localStorage persistence
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('tucu_form_draft');
    return saved ? JSON.parse(saved) : {
      title: '',
      category: CATEGORIES_CONFIG[0].id,
      zone: '',
      professionalName: '',
      whatsapp: '',
      description: ''
    };
  });

  const sections = Array.from(new Set(CATEGORIES_CONFIG.map(c => c.section)));

  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('tucu_form_draft', JSON.stringify(formData));
  }, [formData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadToCloudinary = async (base64Image: string) => {
    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Error al subir imagen');
    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = '';
      if (image) {
        imageUrl = await uploadToCloudinary(image);
      }

      const payload = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        imageUrl,
        estado: 'pendiente',
        createdAt: new Date().toISOString(),
      };

      await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=insert`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });

      // Since mode is no-cors, we won't get a proper response object, 
      // but we assume success if no exception is thrown.
      setSuccess(true);
      localStorage.removeItem('tucu_form_draft');
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          title: '',
          category: CATEGORIES_CONFIG[0].id,
          zone: '',
          professionalName: '',
          whatsapp: '',
          description: ''
        });
        setImage(null);
      }, 2000);

    } catch (err) {
      setError('Hubo un problema al enviar los datos. Reintentá.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <h2 className="text-xl font-black text-brand-dark">Publicar Oficio</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-6 max-h-[85vh] overflow-y-auto no-scrollbar">
            {success ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-2">¡Enviado con éxito!</h3>
                <p className="text-gray-500">Tu oficio está en revisión y aparecerá pronto.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden" 
                    id="image-upload" 
                  />
                  <label 
                    htmlFor="image-upload"
                    className="block aspect-video w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl overflow-hidden cursor-pointer hover:border-brand-primary transition-colors relative group"
                  >
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <Camera className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">Subir Foto de tu Trabajo</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">¿Qué hacés?</label>
                    <input 
                      required
                      placeholder="Ej: Plomero Matriculado"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Categoría</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as Category})}
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
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Zona</label>
                      <input 
                        required
                        placeholder="Ej: Yerba Buena"
                        value={formData.zone}
                        onChange={e => setFormData({...formData, zone: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Tu Nombre</label>
                    <input 
                      required
                      placeholder="Nombre y Apellido"
                      value={formData.professionalName}
                      onChange={e => setFormData({...formData, professionalName: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">WhatsApp</label>
                    <input 
                      required
                      type="tel"
                      placeholder="381 123 4567"
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Descripción (Opcional)</label>
                    <textarea 
                      placeholder="Contanos un poco más sobre lo que hacés..."
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all resize-none"
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>Publicar Ahora</span>
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PostJobModal;
