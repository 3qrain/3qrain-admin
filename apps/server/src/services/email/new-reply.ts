import { db } from '~/db'
import { comments, users, posts } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { sendEmail } from '~/services/email'
import { renderReplyEmail } from '@3qrain/shared'
import type { CommentNotificationMeta } from '@3qrain/shared'

export async function sendNewReplyEmail(meta: CommentNotificationMeta) {
  const comment = db.select({
    content: comments.content,
    userId: comments.userId,
    replyToUserId: comments.replyToUserId,
  }).from(comments).where(eq(comments.id, meta.commentId)).get()
  if (!comment?.replyToUserId) return

  const repliedCommentId = meta.replyToId || meta.parentId
  if (!repliedCommentId) return
  const repliedComment = db.select({ content: comments.content }).from(comments).where(eq(comments.id, repliedCommentId)).get()
  const replier = db.select({ username: users.username }).from(users).where(eq(users.id, comment.userId)).get()
  const repliedTo = db.select({ username: users.username, email: users.email }).from(users).where(eq(users.id, comment.replyToUserId)).get()
  if (!repliedTo?.email) return

  const post = meta.targetType === 'post'
    ? db.select({ title: posts.title, slug: posts.slug }).from(posts).where(eq(posts.id, meta.targetId)).get()
    : null

  const siteName = process.env.SITE_NAME || '3qrain'
  const siteUrl = process.env.WEB_URL || ''

  await sendEmail({
    to: repliedTo.email,
    subject: `[${siteName}] 您收到了来自 ${replier?.username || ''} 的评论回复`,
    html: renderReplyEmail({
      siteName, siteUrl,
      userName: repliedTo.username,
      replierName: replier?.username || '',
      postTitle: meta.targetType === 'note' ? `说说#${meta.targetId}` : post?.title || '',
      targetPath: meta.targetType === 'note' ? `/notes?id=${meta.targetId}` : `/posts/${post?.slug || ''}`,
      replyContent: comment.content,
      yourComment: repliedComment?.content || '',
    }),
  })
}
