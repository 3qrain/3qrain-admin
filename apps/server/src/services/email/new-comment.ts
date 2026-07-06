import { db } from '~/db'
import { comments, users, posts } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { sendEmail } from '~/services/email'
import { renderNewCommentEmail } from '@3qrain/shared'

export async function sendNewCommentEmail(meta: Record<string, any>) {
  const admin = db.select({ username: users.username, email: users.email }).from(users).where(eq(users.role, 'system')).get()
  if (!admin?.email) return

  const comment = db.select({ content: comments.content, userId: comments.userId }).from(comments).where(eq(comments.id, meta.commentId)).get()
  const commenter = db.select({ username: users.username }).from(users).where(eq(users.id, comment?.userId ?? 0)).get()
  const post = db.select({ title: posts.title }).from(posts).where(eq(posts.id, meta.targetId)).get()

  const siteName = admin.username
  const siteUrl = process.env.WEB_URL || ''
  const adminUrl = process.env.ADMIN_URL || ''

  await sendEmail({
    to: admin.email,
    subject: `[${siteName}] 新评论飞来「${post?.title || ''}」`,
    html: renderNewCommentEmail({
      siteName, siteUrl, adminUrl,
      postTitle: post?.title || '',
      commenterName: commenter?.username || '',
      commentContent: comment?.content || '',
    }),
  })
}
