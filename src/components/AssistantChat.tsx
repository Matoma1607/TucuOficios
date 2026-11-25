import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, Loader2, MessageCircle } from 'lucide-react';
import { CATEGORIES_CONFIG } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TucuAssistantProps {
  open: boolean;
  onClose: () => void;
}

/** Ventana de ayuda con respuestas a preguntas frecuentes. Se abre desde "¿Necesitás ayuda?" en el pie. */
const TucuAssistant = ({ open: isOpen, onClose }: TucuAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente de TucuOficios. Te ayudo a buscar un profesional o a publicar tu servicio. Tocá una pregunta de abajo o escribí la tuya.' }
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

    // Simulamos un pequeño retraso para que parezca que está "pensando"
    setTimeout(() => {
      let response = "No encontré una respuesta para eso. Probá con palabras como 'publicar', 'gratis' o el oficio que buscás (por ejemplo 'plomero' o 'profe'). Si preferís, hablá con una persona por WhatsApp con el botón de abajo.";

      if (userMessage.includes('persona') || userMessage.includes('humano') || userMessage.includes('soporte') || userMessage.includes('equipo')) {
        response = "Claro. Tocá 'Hablar con una persona por WhatsApp' acá abajo y te responde alguien del equipo de TucuOficios.";
      } else if (userMessage.includes('como busco') || userMessage.includes('buscar')) {
        response = "Escribí lo que necesitás en el buscador de arriba (por ejemplo 'electricista' o 'tortas') o elegí una sección en los filtros. Con 'Cerca tuyo' ves primero a los de tu zona. Después tocá el botón verde de WhatsApp para hablar directo con el profesional.";
      } else if (userMessage.includes('publicar') || userMessage.includes('publico') || userMessage.includes('anuncio') || userMessage.includes('postear')) {
        response = "Para publicar tu oficio, tocá el botón naranja 'Publicar oficio' de arriba (en el celular está abajo). Entrás con tu cuenta de Google. Completás el formulario y ¡listo! Tu anuncio se revisará y aparecerá pronto.";
      } else if (userMessage.includes('gratis') || userMessage.includes('precio') || userMessage.includes('costo') || userMessage.includes('pagar')) {
        response = "Hoy publicar en TucuOficios es gratis: no te pedimos tarjeta, no cobramos comisión y los clientes te escriben directo a tu WhatsApp, sin intermediarios. Buscar y contactar profesionales tampoco tiene costo. Si en el futuro sumamos opciones pagas, van a ser opcionales y avisadas antes.";
      } else if (userMessage.includes('contacto') || userMessage.includes('whatsapp') || userMessage.includes('llamar') || userMessage.includes('hablar')) {
        response = "Para hablar con un profesional, buscá su tarjeta y tocá el botón verde de WhatsApp. Te abre directamente su WhatsApp para que acuerden el trabajo.";
      } else if (userMessage.includes('categoria') || userMessage.includes('rubro') || userMessage.includes('oficio')) {
        response = "Tenemos rubros de todo tipo: Hogar, Construcción, Tecnología, Vehículos, Salud, Educación, Eventos, Mascotas y más. Los ves en los filtros de arriba.";
      } else if (userMessage.includes('hola') || userMessage.includes('buen') || userMessage.includes('asistente') || userMessage.includes('quien')) {
        response = "¡Hola! Soy el asistente de TucuOficios. Te ayudo a encontrar lo que necesitás o a publicar tu servicio. ¿Qué duda tenés?";
      } else if (userMessage.includes('matias') || userMessage.includes('administrador') || userMessage.includes('dueño')) {
        response = "Matias es quien administra el sitio. Podés contactarlo si tenés dudas técnicas o querés sugerir una mejora para la página.";
      } else if (userMessage.includes('busco') || userMessage.includes('necesito') || userMessage.includes('donde hay') || userMessage.includes('alguien que')) {
        response = "Para buscar, usá la lupa 🔍 de arriba. Escribí el nombre del oficio (ej: 'profe', 'limpieza', 'fletes') y te saldrán los profesionales disponibles en Tucumán.";
      } else if (userMessage.includes('profe') || userMessage.includes('clase') || userMessage.includes('musica') || userMessage.includes('particular')) {
        response = "Los profes están en la sección 'Educación'. ¡Hay de música, idiomas, apoyo escolar y más!";
      } else if (userMessage.includes('plomero') || userMessage.includes('electricista') || userMessage.includes('gasista') || userMessage.includes('albañil')) {
        response = "Esa especialidad está en las secciones 'Hogar' y 'Construcción'. Buscalos con la lupa para ver a los mejores de la zona.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 800);
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
                  <p className="text-xs text-gray-300">Preguntas frecuentes sobre TucuOficios</p>
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
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-brand-dark text-white rounded-br-md' 
                      : 'bg-white text-gray-700 border border-gray-200 rounded-bl-md'
                  }`}>
                    {m.content}
                  </div>
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
