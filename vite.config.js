import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic' // Força o modo clássico para evitar conflitos
  })],
  define: { 
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: 'src/index.jsx',
      name: 'BloqueioWidget',
      formats: ['iife'],
      fileName: () => 'bloqueio-widget.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        // Garantir que o widget seja exposto no window
        extend: true,
        // Força a criação do namespace no window
        format: 'iife',
        name: 'BloqueioWidget'
      },
    },
  },
});