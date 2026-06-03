import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/models': 'http://localhost:3001',
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@tensorflow/tfjs')) return 'tensorflow';
          if (id.includes('node_modules/recharts')) return 'recharts';
          if (id.includes('node_modules/d3')) return 'd3';
        },
      },
    },
  },
});
