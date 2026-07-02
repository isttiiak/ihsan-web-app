import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Split the heaviest dependencies into their own long-cacheable chunks
        // so a small app change doesn't re-download firebase/recharts.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/storage'],
          recharts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
