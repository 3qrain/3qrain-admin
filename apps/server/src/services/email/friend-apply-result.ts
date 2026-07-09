import { sendEmail } from '~/services/email'
import { renderFriendApplyResultEmail } from '@3qrain/shared'

export async function sendFriendApplyResultEmail(meta: Record<string, any>) {
  const email = meta.applicantEmail
  if (!email?.includes('@')) return

  const siteName = meta.siteName || ''
  const siteUrl = meta.siteUrl || process.env.WEB_URL || ''

  await sendEmail({
    to: email,
    subject: `[${siteName}] 友链申请${meta.approved ? '已通过' : '未通过'}`,
    html: renderFriendApplyResultEmail({
      siteName,
      siteUrl,
      applicantName: siteName,
      approved: meta.approved,
      reason: meta.reason,
    }),
  })
}
