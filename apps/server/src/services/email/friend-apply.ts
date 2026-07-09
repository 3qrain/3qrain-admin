import { db } from '~/db'
import { users } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { sendEmail } from '~/services/email'
import { renderFriendApplyEmail } from '@3qrain/shared'

export async function sendFriendApplyEmail(meta: Record<string, any>) {
  const admin = db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(eq(users.role, 'system'))
    .get()
  if (!admin?.email) return
  const result = z.email().safeParse(admin.email)
  if (!result.success) {
    throw new Error('无效的邮箱地址')
  }

  const siteName = admin.username
  const siteUrl = process.env.WEB_URL || ''
  const adminUrl = process.env.ADMIN_URL || ''

  await sendEmail({
    to: admin.email,
    subject: `[${siteName}] ${meta.siteName} 申请友链`,
    html: renderFriendApplyEmail({
      siteName,
      siteUrl,
      adminUrl,
      applicantName: meta.siteName,
      applicantUrl: meta.siteUrl,
      description: meta.description
    })
  })
}
