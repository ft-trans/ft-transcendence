import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  build: {
    outDir: 'dist/front'
  },
  plugins: [
    tailwindcss(),
  ],
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  }
});
