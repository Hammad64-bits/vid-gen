import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Kling AI API — https://api-singapore.klingai.com
      '/api/kling': {
        target: 'https://api-singapore.klingai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kling/, ''),
      },
      // xAI Grok API — https://api.x.ai
      '/api/grok': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/grok/, ''),
      },
      // Suno API — https://api.sunoapi.org
      '/api/suno': {
        target: 'https://api.sunoapi.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/suno/, ''),
      },
    },
  },
})

