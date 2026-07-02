import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  base: command === 'build' ? '/admin/' : '/',
  server: {
    proxy: {
      // "/api": "http://localhost:3010",
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        ws: true,
        configure: proxy => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '127.0.0.1')
          })
          proxy.on('proxyReqWs', (proxyReq, req) => { 
            proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '127.0.0.1')
          })
        }
      },
      '/storage/': 'http://localhost:3010'
    }
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src')
    }
  }
}))
