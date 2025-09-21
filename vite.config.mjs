// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window' // 👈 Thêm dòng này để fix lỗi global
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        ws: true, // Bật proxy WebSocket
      },
      "/renterowner": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});