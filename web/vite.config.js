import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy ALL /api calls to FastAPI backend (except claude which goes to Anthropic)
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
        headers: {
          'anthropic-dangerous-direct-browser-access': 'true',
        }
      },
      // Main backend proxy — must come AFTER the claude rule
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // WebSocket threat stream (same host in dev; nginx proxies in prod)
      '/ws': {
        target: apiProxyTarget,
        changeOrigin: true,
        ws: true,
      },
    }
  }
})
