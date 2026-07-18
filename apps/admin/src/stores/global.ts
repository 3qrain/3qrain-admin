import { defineStore } from 'pinia'

interface GlobalState {
  drawerPanel: 'menu' | 'notify' | 'upload' | null
  uploadModalOpen: boolean
}

export const useGlobalStore = defineStore('global', {
  state: (): GlobalState => ({
    drawerPanel: null,
    uploadModalOpen: false
  }),
  getters: {},
  actions: {},
  // persist: true
})

export type DrawerPanel = GlobalState['drawerPanel']
