import type { NotificationPayload } from '../notification'

export interface WsConnected {
  type: 'connected'
}

export interface WsPong {
  type: 'pong'
}

export interface WsOnlineCount {
  type: 'online_count'
  data: {
    count: number
  }
}

export interface WsNotification {
  type: 'notification'
  data: NotificationPayload
}

export type WsServerMessage = WsConnected | WsPong | WsOnlineCount | WsNotification
