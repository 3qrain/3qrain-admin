import { createMiddleware } from 'hono/factory'
import { redis } from '~/db'
import { fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { SESSION_ADMIN_PREFIX, sessionValueSchema } from '~/constants/session'
import { getClientIp } from '~/utils/getClientIp'

const TOKEN_TTL = Number(process.env.TOKEN_TTL) || 86400

export const authGuard = createMiddleware(async (c, next) => {
  // cookie 校验
  const cookie = c.req.header('cookie') || ''
  const match = cookie.match(/3qrain_token=([^;]+)/)
  const token = match?.[1]

  if (!token) {
    return c.json(fail(ErrorCode.UNAUTHORIZED, '未登录'), HttpStatusCodes.UNAUTHORIZED)
  }

  const raw = await redis.get(`${SESSION_ADMIN_PREFIX}${token}`)
  if (!raw) {
    return c.json(fail(ErrorCode.UNAUTHORIZED, 'session不存在'), HttpStatusCodes.UNAUTHORIZED)
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return c.json(fail(ErrorCode.INTERNAL_ERROR, 'session数据值解析异常'), HttpStatusCodes.INTERNAL_SERVER_ERROR)
  }

  const result = sessionValueSchema.safeParse(parsed)
  if (!result.success) {
    await redis.del(`${SESSION_ADMIN_PREFIX}${token}`)
    return c.json(fail(ErrorCode.UNAUTHORIZED, 'session数据值校验失败'), HttpStatusCodes.UNAUTHORIZED)
  }

  result.data.lastActiveAt = Date.now()
  result.data.loginIp = getClientIp(c)
  
  await redis.setex(`${SESSION_ADMIN_PREFIX}${token}`, TOKEN_TTL, JSON.stringify(result.data))

  c.set('admin', true)

  await next()
})
