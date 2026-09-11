import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load from frontend.env in root or frontend directory if present
  const envDir = path.resolve(__dirname, '..');
  return {
    plugins: [react()],
    envDir: envDir,
    envPrefix: 'VITE_',
    configFile: false,
    build: {
      outDir: 'dist',
    },
  };
});
