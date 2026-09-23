import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
    },
  },
})
