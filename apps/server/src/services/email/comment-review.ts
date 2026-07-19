import type { CommentNotificationMeta } from '@3qrain/shared'
import { renderCommentReviewEmail } from '@3qrain/shared'
import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { posts, users } from '~/db/schema'
import { sendEmail } from '~/services/email'

export async function sendCommentReviewEmail(meta: CommentNotificationMeta) {
  const admin = db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(eq(users.role, 'system'))
    .get()
  if (!admin?.email) return

  const post =
    meta.targetType === 'post'
      ? db.select({ title: posts.title }).from(posts).where(eq(posts.id, meta.targetId)).get()
      : null
  const targetTitle = meta.targetType === 'note' ? `说说#${meta.targetId}` : post?.title || ''
  const siteName = admin.username
  const siteUrl = process.env.WEB_URL || ''
  const adminUrl = process.env.ADMIN_URL || ''

  await sendEmail({
    to: admin.email,
    subject: `[${siteName}] 有评论等待审核`,
    html: renderCommentReviewEmail({ siteName, siteUrl, adminUrl, targetTitle })
  })
}
