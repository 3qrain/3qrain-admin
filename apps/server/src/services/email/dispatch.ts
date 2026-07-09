import type { NotificationType } from '@3qrain/shared'
import { db } from '~/db'
import { notifications } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { enqueue } from './queue'
import { sendNewCommentEmail } from './new-comment'
import { sendNewReplyEmail } from './new-reply'
import { sendFriendApplyEmail } from './friend-apply'

export function dispatchEmail(type: NotificationType, meta: string, notificationId: number) {
  let parsed: Record<string, any>
  try { parsed = JSON.parse(meta) } catch { return }

  const markStatus = async (status: 'sent' | 'failed', error?: string) => {
    db.update(notifications)
      .set({ emailStatus: status, emailError: error || null, emailSentAt: status === 'sent' ? new Date() : null })
      .where(eq(notifications.id, notificationId))
      .run()
  }

  switch (type) {
    case 'new_comment':
      enqueue(async () => {
        try {
          await sendNewCommentEmail(parsed)
          await markStatus('sent')
        } catch (e: any) {
          await markStatus('failed', e.message)
        }
      })
      break
    case 'new_reply':
      enqueue(async () => {
        try {
          await sendNewReplyEmail(parsed)
          await markStatus('sent')
        } catch (e: any) {
          await markStatus('failed', e.message)
        }
      })
      break
    case 'friend_apply':
      enqueue(async () => {
        try {
          await sendFriendApplyEmail(parsed)
          await markStatus('sent')
        } catch (e: any) {
          await markStatus('failed', e.message)
        }
      })
      break
  }
}
