import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, Loader2, MessageCircle, MapPin, BadgeCheck } from 'lucide-react';
import { CATEGORIES_CONFIG, Job } from '../types';
import { buscarEnSitio } from '../lib/buscarChat';
import { whatsappLink } from './JobCard';
import { contar } from '../lib/contador';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  /** Resultados de búsqueda que se muestran como tarjetitas */
  jobs?: Job[];
}

interface TucuAssistantProps {
  open: boolean;
  onClose: () => void;
  /** Publicaciones del sitio, para buscar desde el chat */
  jobs: Job[];
  /** Abre el detalle de una publicación */
  onOpenJob: (job: Job) => void;
}

const etiqueta = (id: string) => CATEGORIES_CONFIG.find((c) => c.id === id)?.label ?? id;

/** Ventana de ayuda con respuestas a preguntas frecuentes. Se abre desde "¿Necesitás ayuda?" en el pie. */
const TucuAssistant = ({ open: isOpen, onClose, jobs, onOpenJob }: TucuAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente de TucuOficios. Escribime lo que necesitás, por ejemplo "plomero en Yerba Buena", y te muestro quiénes hay. O tocá una pregunta de abajo.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || isLoading) return;

    // Normalizar texto: minúsculas y quitar acentos básicos
    const userMessage = textToSend.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend.trim() }]);
    setIsLoading(true);

    // Un pequeño retraso para que se sienta como una respuesta
    setTimeout(() => {
      const u = userMessage;
      const tiene = (...ps: string[]) => ps.some((x) => u.includes(x));
      let response = "No encontré una respuesta para eso. Probá escribiendo lo que necesitás, por ejemplo 'plomero en Yerba Buena' o 'tortas'. Si preferís, hablá con una persona por WhatsApp con el botón de abajo.";
      let resultados: Job[] | undefined;
      let extra: string | undefined;

      const busqueda = buscarEnSitio(textToSend, jobs);

      if (tiene('persona', 'humano', 'soporte', 'equipo')) {
        response = "Claro. Tocá 'Hablar con una persona por WhatsApp' acá abajo y te responde alguien del equipo de TucuOficios.";
      } else if (tiene('publicar', 'publico', 'anuncio', 'postear')) {
        response = "Para publicar tu oficio, tocá el botón naranja 'Publicar oficio' de arriba (en el celular está abajo). Entrás con tu cuenta de Google. Completás el formulario y ¡listo! Tu anuncio se revisará y aparecerá pronto.";
      } else if (tiene('gratis', 'precio', 'costo', 'pagar', 'cobran')) {
        response = "Hoy publicar en TucuOficios es gratis: no te pedimos tarjeta, no cobramos comisión y los clientes te escriben directo a tu WhatsApp, sin intermediarios. Buscar y contactar profesionales tampoco tiene costo. Si en el futuro sumamos opciones pagas, van a ser opcionales y avisadas antes.";
      } else if (busqueda) {
        const rubro = busqueda.rubros.length ? etiqueta(busqueda.rubros[0]) : null;
        const que = rubro ? ` de ${rubro.toLowerCase()}` : '';
        const donde = busqueda.zona ? ` en ${busqueda.zona}` : '';
        if (busqueda.jobs.length) {
          const n = busqueda.jobs.length;
          response = n === 1 ? `Encontré 1 opción${que}${donde}:` : `Encontré ${n} opciones${que}${donde}:`;
          resultados = busqueda.jobs.slice(0, 4);
          if (n > 4) extra = `Y ${n - 4} más. Para verlas todas usá el buscador del sitio.`;
          else extra = 'Tocá una para ver sus trabajos, o el botón verde para escribirle.';
        } else if (busqueda.otrasZonas.length) {
          response = `${busqueda.zona ? `En ${busqueda.zona}` : 'En esa zona'} todavía no hay nadie${que}, pero sí en otras zonas:`;
          resultados = busqueda.otrasZonas.slice(0, 4);
          extra = 'Muchos se mueven por toda la provincia: preguntales si llegan hasta tu zona.';
        } else {
          response = rubro
            ? `Todavía no tenemos publicaciones${que}${donde}. Si conocés a alguien que lo haga, contale que puede publicar gratis. Y si necesitás ayuda para buscar, escribinos por WhatsApp.`
            : `No encontré publicaciones con eso${donde}. Probá con otra palabra, por ejemplo el oficio ('electricista', 'tortas', 'uñas').`;
        }
      } else if (tiene('como busco', 'buscar')) {
        response = "Escribime acá lo que necesitás, por ejemplo 'electricista en Tafí Viejo', y te muestro quiénes hay. También podés usar el buscador de arriba o 'Cerca tuyo' para ver primero a los de tu zona.";
      } else if (tiene('contacto', 'whatsapp', 'llamar', 'hablar')) {
        response = "Para hablar con un profesional, buscá su tarjeta y tocá el botón verde de WhatsApp. Te abre directamente su WhatsApp para que acuerden el trabajo.";
      } else if (tiene('categoria', 'rubro', 'oficio')) {
        response = "Tenemos rubros de todo tipo: Hogar, Construcción, Tecnología, Vehículos, Salud, Educación, Eventos, Mascotas, Emprendimientos y más. Decime qué necesitás y te muestro quiénes hay.";
      } else if (tiene('hola', 'buen', 'asistente', 'quien')) {
        response = "¡Hola! Soy el asistente de TucuOficios. Decime qué necesitás (por ejemplo 'plomero en Yerba Buena') y te muestro quiénes hay, o preguntame cómo publicar.";
      } else if (tiene('matias', 'administrador', 'dueño', 'dueno')) {
        response = "Matias es quien administra el sitio. Podés contactarlo si tenés dudas técnicas o querés sugerir una mejora para la página.";
      } else if (tiene('busco', 'necesito', 'donde hay', 'alguien que')) {
        response = "Contame qué oficio o producto buscás (por ejemplo 'plomero', 'tortas' o 'clases de inglés') y, si querés, en qué zona. Te muestro quiénes hay.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }, ...(resultados ? [{ role: 'assistant' as const, content: extra ?? '', jobs: resultados }] : [])]);
      setIsLoading(false);
    }, 700);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="fondo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[94] bg-black/35 sm:hidden"
          />
        )}
      </AnimatePresence>
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto md:bottom-6 md:right-6 z-[95]">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog"
            aria-label="Ayuda"
            className="sm:w-[360px] h-[480px] max-h-[75vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-300 flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-brand-dark">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-strong rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-white">Ayuda</h3>
                  <p className="text-xs text-gray-300">Buscá profesionales o hacé tu consulta</p>
                </div>
                <button onClick={onClose} aria-label="Cerrar ayuda" className="p-2 -mr-2 rounded-full text-gray-300 hover:bg-white/10 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.jobs ? (
                    <div className="w-full space-y-2">
                      {m.jobs.map((j) => (
                        <div key={j.id} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl p-2">
                          <button
                            type="button"
                            onClick={() => onOpenJob(j)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                            aria-label={`Ver la publicación de ${j.professionalName}`}
                          >
                            {j.thumbUrl || j.imageUrl ? (
                              <img src={j.thumbUrl || j.imageUrl} alt="" loading="lazy" className="w-11 h-11 rounded-lg object-cover flex-none bg-gray-100" />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-gray-100 flex-none" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1">
                                {j.professionalName}
                                {j.verificado && <BadgeCheck className="w-3.5 h-3.5 flex-none text-sky-600" aria-label="Verificado" />}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{etiqueta(j.category)}</p>
                              <p className="text-xs text-gray-500 truncate flex items-center gap-1"><MapPin className="w-3 h-3 flex-none" aria-hidden="true" />{j.zone}</p>
                            </div>
                          </button>
                          <a
                            href={whatsappLink(j)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => contar('whatsapp', j.id)}
                            aria-label={`Escribirle por WhatsApp a ${j.professionalName}`}
                            className="flex-none w-10 h-10 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 inline-flex items-center justify-center"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </a>
                        </div>
                      ))}
                      {m.content && <p className="text-xs text-gray-500 px-1">{m.content}</p>}
                    </div>
                  ) : (
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-brand-dark text-white rounded-br-md' 
                      : 'bg-white text-gray-700 border border-gray-200 rounded-bl-md'
                  }`}>
                    {m.content}
                  </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    <span className="text-xs text-gray-500">Escribiendo…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="p-2 border-t border-gray-100 bg-white">
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {['¿Cómo busco?', '¿Cómo publico?', '¿Es gratis?'].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="flex-shrink-0 px-3 py-1.5 bg-white text-xs text-gray-600 rounded-full border border-gray-200 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <a
              href="https://wa.me/5493813217398?text=Hola%20TucuOficios%2C%20tengo%20una%20consulta%3A%20"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border-t border-gray-100"
            >
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Hablar con una persona por WhatsApp
            </a>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Escribí tu mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  aria-label="Tu pregunta"
                  className="w-full bg-white border border-gray-300 focus:border-gray-900 rounded-lg py-2.5 pl-3 pr-11 text-sm outline-none transition-colors"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  aria-label="Enviar"
                  className={`absolute right-1.5 p-2 rounded-md transition-colors ${
                    input.trim() && !isLoading ? 'bg-brand-dark text-white' : 'text-gray-300'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default TucuAssistant;
