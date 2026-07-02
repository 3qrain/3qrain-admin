import { githubAuth } from '@hono/oauth-providers/github'
import { setCookie, getCookie } from 'hono/cookie'
import { upsertOAuthUser, createUserSession, OAUTH_CALLBACK_HTML } from './oauth-helpers'
import { config } from '~/env'

const WEB_URL = config.WEB_URL

export async function saveRedirect(c: any, next: any) {
  const to = c.req.query('redirect_to')
  if (to?.startsWith('/')) {
    setCookie(c, 'oauth_redirect', to, { maxAge: 600, httpOnly: true, path: '/' })
    return c.redirect(c.req.path)
  }
  await next()
}

export const githubMiddleware = githubAuth({
  client_id: config.GITHUB_ID,
  client_secret: config.GITHUB_SECRET,
  scope: ['read:user', 'user:email'],
  oauthApp: true
})

export async function githubCallback(c: any) {
  const ghUser = c.get('user-github')
  if (!ghUser?.id) return c.redirect(`${WEB_URL}?error=oauth_failed`)

  const user = upsertOAuthUser('github', ghUser.id, {
    username: ghUser.login ?? '',
    email: ghUser.email ?? '',
    avatarUrl: ghUser.avatar_url ?? ''
  })

  await createUserSession(c, user.id, user.role)

  return c.html(OAUTH_CALLBACK_HTML)
}
