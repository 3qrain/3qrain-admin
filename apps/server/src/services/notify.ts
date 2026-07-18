import { db, redis } from '~/db'
import { notifications } from '~/db/schema'
import type { WsChannelMessage, NotificationPayload, WsScope } from '@3qrain/shared'
import { CHANNEL } from './ws'
import { dispatchEmail } from './email/dispatch'
import { getEmailConfig } from './email'
import type { EmailStatus } from '@3qrain/shared'

interface NotifyInput {
  scope: WsScope
  type: NotificationPayload['type']
  title: string
  content?: string
  meta?: string
  emailStatus?: EmailStatus
}

export async function notify(input: NotifyInput) {
  if (!input.emailStatus) {
    input.emailStatus = getEmailConfig().enabled ? 'pending' : 'failed'
  }
  const record = db.insert(notifications).values(input).returning().get()

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
  if (input.meta && shouldDispatchEmail) dispatchEmail(input.type, input.meta, record.id)

  return record
}

/** 纯实时广播 — 不写 DB，只推 WS */
export async function broadcast(input: Omit<NotifyInput, 'scope'>) {
  const payload: NotificationPayload = {
    id: 0,
    type: input.type,
    title: input.title,
    content: input.content ?? undefined,
    meta: input.meta ?? undefined,
    createdAt: new Date().toISOString()
  }

  const msg: WsChannelMessage = { scope: 'public', payload }
  await redis.publish(CHANNEL, JSON.stringify(msg))
}
