import { eq } from 'drizzle-orm'
import { db, redis } from '~/db'
import { users } from '~/db/schema'
import { generateToken } from '~/utils/crypto'
import { SESSION_USER_PREFIX } from '~/constants/session'
import { setCookie } from 'hono/cookie'
import { config } from '~/env'

const TOKEN_TTL = Number(config.TOKEN_TTL)

export function upsertOAuthUser(
  provider: 'github' | 'google',
  providerId: number | string,
  profile: { username: string; email: string; avatarUrl: string },
) {
  const idField = provider === 'github' ? users.githubId : users.googleId
  const existing = db.select().from(users).where(eq(idField, String(providerId))).get()

  if (existing) {
    db.update(users)
      .set({
        username: profile.username || existing.username,
        avatarUrl: profile.avatarUrl || existing.avatarUrl,
      })
      .where(eq(users.id, existing.id))
      .run()
    return existing
  }

  return db.insert(users)
    .values({
      [provider === 'github' ? 'githubId' : 'googleId']: String(providerId),
      username: profile.username || '',
      email: profile.email || '',
      avatarUrl: profile.avatarUrl || '',
    })
    .returning()
    .get()
}

export async function createUserSession(c: any, userId: number, existingRole?: string) {
  const role = existingRole ?? db.select({ role: users.role }).from(users).where(eq(users.id, userId)).get()!.role
  const token = generateToken()
  const session = JSON.stringify({ role, userId, createdAt: Date.now(), lastActiveAt: Date.now() })
  await redis.setex(`${SESSION_USER_PREFIX}${token}`, TOKEN_TTL, session)
  setCookie(c, '3qrain_user_token', token, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: TOKEN_TTL })
  return token
}

export const OAUTH_CALLBACK_HTML = `<!DOCTYPE html><html><head><script>
if (window.opener) {
  window.opener.postMessage({ type: 'oauth-success', provider: new URLSearchParams(location.search).get('p') || '' }, window.location.origin)
  window.close()
} else {
  document.body.innerText = '登录成功，请关闭窗口'
}
</script></head><body></body></html>`
