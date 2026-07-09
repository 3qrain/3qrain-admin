import type { Context } from 'hono'
import { db } from '~/db'
import { friendLinks } from '~/db/schema'
import { notify } from '~/services/notify'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { createFriendLinkSchema } from './friend-links.routes'

export async function create(c: Context) {
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
