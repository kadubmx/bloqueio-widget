import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {}, // evita erros com "process"
  },
  build: {
    lib: {
      entry: "./src/main.jsx",
      name: "BloqueioWidget",
      fileName: () => `bloqueio-widget.js`,
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
      external: ["react", "react-dom"], // garante que usa os do CDN
    },
  },
});
