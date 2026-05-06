import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  preview: {
    port: 4173,
    host: true
  }
})
