import { defineConfig } from 'vite';
import viteFastify from '@fastify/vite/plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  build: {
    outDir: 'dist'
  },
  plugins: [
    viteFastify({ spa: true }),
    tailwindcss(),
  ],
  root: import.meta.dirname,
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  }
});
