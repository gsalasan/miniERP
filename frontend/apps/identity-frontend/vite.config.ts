import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path'; 

export default defineConfig(({ mode }) => {
  // Load .env from this frontend folder (important!)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_FE_IDENTITY_PORT) || 3001,
    },
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, '../../shared')
      }
    }
  };
});