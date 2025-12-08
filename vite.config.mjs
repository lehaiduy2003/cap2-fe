// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '');
    const BASE_API_URL = env.VITE_PUBLIC_API_URL || 'http://localhost:8080';

    return {
        plugins: [react(), tailwindcss()],
        define: {
            global: 'window', // 👈 Thêm dòng này để fix lỗi global
        },
        server: {
            port: 5173,
            open: true,
            proxy: {
                '/api': {
                    target: BASE_API_URL,
                    changeOrigin: true,
                    secure: false,
                    ws: true, // Bật proxy WebSocket
                },
                '/renterowner': {
                    target: BASE_API_URL,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});
