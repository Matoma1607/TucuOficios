import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Camera } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../services/firebase';
import { CATEGORIES, Category } from '../types';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalName: string;
  professionalId: string;
}

export default function PostJobModal({ isOpen, onClose, professionalName, professionalId }: PostJobModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [zone, setZone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño máximo (10MB antes de comprimir)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('La imagen es demasiado grande (máx 10MB)');
        return;
      }
// ... (rest of image compression logic stays same)

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Crear un canvas para redimensionar la imagen
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es muy grande (max 1200px)
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
          ctx?.drawImage(img, 0, 0, width, height);

          // Exportar como JPEG comprimido (calidad 0.7)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImage(compressedDataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !zone || !whatsapp || !image) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    
    let isFinished = false;
    // Timeout de seguridad (30 segundos)
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        setIsSubmitting(false);
        setErrorMessage('La subida está tardando demasiado. Verificá tu conexión e intentá de nuevo.');
      }
    }, 30000);
    
    try {
      console.log('Iniciando subida de imagen...');
      // 1. Convertir Data URL a Blob para una subida más robusta en móviles
      const response = await fetch(image);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `jobs/${Date.now()}-${professionalId}`);
      
      try {
        await uploadBytes(storageRef, blob);
        console.log('Imagen subida a Storage como Blob');
      } catch (storageErr: any) {
        console.error('Error en Storage uploadBytes:', storageErr);
        if (storageErr.code === 'storage/unauthorized') {
          throw new Error('No tenés permisos para subir fotos (Storage Unauthorized).');
        }
        throw new Error(`Error al subir la foto: ${storageErr.message}`);
      }

      let downloadURL;
      try {
        downloadURL = await getDownloadURL(storageRef);
        console.log('URL de descarga obtenida:', downloadURL);
      } catch (urlErr: any) {
        console.error('Error en getDownloadURL:', urlErr);
        throw new Error(`Error al obtener el link de la foto: ${urlErr.message}`);
      }

      // 2. Save to Firestore (Firebase)
      const jobData = {
        title,
        category,
        zone,
        whatsapp,
        imageUrl: downloadURL,
        professionalName,
        professionalId,
        createdAt: Date.now()
      };

      console.log('Guardando documento en Firestore...');
      await addDoc(collection(db, 'jobs'), jobData);
      console.log('Documento guardado con éxito');
      
      isFinished = true;
      clearTimeout(timeoutId);
      resetForm();
      onClose();
      // Usamos un pequeño delay para que el usuario vea el éxito si fuera necesario, 
      // pero aquí cerramos el modal directamente.
    } catch (error: any) {
      isFinished = true;
      clearTimeout(timeoutId);
      console.error('Error al publicar:', error);
      
      let msg = 'Hubo un error al publicar el trabajo.';
      if (error.code === 'storage/unauthorized' || error.message?.includes('storage/unauthorized')) {
        msg = 'Error: El servidor de fotos rechazó la subida (Permisos).';
      } else if (error.message?.includes('Missing or insufficient permissions')) {
        msg = 'Error de permisos: Tu sesión puede haber expirado. Reingresá a la app.';
      } else if (error.message) {
        msg = error.message;
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
    setImage(null);
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
              <h2 className="text-xl font-bold text-gray-900">Subir nuevo trabajo</h2>
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
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                        <Camera className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Click para subir foto</span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG (Max 5MB)</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
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

                {/* Zone */}
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

              {/* WhatsApp */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Teléfono WhatsApp</label>
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

              {/* Submit */}
              <button
                disabled={isSubmitting || !title || !zone || !whatsapp || !image}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-primary hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Publicar Trabajo</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
