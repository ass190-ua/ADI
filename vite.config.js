import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vuetify/vite';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
  ],
  server: {
    port: 5173,
    open: false,
  },
});
