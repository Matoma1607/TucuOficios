import { motion } from 'motion/react';

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Pattern / Scribbles */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Abstract Scribbles */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M100,200 Q400,100 500,400 T900,200" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M200,800 Q500,700 600,900 T800,700" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="850" cy="150" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M50,500 L150,500 M100,450 L100,550" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8,
          ease: [0, 0.71, 0.2, 1.01]
        }}
        className="flex flex-col items-center relative"
      >
        {/* Subtle Orange Glow under Logo */}
        <div className="absolute inset-0 bg-brand-primary/10 blur-[60px] rounded-full scale-150 -z-10" />
        
        <div className="text-4xl md:text-7xl font-black tracking-tighter text-brand-dark mb-4 drop-shadow-sm" translate="no">
          <span>Tucu</span><span className="text-brand-primary">Oficios</span>
        </div>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="h-1.5 bg-brand-primary rounded-full"
        />
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-4 text-gray-400 font-medium tracking-widest text-xs uppercase"
        >
          <span>San Miguel de Tucumán</span>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
