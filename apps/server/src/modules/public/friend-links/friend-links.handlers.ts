import type { Context } from 'hono'
import { db } from '~/db'
import { friendLinks } from '~/db/schema'
import { notify } from '~/services/notify'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { createFriendLinkSchema } from './friend-links.routes'
import { eq } from 'drizzle-orm'
import { getConfigValue } from '~/services/config'

export async function listApproved(c: Context) {
  const rows = db.select({
    id: friendLinks.id,
    siteName: friendLinks.siteName,
    siteUrl: friendLinks.siteUrl,
    avatarUrl: friendLinks.avatarUrl,
    description: friendLinks.description,
  }).from(friendLinks).where(eq(friendLinks.status, 'approved')).all()

  return c.json(ok(rows, '获取成功'), HttpStatusCodes.OK)
}

export async function create(c: Context) {
  if (!getConfigValue('friendLinks').applicationEnabled) {
    return c.json(fail(ErrorCode.FEATURE_DISABLED, '友链申请暂时停用'), HttpStatusCodes.FORBIDDEN)
  }

  const parsed = createFriendLinkSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, parsed.error.issues[0].message), HttpStatusCodes.BAD_REQUEST)
  }

  const result = db
    .insert(friendLinks)
    .values({ ...parsed.data, status: 'pending' })
    .returning()
    .get()

  notify({
    scope: 'admin',
    type: 'friend_apply',
    title: `${parsed.data.siteName} 申请友链`,
    emailStatus: result.applicantEmail ? undefined : 'not_required',
    meta: JSON.stringify({
      id: result.id,
      siteName: result.siteName,
      siteUrl: result.siteUrl,
      applicantEmail: result.applicantEmail
    })
  }).catch(() => {})

  return c.json(ok({}, '申请成功'), HttpStatusCodes.CREATED)
}
