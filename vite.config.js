import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite configuration for a simple Vue 3 project.
// See https://vitejs.dev/config/ for full details.
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: false
  }
});