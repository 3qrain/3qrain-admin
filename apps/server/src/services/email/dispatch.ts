import type { CommentNotificationMeta, NotificationMetaMap } from '@3qrain/shared'
import { db } from '~/db'
import { notifications } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { enqueue } from './queue'
import { sendNewCommentEmail } from './new-comment'
import { sendNewReplyEmail } from './new-reply'
import { sendFriendApplyEmail } from './friend-apply'
import { sendFriendApplyResultEmail } from './friend-apply-result'
import { sendCommentReviewEmail } from './comment-review'

type EmailNotificationType = 'new_comment' | 'new_reply' | 'friend_apply' | 'friend_approve' | 'friend_reject'

export type EmailDispatchInput = {
  [T in EmailNotificationType]: {
    type: T
    meta: NotificationMetaMap[T]
  }
}[EmailNotificationType]

export function dispatchEmail(input: EmailDispatchInput, notificationId?: number) {
  const markStatus = async (status: 'sent' | 'failed', error?: string) => {
    if (notificationId === undefined) return
    db.update(notifications)
      .set({ emailStatus: status, emailError: error || null, emailSentAt: status === 'sent' ? new Date() : null })
      .where(eq(notifications.id, notificationId))
      .run()
  }

  switch (input.type) {
    case 'new_comment':
      enqueue(async () => {
        try {
          await sendNewCommentEmail(input.meta)
          await markStatus('sent')
        } catch (e: any) {
          await markStatus('failed', e.message)
        }
      })
      break
    case 'new_reply':
      enqueue(async () => {
        try {
          await sendNewReplyEmail(input.meta)
          await markStatus('sent')
        } catch (e: any) {
          await markStatus('failed', e.message)
        }
      })
      break
    case 'friend_apply':
      enqueue(async () => {
        try {
          await sendFriendApplyEmail(input.meta)
          await markStatus('sent')
        } catch (e: any) {
          await markStatus('failed', e.message)
        }
      })
      break
    case 'friend_approve':
    case 'friend_reject':
      enqueue(async () => {
        try {
          await sendFriendApplyResultEmail(input.meta)
          await markStatus('sent')
        } catch (e: any) {
          await markStatus('failed', e.message)
        }
      })
      break
  }
}

export function dispatchCommentReviewEmail(meta: CommentNotificationMeta) {
  enqueue(async () => {
    try {
      await sendCommentReviewEmail(meta)
    } catch {
      // 审核提醒不关联通知记录，发送失败不影响评论提交。
    }
  })
}
