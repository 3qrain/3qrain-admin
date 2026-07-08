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
    // 如果邮件通知开启，那就预先设置改通知邮件状态为pending
    input.emailStatus = getEmailConfig().enabled ? 'pending' : 'failed'
  }
  const record = db.insert(notifications).values(input).returning().get()

  const payload: NotificationPayload = {
    id: record.id,
    type: input.type,
    title: record.title,
    content: record.content ?? undefined,
    meta: record.meta ?? undefined,
    createdAt: new Date(record.createdAt!).toISOString(),
  }

  const msg: WsChannelMessage = { scope: input.scope, payload }
  await redis.publish(CHANNEL, JSON.stringify(msg))

  // 如果传入的emailStatus是not_required，就不需要发送邮件了（管理员发评论）
  if (input.meta && record.emailStatus !== 'not_required') dispatchEmail(input.type, input.meta, record.id)

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
    createdAt: new Date().toISOString(),
  }

  const msg: WsChannelMessage = { scope: 'public', payload }
  await redis.publish(CHANNEL, JSON.stringify(msg))
}
