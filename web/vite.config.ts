/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Build de producție fără URL API = login mort în tăcere; oprim build-ul.
  if (mode === 'production' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL) {
    throw new Error('VITE_API_URL must be set (non-empty) for production builds')
  }
  return {
    plugins: [react()],
    server: { port: 5173 },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
    },
  }
})
