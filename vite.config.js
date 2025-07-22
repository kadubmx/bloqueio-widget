import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
        // Força a exposição no window
        format: 'iife',
        name: 'BloqueioWidget'
      },
    },
  },
});