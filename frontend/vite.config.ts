import { defineConfig, loadEnv } from 'vite';
import * as path from 'path'; 

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_'); // auto-load .env in frontend folder
  return {
    define: {
      'process.env': env
    },
    alias: {
      '@shared': path.resolve(__dirname, 'shared')
    }
  };
});