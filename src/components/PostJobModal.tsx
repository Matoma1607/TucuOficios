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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('tucu_form_draft', JSON.stringify(formData));
  }, [formData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim() || formData.title.length < 5) {
      newErrors.title = 'El título debe tener al menos 5 caracteres.';
    }
    if (!formData.zone.trim()) {
      newErrors.zone = 'La zona es obligatoria.';
    }
    if (!formData.professionalName.trim()) {
      newErrors.professionalName = 'Tu nombre es obligatorio.';
    }
    // WhatsApp validation: numbers only (basic)
    const phoneClean = formData.whatsapp.replace(/\D/g, '');
    if (phoneClean.length < 6) {
      newErrors.whatsapp = 'Ingresá un WhatsApp o teléfono válido.';
    }
    if (!image) {
      newErrors.image = 'Es obligatorio subir una foto de tu trabajo.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({ ...prev, image: 'La imagen es demasiado pesada (máx 5MB).' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setErrors(prev => ({ ...prev, image: '' }));
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
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

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
        setErrors({});
      }, 2000);

    } catch (err) {
      setErrors({ submit: 'Hubo un problema al enviar los datos. Reintentá.' });
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
                <p className="text-gray-500 font-medium">Tu oficio está en revisión y aparecerá pronto.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Foto del Trabajo *</label>
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
                      className={`block h-72 w-full bg-gray-50 border-2 border-dashed rounded-3xl overflow-hidden cursor-pointer hover:border-brand-primary transition-colors relative group ${
                        errors.image ? 'border-red-500 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      {image ? (
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                          <Camera className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-bold">Subí una foto</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.image && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.image}</p>}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">¿Qué hacés? *</label>
                      {errors.title && <span className="text-[9px] font-black text-red-500 uppercase">{errors.title}</span>}
                    </div>
                    <input 
                      required
                      placeholder="Ej: Plomero Matriculado"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                        errors.title ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Categoría *</label>
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
                      <div className="flex justify-between items-center mb-2 ml-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Zona *</label>
                        {errors.zone && <span className="text-[9px] font-black text-red-500 uppercase">Requerido</span>}
                      </div>
                      <input 
                        required
                        placeholder="Ej: Yerba Buena"
                        value={formData.zone}
                        onChange={e => setFormData({...formData, zone: e.target.value})}
                        className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                          errors.zone ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tu Nombre *</label>
                      {errors.professionalName && <span className="text-[9px] font-black text-red-500 uppercase">Requerido</span>}
                    </div>
                    <input 
                      required
                      placeholder="Nombre y Apellido"
                      value={formData.professionalName}
                      onChange={e => setFormData({...formData, professionalName: e.target.value})}
                      className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                        errors.professionalName ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">WhatsApp *</label>
                      {errors.whatsapp && <span className="text-[9px] font-black text-red-500 uppercase">Inválido</span>}
                    </div>
                    <input 
                      required
                      type="tel"
                      placeholder="381 123 4567"
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                        errors.whatsapp ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Descripción (Opcional)</label>
                    <textarea 
                      placeholder="Contanos un poco más sobre lo que hacés..."
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 px-5 outline-none font-bold transition-all resize-none"
                    />
                  </div>
                </div>

                {errors.submit && <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-3 rounded-xl">{errors.submit}</p>}

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-brand-primary text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>Publicar Oficio</span>
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
