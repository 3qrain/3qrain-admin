// ---- 通知事件类型（DB 存储，细粒度） ----
export type NotificationType =
  | 'new_comment'
  | 'new_reply'
  | 'friend_apply'
  | 'friend_approve'
  | 'friend_reject'
  | 'new_post'
  | 'new_note'
  | 'system'

// ---- WebSocket 通知体（协议，不绑定 DB 字段） ----
export interface NotificationPayload {
  id: number
  type: NotificationType
  title: string
  content?: string
  meta?: string
  createdAt: string
}

// ---- Redis Pub/Sub ----
export type WsScope = 'admin' | 'public'

export interface WsChannelMessage {
  scope: WsScope
  payload: NotificationPayload
}
