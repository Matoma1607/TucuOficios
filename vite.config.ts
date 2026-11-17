import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Librerías en archivos aparte: cambian poco, así el navegador las reutiliza entre versiones.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return 'react';
            if (id.includes('@supabase')) return 'supabase';
            if (/[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
