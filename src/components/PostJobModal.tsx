import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Camera } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType, loginAnonymously } from '../services/firebase';
import { CATEGORIES, Category } from '../types';
import { Check, ShieldCheck, Phone, User as UserIcon, ArrowRight, ArrowLeft, Key } from 'lucide-react';

const VALID_KEYWORD = 'TUCUMAN2026';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export default function PostJobModal({ isOpen, onClose, currentUser }: PostJobModalProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [zone, setZone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [profName, setProfName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (15MB para dar margen a fotos de alta resolución)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('La imagen es demasiado grande (máx 15MB)');
      return;
    }

    setIsProcessingImage(true);
    
    // Usar URL.createObjectURL es más eficiente en memoria que FileReader para móviles
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Dibujar imagen en el canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Comprimir a JPEG (calidad 0.7)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          if (compressedDataUrl && compressedDataUrl.length > 100) {
            setImage(compressedDataUrl);
          } else {
            throw new Error('Error al generar la vista previa');
          }
        }
      } catch (err) {
        console.error('Error processing image:', err);
        setErrorMessage('No pudimos procesar esta foto. Intentá con otra o sacá una foto nueva.');
      } finally {
        setIsProcessingImage(false);
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      console.error('Error loading image object');
      setErrorMessage('Formato de imagen no compatible o archivo dañado.');
      setIsProcessingImage(false);
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
    
    // Limpiar el input para permitir seleccionar la misma foto si falla
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!title || !zone || !image) {
        setErrorMessage('Por favor completa todos los campos y sube una foto.');
        return;
      }
      setStep(2);
      return;
    }
    
    if (step === 2) {
      if (!profName || whatsapp.length < 8) {
        setErrorMessage('Por favor ingresa tu nombre y un WhatsApp válido.');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (keyword.toUpperCase() !== VALID_KEYWORD) {
        setErrorMessage('La palabra clave es incorrecta.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    
    let isFinished = false;
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        setIsSubmitting(false);
        setErrorMessage('La subida está tardando demasiado. Verificá tu conexión e intentá de nuevo.');
      }
    }, 45000);
    
    try {
      // 1. Auth anónima en segundo plano para seguridad de Firestore
      let finalUserId = currentUser?.uid;
      if (!finalUserId) {
        const anonUser = await loginAnonymously();
        finalUserId = anonUser.uid;
      }

      // 2. Subida de imagen
      const storageRef = ref(storage, `jobs/${Date.now()}-${finalUserId}`);
      const fetchRes = await fetch(image!);
      const blob = await fetchRes.blob();
      
      await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: { 'userId': finalUserId }
      });

      const downloadURL = await getDownloadURL(storageRef);

      // 3. Guardar en Firestore
      const jobData = {
        title,
        category,
        zone,
        whatsapp,
        imageUrl: downloadURL,
        professionalName: profName,
        professionalId: finalUserId,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'jobs'), jobData);
      
      isFinished = true;
      clearTimeout(timeoutId);
      resetForm();
      onClose();
      alert('¡Excelente! Tu trabajo ha sido publicado con éxito.');
    } catch (error: any) {
      isFinished = true;
      clearTimeout(timeoutId);
      console.error('Error al publicar:', error);
      
      let msg = 'Error al publicar el trabajo.';
      if (error.code === 'storage/unauthorized') {
        msg = 'Error de permisos en Storage. Verifica las reglas de seguridad.';
      } else if (error.message?.includes('CORS') || error.code === 'storage/retry-limit-exceeded') {
        msg = 'Error de conexión con el servidor de fotos (CORS).';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory(CATEGORIES[0]);
    setZone('');
    setWhatsapp('');
    setProfName('');
    setKeyword('');
    setImage(null);
    setStep(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-lg bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/40"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Subir nuevo trabajo</h2>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3].map((s) => (
                    <div 
                      key={s} 
                      className={`h-1 w-8 rounded-full transition-all ${s <= step ? 'bg-blue-600' : 'bg-gray-100'}`}
                    />
                  ))}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto no-scrollbar">
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                  {errorMessage}
                </div>
              )}

              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Foto del trabajo</label>
                    <div 
                      className={`relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden ${
                        image ? 'border-transparent' : 'border-gray-200 hover:border-blue-400 bg-gray-50'
                      }`}
                    >
                      {image ? (
                        <>
                          <img src={image} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setImage(null)}
                            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <label htmlFor="job-image-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                          {isProcessingImage ? (
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-2" />
                              <span className="text-xs text-gray-500">Procesando...</span>
                            </div>
                          ) : (
                            <>
                              <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                                <Camera className="w-6 h-6 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-600">Click para subir foto</span>
                              <span className="text-xs text-gray-400 mt-1">JPG, PNG (Max 10MB)</span>
                            </>
                          )}
                          <input 
                            id="job-image-upload"
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                            className="hidden" 
                            disabled={isProcessingImage}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Título del servicio</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej: Instalación de Split - Barrio Norte"
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
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
                        placeholder="Ej: Yerba Buena"
                        value={zone}
                        onChange={(e) => setZone(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="p-4 bg-blue-50 rounded-2xl flex items-start gap-3">
                    <UserIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Ingresá tus datos de contacto para que los clientes puedan encontrarte.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Tu Nombre Profesional</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Número de WhatsApp</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+54</span>
                      <input
                        required
                        type="tel"
                        placeholder="3815551234"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="p-4 bg-indigo-50 rounded-full">
                      <Key className="w-12 h-12 text-indigo-600" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Validación de Seguridad</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      Para publicar, ingresá la palabra clave de invitación.
                    </p>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-sm font-semibold text-gray-700">Palabra Clave</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej: TUCUMAN2026"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold tracking-widest text-center uppercase"
                    />
                    <p className="text-[10px] text-gray-400 text-center mt-2 italic">
                      Tip: Es la que definimos para el lanzamiento.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Atrás
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-[2] py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isSubmitting ? 'bg-gray-400' : 'bg-brand-primary hover:bg-indigo-700'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {step < 3 ? (
                        <>
                          Siguiente
                          <ArrowRight className="w-5 h-5" />
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Confirmar y Publicar
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
