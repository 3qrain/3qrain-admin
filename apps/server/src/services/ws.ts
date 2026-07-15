import type { Context } from 'hono'
import type { WSContext } from 'hono/ws'
import Redis from 'ioredis'
import type { WsChannelMessage, WsConnected, WsNotification, WsOnlineCount, WsPing, WsPong } from '@3qrain/shared'
import { config } from '~/env'
/* ------------------------------------------------------------------ */
/* 连接管理                                                            */
/* ------------------------------------------------------------------ */

type ConnInfo =
  | { role: 'admin' }
  | { role: 'visitor'; visitorId: string }

const connections = new Map<any, ConnInfo>()

function countByRole(role: ConnInfo['role']): number {
  let n = 0
  for (const info of connections.values()) {
    if (info.role === role) n++
  }
  return n
}

export function getVisitorCount(): number {
  const ids = new Set<string>()
  for (const info of connections.values()) {
    if (info.role === 'visitor') ids.add(info.visitorId)
  }
  return ids.size
}

function broadcastVisitorCount() {
  const message: WsOnlineCount = {
    type: 'online_count',
    data: { count: getVisitorCount() }
  }
  const payload = JSON.stringify(message)

  for (const [raw, info] of connections) {
    if (info.role !== 'visitor') continue
    try { (raw as any).send(payload) } catch { /* ignore */ }
  }
}

/* ------------------------------------------------------------------ */
/* Redis 订阅                                                           */
/* ------------------------------------------------------------------ */

export const CHANNEL = '3qrain:notifications'
const REDIS_URL = config.REDIS_URL || 'redis://localhost:6379'
const subscriber = new Redis(REDIS_URL, { lazyConnect: true })

async function startSubscriber() {
  try {
    await subscriber.connect()
    await subscriber.subscribe(CHANNEL)
    console.log('[ws] subscribed to', CHANNEL)
  } catch (err) {
    console.error('[ws] redis subscribe error:', err)
    setTimeout(startSubscriber, 5000)
  }
}

subscriber.on('message', (channel, message) => {
  if (channel !== CHANNEL || connections.size === 0) return

  try {
    const { scope, payload } = JSON.parse(message) as WsChannelMessage

    const out: WsNotification = { type: 'notification', data: payload }

    for (const [raw, info] of connections) {
      if (scope === 'admin' && info.role !== 'admin') continue
      if (scope === 'public' && info.role !== 'visitor') continue

      try { (raw as any).send(JSON.stringify(out)) } catch { /* ignore */ }
    }
  } catch { /* ignore malformed */ }
})

subscriber.on('error', (err) => {
  console.error('[ws] subscriber error:', err.message)
})

subscriber.on('close', () => {
  console.log('[ws] subscriber connection closed, reconnecting...')
  setTimeout(startSubscriber, 3000)
})

startSubscriber()

/* ------------------------------------------------------------------ */
/* WS handler                                                           */
/* ------------------------------------------------------------------ */

function makeHandler(role: ConnInfo['role']) {
  return (c: Context) => {
    const visitorId = c.req.query('visitorId') || ''

    return {
      onOpen(_evt: Event, ws: WSContext) {
        if (role === 'visitor' && !visitorId) {
          ws.close(4001, 'Missing visitorId')
          return
        }

        const info: ConnInfo = role === 'visitor'
          ? { role: 'visitor', visitorId }
          : { role: 'admin' }

        connections.set(ws.raw, info)

        const connected: WsConnected = { type: 'connected' }
        ws.send(JSON.stringify(connected))
        if (role === 'visitor') broadcastVisitorCount()

        // console.log(`[ws] ${role} connected (size=${connections.size}, admin=${countByRole('admin')}, visitor=${getVisitorCount()})`)
      },

      onClose(_evt: Event, ws: WSContext) {
        const existed = connections.has(ws.raw)
        if (existed) connections.delete(ws.raw)
        if (existed && role === 'visitor') broadcastVisitorCount()
        // console.log(`[ws] ${role} disconnected (existed=${existed}, size=${connections.size}, admin=${countByRole('admin')})`)
      },

      onMessage(evt: MessageEvent, ws: WSContext) {
        try {
          const msg = JSON.parse(evt.data as string) as WsPing
          if (msg.type === 'ping') {
            const pong: WsPong = { type: 'pong' }
            ws.send(JSON.stringify(pong))
          }
        } catch { /* ignore malformed */ }
      },
    }
  }
}

export const adminWsHandler = makeHandler('admin')
export const publicWsHandler = makeHandler('visitor')
