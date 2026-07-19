import { db, redis } from '~/db'
import { notifications } from '~/db/schema'
import type {
  NotificationMetaMap,
  NotificationPayload,
  NotificationType,
  WsChannelMessage,
  WsScope
} from '@3qrain/shared'
import { CHANNEL } from './ws'
import { dispatchEmail } from './email/dispatch'
import type { EmailDispatchInput } from './email/dispatch'
import { getEmailConfig } from './email'
import type { EmailStatus } from '@3qrain/shared'

interface NotifyBase {
  scope: WsScope
  title: string
  content?: string
  emailStatus?: EmailStatus
}

type NotifyInput = {
  [T in NotificationType]: NotifyBase & {
    type: T
    meta?: NotificationMetaMap[T]
  }
}[NotificationType]

type BroadcastInput = Omit<NotifyBase, 'scope' | 'emailStatus'> &
  {
    [T in NotificationType]: {
      type: T
      meta?: NotificationMetaMap[T]
    }
  }[NotificationType]

function dispatchNotificationEmail(
  input: Extract<NotifyInput, { type: EmailDispatchInput['type'] }>,
  notificationId: number
) {
  if (!input.meta) return
  switch (input.type) {
    case 'new_comment':
      dispatchEmail({ type: 'new_comment', meta: input.meta }, notificationId)
      break
    case 'new_reply':
      dispatchEmail({ type: 'new_reply', meta: input.meta }, notificationId)
      break
    case 'friend_apply':
      dispatchEmail({ type: 'friend_apply', meta: input.meta }, notificationId)
      break
    case 'friend_approve':
      dispatchEmail({ type: 'friend_approve', meta: input.meta }, notificationId)
      break
    case 'friend_reject':
      dispatchEmail({ type: 'friend_reject', meta: input.meta }, notificationId)
      break
  }
}

export async function notify(input: NotifyInput) {
  const emailStatus = input.emailStatus ?? (getEmailConfig().enabled ? 'pending' : 'failed')
  const meta = input.meta ? JSON.stringify(input.meta) : null
  const record = db
    .insert(notifications)
    .values({ ...input, meta, emailStatus })
    .returning()
    .get()

  const payload: NotificationPayload = {
    id: record.id,
    type: input.type,
    title: record.title,
    content: record.content ?? undefined,
    meta: record.meta ?? undefined,
    createdAt: new Date(record.createdAt!).toISOString()
  }

  const msg: WsChannelMessage = { scope: input.scope, payload }
  await redis.publish(CHANNEL, JSON.stringify(msg))

  // failed 仍会派发，由发送器回写具体错误；只有无需发送和待审核需要中断。
  const shouldDispatchEmail = record.emailStatus !== 'not_required' && record.emailStatus !== 'pending_review'
  if (shouldDispatchEmail) {
    switch (input.type) {
      case 'new_comment':
      case 'new_reply':
      case 'friend_apply':
      case 'friend_approve':
      case 'friend_reject':
        dispatchNotificationEmail(input, record.id)
    }
  }

  return record
}

/** 纯实时广播 — 不写 DB，只推 WS */
export async function broadcast(input: BroadcastInput) {
  const meta = input.meta ? JSON.stringify(input.meta) : undefined
  const payload: NotificationPayload = {
    id: 0,
    type: input.type,
    title: input.title,
    content: input.content ?? undefined,
    meta,
    createdAt: new Date().toISOString()
  }

  const msg: WsChannelMessage = { scope: 'public', payload }
  await redis.publish(CHANNEL, JSON.stringify(msg))
}
