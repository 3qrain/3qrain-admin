type Theme = 'system' | 'light' | 'dark'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const APP_STORAGE_KEY = '3qrain:web-app'

export const useAppStore = defineStore('app', {
  state: () => ({
    visitorId: '',
    theme: 'system' as Theme,
    season: 'autumn' as Season,
    onlineVisitors: 0,
    wsConnected: false,
    site: { name: '3qrain', avatar: '', bio: '' },
    user: null as { id: number; username: string; email: string; avatarUrl: string; role: string } | null
  }),
  actions: {
    genVisitorId() {
      //
      if (!this.visitorId) {
        this.visitorId = Date.now().toString(36) + Math.random().toString(36).slice(2)
      }
      return this.visitorId
    }
  },
  persist: { key: APP_STORAGE_KEY, pick: ['visitorId', 'theme', 'season'] }
})
