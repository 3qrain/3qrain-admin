import { db } from '~/db'
import { users } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { sendEmail } from '~/services/email'
import { renderFriendApplyResultEmail } from '@3qrain/shared'

export async function sendFriendApplyResultEmail(meta: Record<string, any>) {
  const email = meta.applicantEmail
  const result = z.email().safeParse(email)
  if(!result.success) {
    throw new Error('无效的邮箱地址')
  }

  const admin = db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(eq(users.role, 'system'))
    .get()
  if (!admin?.email) return

  const siteName = admin.username
  const siteUrl = process.env.WEB_URL || ''

  await sendEmail({
    to: email,
    subject: `[${siteName}] 友链申请${meta.approved ? '已通过' : '未通过'}`,
    html: renderFriendApplyResultEmail({
      siteName,
      siteUrl,
      applicantName: meta.siteName,
      approved: meta.approved,
      reason: meta.reason
    })
  })
}
