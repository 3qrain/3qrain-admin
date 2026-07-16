// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  },
  runtimeConfig: {
    public: {
      serverPort: 3010
    }
  },
  nitro: {
    routeRules: {
      '/api/**': { proxy: 'http://localhost:3010/api/**' },
      '/storage/**': { proxy: 'http://localhost:3010/storage/**' }
    }
  },
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3010',
          changeOrigin: true,
          ws: true,
          configure: proxy => {
            proxy.on('proxyReq', (proxyReq, req) => {
              proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '127.0.0.1')
            })
          }
        },
        '/storage/': 'http://localhost:3010'
      }
    }
  }
})
