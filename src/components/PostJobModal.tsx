import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Loader2, PartyPopper, LogIn, Lightbulb, MapPin, MessageCircle, Instagram } from 'lucide-react';
import { validarPublicacion } from '../lib/validarPublicacion';
import type { User } from '@supabase/supabase-js';
import { CATEGORIES_CONFIG, Category } from '../types';
import OpcionesZona from './OpcionesZona';
import { createJob, uploadJobImage, removeImages, normalizeWhatsapp } from '../services/jobs';
import { normalizeInstagram } from '../lib/instagram';
import AliasField from './AliasField';
import { INSTAGRAM_OFICIAL_URL } from '../lib/alias';
import PorQueGratis from './PorQueGratis';
import RubrosExtra from './RubrosExtra';
import PhotoPicker, { PhotoItem } from './PhotoPicker';
import { iconoRubro } from '../lib/iconosRubro';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignIn: () => void;
  onCreated: () => void;
}

const DRAFT_KEY = 'tucu_form_draft';

const emptyForm = () => ({
  title: '',
  category: '',
  zone: '',
  professionalName: '',
  negocio: '',
  whatsapp: '',
  instagram: '',
  description: '',
  alias: '',
  aliasManual: false,
  extraCategories: [] as string[],
});

const loadDraft = () => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? { ...emptyForm(), ...JSON.parse(saved) } : emptyForm();
  } catch {
    return emptyForm();
  }
};

const PostJobModal = ({ isOpen, onClose, user, onSignIn, onCreated }: PostJobModalProps) => {
  // El borrador se guarda en el navegador, así no se pierde al ir a loguearse con Google
  const [formData, setFormData] = useState(loadDraft);

  const sections = Array.from(new Set(CATEGORIES_CONFIG.map(c => c.section)));

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [aliasOk, setAliasOk] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    } catch {
      /* almacenamiento no disponible: no pasa nada */
    }
  }, [formData]);

  // Completa el nombre con el de la cuenta de Google si todavía está vacío
  useEffect(() => {
    const googleName = user?.user_metadata?.full_name as string | undefined;
    if (googleName && !formData.professionalName) {
      setFormData((prev: ReturnType<typeof emptyForm>) => ({ ...prev, professionalName: googleName }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const validate = () => {
    const v = validarPublicacion({
      title: formData.title,
      category: formData.category,
      zone: formData.zone,
      nombre: formData.professionalName,
      negocio: formData.negocio,
      whatsapp: formData.whatsapp,
      instagram: formData.instagram,
      description: formData.description,
      fotos: photos.length,
    });
    const { nombre, ...resto } = v;
    const newErrors: Record<string, string> = { ...resto } as Record<string, string>;
    if (nombre) newErrors.professionalName = nombre;
    if (!aliasOk) newErrors.alias = 'Elegí otro link';
    setErrors(newErrors);
    // Lleva al primer dato a corregir (en el celular el error puede quedar fuera de la pantalla)
    const orden: [string, string][] = [
      ['image', 'post-fotos'], ['title', 'post-titulo'], ['category', 'post-categoria'], ['zone', 'post-zona'],
      ['professionalName', 'post-nombre'], ['negocio', 'post-negocio'], ['whatsapp', 'post-whatsapp'],
      ['instagram', 'post-instagram'], ['alias', 'post-alias'], ['description', 'post-descripcion'],
    ];
    const primero = orden.find(([k]) => newErrors[k]);
    if (primero) {
      const el = document.getElementById(primero[1]);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true });
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = () => {
    // Al volver de Google, App reabre este formulario
    sessionStorage.setItem('tucu_open_post', '1');
    onSignIn();
  };

  const resetAndClose = () => {
    onClose();
    setSuccess(false);
    setFormData(emptyForm());
    setPhotos([]);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setIsSubmitting(true);
    setErrors({});

    let step = 'foto';
    const uploaded: string[] = [];
    try {
      for (const photo of photos) {
        if (!photo.file) continue;
        uploaded.push(await uploadJobImage(user.id, photo.file));
      }

      step = 'datos';
      await createJob(
        {
          title: formData.title,
          category: formData.category,
          extraCategories: formData.extraCategories,
          zone: formData.zone,
          professionalName: formData.professionalName,
          negocio: formData.negocio,
          description: formData.description,
          alias: formData.alias,
          whatsapp: normalizeWhatsapp(formData.whatsapp)!,
          instagram: normalizeInstagram(formData.instagram ?? '') || null,
        },
        uploaded
      );

      localStorage.removeItem(DRAFT_KEY);
      setSuccess(true);
      onCreated();
    } catch (err) {
      // Si falló al subir fotos, borramos las que sí se subieron
      if (step === 'foto') await removeImages(uploaded);
      const msg = err instanceof Error ? err.message : '';
      setErrors({
        submit: msg || (step === 'foto'
          ? 'No pudimos procesar la foto. Probá con otra.'
          : 'Hubo un problema al enviar los datos. Reintentá.'),
      });
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
          onClick={success ? resetAndClose : onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-900">Publicar oficio</h2>
            <button onClick={success ? resetAndClose : onClose} aria-label="Cerrar" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-6 max-h-[85vh] overflow-y-auto no-scrollbar">
            {!user ? (
              <div className="py-10 px-2 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LogIn className="w-9 h-9 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Entrá para publicar</h3>
                <p className="text-gray-500 font-medium text-sm mb-8 leading-relaxed">
                  Usamos tu cuenta de Google para que solo vos puedas editar o borrar tus publicaciones. Publicar es gratis.
                  Tu email <strong>no</strong> se muestra en la página.
                </p>
                <button
                  onClick={handleSignIn}
                  className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 py-3 rounded-lg font-medium flex items-center justify-center gap-3 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                  </svg>
                  <span>Continuar con Google</span>
                </button>
                <PorQueGratis className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center [&_ul]:justify-center" />
              </div>
            ) : success ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-8 px-2 text-center"
              >
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PartyPopper className="w-10 h-10 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Publicación recibida!</h3>
                <p className="text-gray-500 font-medium text-sm mb-8 leading-relaxed">
                  La vamos a revisar y en cuanto se apruebe aparece en TucuOficios.
                  Mientras tanto la vas a ver en la página marcada como <strong>"En revisión"</strong>.
                </p>
                <a
                  href={INSTAGRAM_OFICIAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg border border-[#C9D0E6] bg-[#E3E7F3] text-brand-dark font-semibold hover:bg-[#D6DCEE] transition-colors"
                >
                  <Instagram className="w-4 h-4" aria-hidden="true" />
                  Seguinos en Instagram
                </a>
                <button
                  onClick={resetAndClose}
                  className="w-full bg-brand-strong hover:bg-brand-strong-hover text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Listo
                </button>
              </motion.div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <Lightbulb className="w-4 h-4" aria-hidden="true" /> Para que te escriban más
                  </p>
                  <ul className="mt-1.5 space-y-1 text-orange-900/80 list-disc pl-5">
                    <li>Subí fotos de <strong>trabajos terminados</strong>, mejor que un logo o un flyer.</li>
                    <li>En el título, decí <strong>qué hacés</strong>: “Instalación de aires split”, no “Servicios”.</li>
                    <li>En la descripción contá experiencia, horarios y si tenés matrícula.</li>
                  </ul>
                </div>

                <div id="post-fotos">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Fotos de tu trabajo *</label>
                  <PhotoPicker
                    items={photos}
                    onChange={(items) => { setPhotos(items); setErrors(prev => ({ ...prev, image: '' })); }}
                    error={errors.image}
                    onError={(message) => setErrors(prev => ({ ...prev, image: message }))}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label htmlFor="post-titulo" className="text-sm font-medium text-gray-700">¿Qué ofrecés? *</label>
                      {errors.title && <span className="text-xs font-medium text-red-600">{errors.title}</span>}
                    </div>
                    <input id="post-titulo" 
                      required
                      maxLength={80}
                      placeholder="Ej: Instalación y service de aires split"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className={`w-full bg-white border rounded-lg py-3 px-4 outline-none transition-colors ${
                        errors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                      }`}
                    />
                    <p className="mt-1.5 ml-1 text-xs text-gray-500">Decí qué hacés en pocas palabras, como lo buscaría un cliente.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-2 ml-1">
                        <label htmlFor="post-categoria" className="text-sm font-medium text-gray-700">Categoría *</label>
                        {errors.category && <span className="text-xs font-medium text-red-600">{errors.category}</span>}
                      </div>
                      <select id="post-categoria" 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as Category, extraCategories: (formData.extraCategories ?? []).filter(r => r !== e.target.value)})}
                        className={`w-full bg-white border rounded-lg py-3 px-3 outline-none transition-colors ${
                          errors.category ? 'border-red-300' : 'border-gray-300 focus:border-gray-900'
                        } ${formData.category ? 'text-gray-900' : 'text-gray-500'}`}
                      >
                        <option value="" disabled>Elegí una…</option>
                        {sections.map(section => (
                          <optgroup key={section} label={section}>
                            {CATEGORIES_CONFIG.filter(c => c.section === section).map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <p className="mt-1.5 ml-1 text-xs text-gray-500">¿No está tu rubro? Elegí «Otros servicios», al final de la lista.</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2 ml-1">
                        <label htmlFor="post-zona" className="text-sm font-medium text-gray-700">Zona *</label>
                        {errors.zone && <span className="text-xs font-medium text-red-600">{errors.zone}</span>}
                      </div>
                      <select id="post-zona"
                        value={formData.zone}
                        onChange={e => setFormData({...formData, zone: e.target.value})}
                        className={`w-full bg-white border rounded-lg py-3 px-3 outline-none transition-colors ${
                          errors.zone ? 'border-red-300' : 'border-gray-300 focus:border-gray-900'
                        } ${formData.zone ? 'text-gray-900' : 'text-gray-500'}`}
                      >
                        <option value="" disabled>Elegí una…</option>
                        <OpcionesZona />
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="post-rubros" className="block text-sm font-medium text-gray-700 mb-2 ml-1">¿Hacés algo más? <span className="font-normal text-gray-500">(opcional)</span></label>
                    <RubrosExtra
                      id="post-rubros"
                      principal={formData.category}
                      value={formData.extraCategories ?? []}
                      onChange={(r) => setFormData(f => ({ ...f, extraCategories: r }))}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label htmlFor="post-nombre" className="text-sm font-medium text-gray-700">Tu nombre *</label>
                      {errors.professionalName && <span className="text-xs font-medium text-red-600">{errors.professionalName}</span>}
                    </div>
                    <input id="post-nombre" 
                      required
                      maxLength={60}
                      placeholder="Nombre y Apellido"
                      value={formData.professionalName}
                      onChange={e => setFormData({...formData, professionalName: e.target.value})}
                      className={`w-full bg-white border rounded-lg py-3 px-4 outline-none transition-colors ${
                        errors.professionalName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label htmlFor="post-negocio" className="text-sm font-medium text-gray-700">Nombre de tu emprendimiento o negocio <span className="font-normal text-gray-500">(opcional)</span></label>
                      {errors.negocio && <span className="text-xs font-medium text-red-600">{errors.negocio}</span>}
                    </div>
                    <input id="post-negocio"
                      maxLength={60}
                      placeholder="Ej: Ferretería Italia"
                      value={formData.negocio ?? ''}
                      onChange={e => setFormData({...formData, negocio: e.target.value})}
                      className={`w-full bg-white border rounded-lg py-3 px-4 outline-none transition-colors ${
                        errors.negocio ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                      }`}
                    />
                    <p className="mt-1.5 ml-1 text-xs text-gray-500">Si tenés una marca o un local, ponelo acá y se va a ver como nombre principal. Si no, dejalo vacío.</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label htmlFor="post-whatsapp" className="text-sm font-medium text-gray-700">WhatsApp *</label>
                      {errors.whatsapp && <span className="text-xs font-medium text-red-600">{errors.whatsapp}</span>}
                    </div>
                    <input id="post-whatsapp" 
                      required
                      type="tel"
                      placeholder="381 412-3456"
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      className={`w-full bg-white border rounded-lg py-3 px-4 outline-none transition-colors ${
                        errors.whatsapp ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                      }`}
                    />
                    <p className="mt-1.5 ml-1 text-xs text-gray-500">Ahí te escriben los clientes. También te podemos escribir desde el WhatsApp oficial de TucuOficios para avisarte sobre tu publicación.</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label htmlFor="post-instagram" className="text-sm font-medium text-gray-700">Instagram <span className="font-normal text-gray-500">(opcional)</span></label>
                      {errors.instagram && <span className="text-xs font-medium text-red-600">{errors.instagram}</span>}
                    </div>
                    <div className={`flex items-center bg-white border rounded-lg transition-colors ${
                      errors.instagram ? 'border-red-300 focus-within:border-red-500' : 'border-gray-300 focus-within:border-gray-900'
                    }`}>
                      <span className="pl-4 text-gray-500" aria-hidden="true">@</span>
                      <input
                        id="post-instagram"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="tu.usuario"
                        value={formData.instagram ?? ''}
                        onChange={e => setFormData({...formData, instagram: e.target.value})}
                        className="w-full bg-transparent py-3 pl-1 pr-4 outline-none"
                      />
                    </div>
                    <p className="mt-1.5 ml-1 text-xs text-gray-500">Si mostrás tus trabajos ahí, los clientes te van a tener más confianza.</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label htmlFor="post-alias" className="text-sm font-medium text-gray-700">Tu link en TucuOficios</label>
                      {errors.alias && <span className="text-xs font-medium text-red-600">{errors.alias}</span>}
                    </div>
                    <AliasField
                      id="post-alias"
                      value={formData.alias}
                      onChange={(alias, manual) => setFormData(f => ({ ...f, alias, aliasManual: f.aliasManual || manual }))}
                      nombre={formData.professionalName}
                      negocio={formData.negocio ?? ''}
                      titulo={formData.title}
                      categoria={formData.category}
                      fijo={formData.aliasManual}
                      onEstado={setAliasOk}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label htmlFor="post-descripcion" className="text-sm font-medium text-gray-700">Descripción *</label>
                      {errors.description && <span className="text-xs font-medium text-red-600">{errors.description}</span>}
                    </div>
                    <textarea id="post-descripcion" 
                      required
                      placeholder="Ej: 10 años de experiencia, matriculado. Atiendo de lunes a sábado, presupuesto sin cargo."
                      rows={4}
                      maxLength={600}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className={`w-full bg-white border rounded-lg py-3 px-4 outline-none transition-colors resize-none ${
                        errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                      }`}
                    />
                    <div className="mt-1.5 ml-1 flex justify-between gap-3 text-xs text-gray-500">
                      <span>Contá experiencia, horarios, si tenés matrícula y hasta dónde te movés.</span>
                      <span className="tabular-nums flex-none">{formData.description.trim().length}/600</span>
                    </div>
                  </div>
                </div>

                {/* Vista previa: así aparece en el listado */}
                {(photos.length > 0 || formData.professionalName || formData.negocio || formData.category) && (() => {
                  const cat = CATEGORIES_CONFIG.find(c => c.id === formData.category);
                  const CatIcon = iconoRubro(cat?.id ?? '');
                  return (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 ml-1">Así se va a ver en el listado</p>
                      <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                        <div className="w-14 h-14 flex-none rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                          {photos[0] ? (
                            <img src={photos[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <CatIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{formData.negocio?.trim() || formData.professionalName || 'Tu nombre'}</p>
                          <p className="text-sm text-gray-600 truncate">{cat?.label ?? 'Tu oficio'}</p>
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {formData.zone || 'Tu zona'}
                          </p>
                        </div>
                        <span className="w-10 h-10 flex-none inline-flex items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                          <MessageCircle className="w-5 h-5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {errors.submit && <p className="text-red-700 text-sm font-medium text-center bg-red-50 py-3 rounded-lg">{errors.submit}</p>}

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-brand-strong hover:bg-brand-strong-hover text-white py-3.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Publicar oficio</span>
                      <ChevronRight className="w-5 h-5" />
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
