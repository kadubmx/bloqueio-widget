import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },

  build: {
    lib: {
      entry: 'src/index.jsx',        // ponto de entrada
      name:  'BloqueioWidget',       // cria window.BloqueioWidget
      formats: ['iife'],
      fileName: () => 'bloqueio-widget.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],         // usa React da CDN
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
  },
});
