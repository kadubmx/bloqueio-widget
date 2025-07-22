import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },

  build: {
    lib: {
      entry: 'src/index.jsx',
      name: 'BloqueioWidget',            // cria window.BloqueioWidget
      formats: ['iife'],
      fileName: () => 'bloqueio-widget.js',
    },
    // ⬇️  NÃO marque React como external
    rollupOptions: {
      output: {
        globals: {}                      // nenhum global externo
      }
    },
  },
});
