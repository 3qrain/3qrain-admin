import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { db, redis } from '~/db'
import { users } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { ErrorCode } from '@3qrain/shared'
import { SESSION_USER_PREFIX } from '~/constants/session'
import { updateMeSchema } from './user.routes'

export async function me(c: Context) {
  const user = c.get('user')
  return c.json(
    ok({ id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role }, '获取成功'),
    HttpStatusCodes.OK,
  )
}

export async function updateMe(c: Context) {
  const user = c.get('user')

  const body = await c.req.json()
  const parsed = updateMeSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, parsed.error.issues[0].message), HttpStatusCodes.BAD_REQUEST)
  }

  const updated = db
    .update(users)
    .set(parsed.data)
    .where(eq(users.id, user.id))
    .returning()
    .get()

  return c.json(
    ok({ id: updated.id, username: updated.username, email: updated.email, avatarUrl: updated.avatarUrl, role: updated.role }, '更新成功'),
    HttpStatusCodes.OK,
  )
}

export async function logout(c: Context) {
  const token = c.get('userToken')
  if (token) {
    await redis.del(`${SESSION_USER_PREFIX}${token}`)
    c.header('set-cookie', '3qrain_user_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
  }
  return c.json(ok({}, '已退出'), HttpStatusCodes.OK)
}
