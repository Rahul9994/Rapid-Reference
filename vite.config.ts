import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages serves the site from /Rapid-Reference/ (set BASE_PATH in CI); local dev stays at /.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5173,
  },
})
