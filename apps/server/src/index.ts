import './env'
import { createApp } from '~/lib/core/create-app'
import { csrf } from 'hono/csrf'
import { serveStatic, websocket } from 'hono/bun'
import { errorHandler } from '~/middleware/error-handler'
import authRouter from '~/modules/auth/auth.index'
import adminRouter from '~/modules/admin/admin.index'
import publicRouter from '~/modules/public/public.index'
import { cron_cleanUpExpiredUploads } from '~/modules/admin/upload/tus'
import { config } from '~/env'

const app = createApp()

const allowedOrigins = config.ALLOWED_ORIGINS || []
if (allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS is not defined')
}
// csrf防护 origin校验
app.use(
  '/api/admin/*',
  csrf({
    origin: allowedOrigins,
    secFetchSite: 'same-origin'
  })
)

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: '3qrain Admin API', version: '1.0.0' }
})

// 对外开放的上传文件
app.use(
  '/storage/*',
  async (c, next) => {
    // 防盗链
    const referer = c.req.header('referer')

  if (referer) {
    const ok = allowedOrigins.some(origin =>
      referer.startsWith(origin)
    )

    if (!ok) {
      return c.text('Forbidden', 403)
    }
  }
    await next()

    // 图片/媒体缓存 30 天
    c.header(
      'Cache-Control',
      'public, max-age=2592000'
    )
  },
  serveStatic({
    root: './data/uploads',
    rewriteRequestPath: path => path.replace(/^\/storage/, '')
  })
)

app.route('/api', publicRouter)
app.route('/api/auth', authRouter)
app.route('/api/admin', adminRouter)

app.onError(errorHandler)

cron_cleanUpExpiredUploads()

export default {
  fetch: app.fetch,
  websocket,
  // 邮件测试接口可能耗时较长，避免 Bun idle timeout 过短导致请求中断
  idleTimeout: 60,
}
