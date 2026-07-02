import { googleAuth } from '@hono/oauth-providers/google'
import { upsertOAuthUser, createUserSession, OAUTH_CALLBACK_HTML } from './oauth-helpers'
import { config } from '~/env'

const WEB_URL = config.WEB_URL

export const googleMiddleware = googleAuth({
  client_id: config.GOOGLE_ID,
  client_secret: config.GOOGLE_SECRET,
  scope: ['openid', 'profile', 'email'],
  redirect_uri: `${WEB_URL}/api/auth/google`,
})

export async function googleCallback(c: any) {
  const gUser = c.get('user-google')
  if (!gUser?.id) return c.redirect(`${WEB_URL}?error=oauth_failed`)

  const user = upsertOAuthUser('google', String(gUser.id), {
    username: gUser.name ?? '',
    email: gUser.email ?? '',
    avatarUrl: gUser.picture ?? '',
  })

  await createUserSession(c, user.id, user.role)

  return c.html(OAUTH_CALLBACK_HTML)
}
