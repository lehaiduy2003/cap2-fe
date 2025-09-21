// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { BASE_API_URL } from "./src/constants";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "window", // 👈 Thêm dòng này để fix lỗi global
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: BASE_API_URL,
        changeOrigin: true,
        secure: false,
        ws: true, // Bật proxy WebSocket
      },
      "/renterowner": {
        target: BASE_API_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
