import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/analyze': 'http://localhost:5000',
      '/games': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    },
  },
})
