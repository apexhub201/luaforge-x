import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // QUAN TRỌNG: base path cho GitHub Pages
  base: '/luaforge-x/',
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    outDir: 'dist',
  },
});
