import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3012,
    strictPort: true, // Force port 3012, don't try other ports
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log('🔄 Proxying:', path, '→ http://localhost:3001' + path);
          return path;
        },
      },
    },
  },
});
