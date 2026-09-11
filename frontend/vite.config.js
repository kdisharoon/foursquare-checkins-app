import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check for frontend.env in root or current folder
  const rootFrontendEnv = path.resolve(__dirname, '../frontend.env');
  const localFrontendEnv = path.resolve(__dirname, 'frontend.env');
  const localEnv = path.resolve(__dirname, '.env');

  let envVars = {};
  if (fs.existsSync(rootFrontendEnv)) {
    envVars = { ...envVars, ...dotenv.parse(fs.readFileSync(rootFrontendEnv)) };
  }
  if (fs.existsSync(localFrontendEnv)) {
    envVars = { ...envVars, ...dotenv.parse(fs.readFileSync(localFrontendEnv)) };
  }
  if (fs.existsSync(localEnv)) {
    envVars = { ...envVars, ...dotenv.parse(fs.readFileSync(localEnv)) };
  }

  // Also include system / CI environment variables (e.g. from GitHub Actions)
  const VITE_GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || envVars.VITE_GOOGLE_CLIENT_ID || '';
  const VITE_SEARCH_API_URL = process.env.VITE_SEARCH_API_URL || envVars.VITE_SEARCH_API_URL || '';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(VITE_GOOGLE_CLIENT_ID),
      'import.meta.env.VITE_SEARCH_API_URL': JSON.stringify(VITE_SEARCH_API_URL),
    },
    build: {
      outDir: 'dist',
    },
  };
});
