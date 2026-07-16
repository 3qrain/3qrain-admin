import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { users, configs } from '~/db/schema'
import { DEFAULT_SITE_INFO } from '~/constants/site-info'
import { ok } from '~/utils/response'
import * as HttpStatusCodes from '~/constants/http-status-codes'

export async function get(c: Context) {
  const systemUser = db.select({
    username: users.username,
    avatarUrl: users.avatarUrl,
  })
    .from(users)
    .where(eq(users.role, 'system'))
    .get()

  const configRow = db.select({ value: configs.value })
    .from(configs)
    .where(eq(configs.key, 'siteInfo'))
    .get()

  let siteInfo = { ...DEFAULT_SITE_INFO }
  if (configRow) {
    try {
      const parsed = JSON.parse(configRow.value) as Record<string, unknown>
      for (const key of Object.keys(siteInfo) as Array<keyof typeof siteInfo>) {
        const value = parsed[key]
        if (typeof value === 'string') siteInfo[key] = value
      }
    } catch { /* ignore */ }
  }

  let avatar = systemUser?.avatarUrl || ''
  if (avatar && avatar.startsWith('/') && !avatar.startsWith('/storage/')) {
    avatar = `/storage${avatar}`
  }

  return c.json(ok({
    name: systemUser?.username || '',
    avatar,
    ...siteInfo,
  }, '获取成功'), HttpStatusCodes.OK)
}
