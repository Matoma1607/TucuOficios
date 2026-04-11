import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Camera } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { CATEGORIES, Category } from "../types";

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalName: string;
  professionalId: string;
}

export default function PostJobModal({
  isOpen,
  onClose,
  professionalName,
  professionalId,
}: PostJobModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [zone, setZone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !zone || !whatsapp || !image) return;

    setIsSubmitting(true);

    try {
      // 1. Obtener configuración de Cloudinary desde el archivo .env
      const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        console.error("ERROR: No se encontraron las variables VITE_CLOUDINARY en el archivo .env");
        throw new Error("Configuración de imagen incompleta. Revisá tu archivo .env");
      }

      // 2. Preparar el envío a Cloudinary
      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Error al subir imagen a Cloudinary");
      }

      const downloadURL = data.secure_url;

      // 3. Guardar en la base de datos de Firebase
      const jobData = {
        title,
        category,
        zone,
        whatsapp,
        imageUrl: downloadURL,
        professionalName,
        professionalId,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, "jobs"), jobData);

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error en el proceso de publicación:", error);
      handleFirestoreError(error, OperationType.CREATE, "jobs");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory(CATEGORIES[0]);
    setZone("");
    setWhatsapp("");
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
              <h2 className="text-xl font-bold text-gray-900">
                Subir nuevo trabajo
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 max-h-[80vh] overflow-y-auto no-scrollbar"
            >
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Foto del trabajo
                </label>
                <div
                  className={`relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden ${
                    image
                      ? "border-transparent"
                      : "border-gray-200 hover:border-blue-400 bg-gray-50"
                  }`}
                >
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
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
                      <span className="text-sm font-medium text-gray-600">
                        Click para subir foto
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        JPG, PNG (Max 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Título del servicio
                </label>
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
                  <label className="text-sm font-semibold text-gray-700">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zone */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Zona
                  </label>
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
                <label className="text-sm font-semibold text-gray-700">
                  Teléfono WhatsApp
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    +54
                  </span>
                  <input
                    required
                    type="tel"
                    placeholder="3815551234"
                    value={whatsapp}
                    onChange={(e) =>
                      setWhatsapp(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                disabled={
                  isSubmitting || !title || !zone || !whatsapp || !image
                }
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-brand-primary hover:bg-indigo-700 shadow-indigo-100"
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