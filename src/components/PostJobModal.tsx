import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Camera, Check, ChevronRight, Loader2, ImagePlus, PartyPopper } from 'lucide-react';
import { CATEGORIES_CONFIG, Category } from '../types';
import { CONFIG } from '../config';
import { generateWelcomeNote } from '../services/geminiService';

// Servicio de bienvenida con IA
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
      description: '',
      email: ''
    };
  });

  const sections = Array.from(new Set(CATEGORIES_CONFIG.map(c => c.section)));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [welcomeNote, setWelcomeNote] = useState<string | null>(null);
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
    if (!formData.description.trim() || formData.description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres.';
    }
    if (!formData.zone.trim()) {
      newErrors.zone = 'La zona es obligatoria.';
    }
    if (!formData.professionalName.trim()) {
      newErrors.professionalName = 'Tu nombre es obligatorio.';
    }
    // WhatsApp validation: numbers only (basic)
    const phoneStr = String(formData.whatsapp || '');
    const phoneClean = phoneStr.replace(/\D/g, '');
    if (phoneClean.length < 6) {
      newErrors.whatsapp = 'Ingresá un WhatsApp o teléfono válido.';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresá un correo electrónico válido.';
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

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setErrors(prev => ({ ...prev, image: '' }));
      setIsProcessingImage(false);
    };
    reader.onerror = () => {
      setErrors(prev => ({ ...prev, image: 'Error al procesar la imagen.' }));
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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

      // Generar nota de bienvenida con Gemini
      const note = await generateWelcomeNote(formData.professionalName, formData.title);
      setWelcomeNote(note);

      setSuccess(true);
      localStorage.removeItem('tucu_form_draft');
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setWelcomeNote(null);
        setFormData({
          title: '',
          category: CATEGORIES_CONFIG[0].id,
          zone: '',
          professionalName: '',
          whatsapp: '',
          description: '',
          email: ''
        });
        setImage(null);
        setErrors({});
      }, 8000); // Dar más tiempo para leer la nota

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
                className="py-8 px-2 text-center"
              >
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PartyPopper className="w-10 h-10 text-brand-primary" />
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-4">¡Publicación recibida!</h3>
                
                {welcomeNote && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gray-50 p-6 rounded-3xl mb-6 relative italic text-gray-700 font-medium leading-relaxed"
                  >
                    <div className="absolute -top-3 left-6 bg-brand-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Nota de Bienvenida
                    </div>
                    "{welcomeNote}"
                  </motion.div>
                )}
                
                <p className="text-gray-500 font-medium text-sm">Pronto revisaremos tu oficio y te enviaremos una notificación a <span className="text-brand-primary font-bold">{formData.email}</span>.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Foto del Trabajo *</label>
                    {isProcessingImage && <div className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin text-brand-primary" /><span className="text-[9px] font-black text-brand-primary uppercase">Procesando...</span></div>}
                  </div>
                  <div className="relative">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="hidden" 
                    />
                    <div 
                      onClick={triggerFileInput}
                      className={`block h-72 w-full bg-gray-50 border-2 border-dashed rounded-3xl overflow-hidden cursor-pointer hover:border-brand-primary transition-colors relative group ${
                        errors.image ? 'border-red-500 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      {image ? (
                        <div className="w-full h-full relative">
                          <img src={image} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white px-4 py-2 rounded-full text-[10px] font-bold text-brand-dark flex items-center gap-2">
                              <ImagePlus className="w-3.5 h-3.5" />
                              <span>Cambiar foto</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                          {isProcessingImage ? (
                            <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-2" />
                          ) : (
                            <Camera className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                          )}
                          <span className="text-sm font-bold">{isProcessingImage ? 'Procesando...' : 'Subí una foto de tu trabajo'}</span>
                          <span className="text-[10px] mt-1 text-gray-300">Tocá acá para elegir</span>
                        </div>
                      )}
                    </div>
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
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Correo Electrónico *</label>
                      {errors.email && <span className="text-[9px] font-black text-red-500 uppercase">Inválido</span>}
                    </div>
                    <input 
                      required
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all ${
                        errors.email ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Descripción *</label>
                      {errors.description && <span className="text-[9px] font-black text-red-500 uppercase">{errors.description}</span>}
                    </div>
                    <textarea 
                      required
                      placeholder="Contanos un poco más sobre lo que hacés (mínimo 10 caracteres)"
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className={`w-full bg-gray-50 border-2 rounded-2xl py-4 px-5 outline-none font-bold transition-all resize-none ${
                        errors.description ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-brand-primary'
                      }`}
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
