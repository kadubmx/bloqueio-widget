import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // evita referências a process.env dentro do bundle
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },

  build: {
    lib: {
      entry: 'src/index.jsx',         // <‑‑ ponto de entrada
      name: 'BloqueioWidget',         // <‑‑ nome global gerado
      formats: ['iife'],              // bundle único p/ <script>
      fileName: () => 'bloqueio-widget.js',
    },
    rollupOptions: {
      // React virá das CDNs, então marque como external
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
