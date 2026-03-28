import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  server: {
    headers: {
      // Allow iframe embedding during dev
      'X-Frame-Options': 'ALLOWALL',
    },
  },
});
