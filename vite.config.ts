import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/front'
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  }
});
