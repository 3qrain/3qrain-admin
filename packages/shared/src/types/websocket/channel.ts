import type { NotificationPayload } from '../notification'

export type WsScope = 'admin' | 'public'

export interface WsChannelMessage {
  scope: WsScope
  payload: NotificationPayload
}
