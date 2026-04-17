import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Phone } from 'lucide-react';
import { CATEGORIES_CONFIG } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const TucuAssistant = () => {
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
        response = "Para publicar tu oficio, hacé clic en el botón naranja 'Publicar' que está arriba a la derecha. Completás el formulario y ¡listo! Tu anuncio se revisará y aparecerá pronto.";
      } else if (userMessage.includes('gratis') || userMessage.includes('precio') || userMessage.includes('costo') || userMessage.includes('pagar')) {
        response = "¡TucuOficios es 100% gratuito! No cobramos por publicar ni por contactar profesionales. Queremos ayudar al trabajo tucumano.";
      } else if (userMessage.includes('contacto') || userMessage.includes('whatsapp') || userMessage.includes('llamar') || userMessage.includes('hablar')) {
        response = "Para hablar con un profesional, buscá su tarjeta y dale al botón verde 'Contactar'. Te abre directamente su WhatsApp para que acuerden el trabajo.";
      } else if (userMessage.includes('categoria') || userMessage.includes('rubro') || userMessage.includes('oficio')) {
        response = "Tenemos rubros de todo tipo: Construcción, Clases, Salud, Estética, Mascotas y más. Podés verlos todos en la lista de categorías arriba.";
      } else if (userMessage.includes('hola') || userMessage.includes('buen') || userMessage.includes('asistente') || userMessage.includes('quien')) {
        response = "¡Hola! Soy el asistente de TucuOficios. Te ayudo a encontrar lo que necesitás o a publicar tu servicio. ¿Qué duda tenés?";
      } else if (userMessage.includes('matias') || userMessage.includes('administrador') || userMessage.includes('dueño')) {
        response = "Matias es quien administra el sitio. Podés contactarlo si tenés dudas técnicas o querés sugerir una mejora para la página.";
      } else if (userMessage.includes('busco') || userMessage.includes('necesito') || userMessage.includes('donde hay') || userMessage.includes('alguien que')) {
        response = "Para buscar, usá la lupa 🔍 de arriba. Escribí el nombre del oficio (ej: 'profe', 'limpieza', 'fletes') y te saldrán los profesionales disponibles en Tucumán.";
      } else if (userMessage.includes('profe') || userMessage.includes('clase') || userMessage.includes('musica') || userMessage.includes('particular')) {
        response = "Podés encontrar profesores en la categoría 'Educación y Capacitación'. ¡Hay de música, idiomas, apoyo escolar y más!";
      } else if (userMessage.includes('plomero') || userMessage.includes('electricista') || userMessage.includes('gasista') || userMessage.includes('albañil')) {
        response = "Esa especialidad está en el rubro 'Mantenimiento y Construcción'. Buscalos con la lupa para ver a los mejores de la zona.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[150]">
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-brand-primary/40 relative group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] max-w-[calc(100vw-48px)] h-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-brand-primary text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Asistente TucuOficios</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Online ahora</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-brand-primary text-white rounded-tr-none' 
                      : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Escribiendo...</span>
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
                    className="flex-shrink-0 px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-full border border-gray-100 hover:border-brand-primary hover:text-brand-primary transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Escribí tu mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-gray-50 border border-transparent focus:border-brand-primary rounded-2xl py-3 pl-4 pr-12 text-xs font-bold outline-none transition-all"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-2 p-2 rounded-xl transition-all ${
                    input.trim() && !isLoading ? 'bg-brand-primary text-white' : 'text-gray-300'
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
