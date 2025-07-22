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
      // Usar React do Lowcoder
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        format: 'iife',
        name: 'BloqueioWidget'
      },
    },
  },
});