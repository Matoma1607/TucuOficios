import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Phone } from 'lucide-react';
import { CATEGORIES_CONFIG } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const TucuAssistant = ({ hidden = false }: { hidden?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente de TucuOficios. ¿En qué te puedo ayudar hoy?' }
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
      let response = "Lo siento, no entendí tu consulta. Podés intentar con palabras como 'publicar', 'precio', 'contacto' o simplemente el oficio que buscás (ej: 'plomero', 'profe').";

      if (userMessage.includes('publicar') || userMessage.includes('publico') || userMessage.includes('anuncio') || userMessage.includes('postear')) {
        response = "Para publicar tu oficio, tocá el botón naranja 'Publicar oficio' de arriba (en el celular está abajo). Entrás con tu cuenta de Google. Completás el formulario y ¡listo! Tu anuncio se revisará y aparecerá pronto.";
      } else if (userMessage.includes('gratis') || userMessage.includes('precio') || userMessage.includes('costo') || userMessage.includes('pagar')) {
        response = "¡TucuOficios es 100% gratuito! No cobramos por publicar ni por contactar profesionales. Queremos ayudar al trabajo tucumano.";
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

  if (hidden) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[90]">
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar ayuda' : 'Abrir ayuda'}
        className="w-12 h-12 bg-brand-dark hover:bg-black text-white rounded-full flex items-center justify-center shadow-lg relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute bottom-16 right-0 w-[340px] max-w-[calc(100vw-32px)] h-[480px] max-h-[70vh] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-orange-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">Ayuda</h3>
                  <p className="text-xs text-gray-500">Preguntas frecuentes sobre TucuOficios</p>
                </div>
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
                {['¿Cómo publico?', '¿Es gratis?', 'Busco plomero'].map((s, i) => (
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
  );
};

export default TucuAssistant;
