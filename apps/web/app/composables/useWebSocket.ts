import { toast } from 'vue-sonner'
import type { WsServerMessage } from '@3qrain/shared'

export function useWebSocket() {
  if (import.meta.server) return

  const store = useAppStore()
  const serverPort = useRuntimeConfig().public.serverPort

  onMounted(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    function connect() {
      const visitorId = store.genVisitorId()
      const url = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.hostname}:${serverPort}/api/ws?visitorId=${visitorId}`
      ws = new WebSocket(url)

      ws.onopen = () => {
        store.wsConnected = false
      }

      ws.onclose = () => {
        store.wsConnected = false
        if (!disposed) reconnectTimer = setTimeout(connect, 3000)
      }

      ws.onmessage = (event) => {
        try {
          const msg: WsServerMessage = JSON.parse(event.data)
          if (msg.type === 'online_count') {
            store.onlineVisitors = msg.data.count
            store.wsConnected = true
            return
          }

          if (msg.type === 'notification') {
            toast(msg.data.title, {
              description: msg.data.content,
              action: {
                label: '查看',
                onClick: () => {
                  if (msg.data.meta) {
                    try {
                      const meta = JSON.parse(msg.data.meta)
                      if (meta.slug) navigateTo(`/posts/${meta.slug}`)
                      else if (meta.noteId) navigateTo('/notes')
                    } catch { navigateTo('/notes') }
                  }
                }
              }
            })
          }
        } catch { /* ignore */ }
      }
    }

    connect()

    onUnmounted(() => {
      disposed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      ws?.close()
      store.wsConnected = false
    })
  })
}
