import { toast } from 'vue-sonner'
import type { WsServerMessage } from '@3qrain/shared'

export function useWebSocket() {
  if (import.meta.server) return

  const store = useAppStore()

  onMounted(() => {
    const visitorId = store.genVisitorId()
    const serverPort = useRuntimeConfig().public.serverPort
    const url = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.hostname}:${serverPort}/api/ws?visitorId=${visitorId}`
    const ws = new WebSocket(url)

    ws.onopen = () => console.log('[ws] connected')
    ws.onclose = () => console.log('[ws] disconnected')
    ws.onmessage = (e) => {
      try {
        const msg: WsServerMessage = JSON.parse(e.data)
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
              },
            },
          })
        }
      } catch { /* ignore */ }
    }

    onUnmounted(() => {
      ws.close()
    })
  })
}
