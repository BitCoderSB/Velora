import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@animations": path.resolve(__dirname, "./src/animations"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    },
    fs: {
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  },
  build: {
    rollupOptions: {
      external: []
    }
  },
  worker: {
    format: 'es'
  },
  define: {
    global: 'globalThis'
  }
});
