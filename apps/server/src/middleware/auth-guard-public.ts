import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { db, redis } from '~/db'
import { users } from '~/db/schema'
import { fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { SESSION_USER_PREFIX, userSessionValueSchema } from '~/constants/session'
import { config } from '~/env'

const TOKEN_TTL = Number(config.TOKEN_TTL) || 86400

/** 内联校验 — 返回 user 或 null（用于不能挂中间件的场景） */
export async function resolveUserSession(c: Context) {
  const cookie = c.req.header('cookie') || ''
  const match = cookie.match(/3qrain_user_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null

  const raw = await redis.get(`${SESSION_USER_PREFIX}${token}`)
  if (!raw) return null

  const parsed = userSessionValueSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) return null

  const user = db.select().from(users).where(eq(users.id, parsed.data.userId)).get()
  if (!user || user.isBanned) return null

  await redis.setex(
    `${SESSION_USER_PREFIX}${token}`,
    TOKEN_TTL,
    JSON.stringify({ ...parsed.data, lastActiveAt: Date.now() }),
  )

  c.set('user', user)
  c.set('userToken', token)
  return user
}

/** 中间件 — 用于所有接口都需登录的模块 */
export const authGuardPublic = createMiddleware(async (c, next) => {
  const user = await resolveUserSession(c)
  if (!user) {
    return c.json(fail(ErrorCode.UNAUTHORIZED, '未登录'), HttpStatusCodes.UNAUTHORIZED)
  }
  await next()
})
