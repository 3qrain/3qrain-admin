<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Menu, Bell } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import Drawer from '~/components/base/Drawer.vue'
import UppyUploader from '~/components/uppy-uploader/UppyUploader.vue'
import UploadIndicator from '~/components/uppy-uploader/UploadIndicator.vue'
import { apiClient } from '~/lib/axios'
import { useGlobalStore, type DrawerPanel } from '~/stores/global.ts'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { applyTheme } from '~/css/themes/index'
import { useWebSocket } from '~/composables/useWebSocket'
import { getUnreadCount } from '~/api/notifications'
import { getPendingFriendLinkCount } from '~/api/friend-links'
import { getConfig, getSiteUrls } from '~/api/config'

const { drawerPanel } = storeToRefs(useGlobalStore())
const appStore = useAppStore()
const router = useRouter()
const { connect, disconnect } = useWebSocket()

const isMobile = ref(false)

const BREAKPOINT = 768

function openPanel(panel: DrawerPanel) {
  drawerPanel.value = panel
}

let mediaQuery: MediaQueryList

async function fetchAdminInfo() {
  try {
    const { data } = await apiClient.get('/admin/profile')
    appStore.adminUser = data.data
  } catch {
    /* 401 拦截器会处理 */
  }
}

async function fetchUnreadCount() {
  try {
    appStore.unreadCount = await getUnreadCount()
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  fetchAdminInfo()
  fetchUnreadCount()
  getPendingFriendLinkCount().then(c => { appStore.pendingFriendLinkCount = c }).catch(() => {})
  getSiteUrls().then(u => { appStore.webUrl = u.webUrl; appStore.adminUrl = u.adminUrl }).catch(() => {})
  getConfig(['appearance', 'email']).then(config => {
    if (config.appearance) {
      appStore.theme = config.appearance.theme
      appStore.emailEnabled = config.email?.enabled ?? false
      applyTheme()
    }
  }).catch(() => {})
  connect()

  mediaQuery = window.matchMedia(`(width <= ${BREAKPOINT}px)`)
  isMobile.value = mediaQuery.matches

  mediaQuery.addEventListener('change', e => {
    isMobile.value = e.matches
    if (!e.matches) drawerPanel.value = null
  })
})

onUnmounted(() => {
  disconnect()
  mediaQuery.removeEventListener('change', () => {})
})
</script>

<template>
  <div class="layout">
    <!-- Desktop Sidebar -->
    <aside class="sidebar">
      <AppSidebar />
    </aside>

    <!-- Mobile Bottom Drawer -->
    <Drawer :open="drawerPanel !== null" @update:open="v => !v && (drawerPanel = null)">
      <AppSidebar v-if="drawerPanel === 'menu'" mobile @close="drawerPanel = null" />
      <UppyUploader v-else-if="drawerPanel === 'upload'" />
    </Drawer>

    <!-- Main -->
    <div class="main-wrapper">
      <header v-if="isMobile" class="header">
        <div class="header-left">
          <button class="header-btn" @click="openPanel('menu')">
            <Menu style="width: 1.375rem; height: 1.375rem" />
          </button>
        </div>
        <div class="header-center">
          <UploadIndicator size="lg" @click="openPanel('upload')" />
        </div>
        <div class="header-right">
          <button class="header-btn notify-btn" @click="router.push('/notifications')">
            <Bell style="width: 1.375rem; height: 1.375rem" />
            <span v-if="appStore.unreadCount > 0" class="notify-badge">
              {{ appStore.unreadCount > 99 ? '99+' : appStore.unreadCount }}
            </span>
          </button>
        </div>
      </header>
      <main id="app-main" class="main">
        <router-view v-slot="{ Component }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped lang="less">
@sidebarWidth: 15rem;

.layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-base-100);
}

/* --- Sidebar --- */
.sidebar {
  width: @sidebarWidth;
  flex-shrink: 0;
  background: var(--color-base-200);
  background: linear-gradient(to right, var(--color-base-200), var(--color-base-100));
  // background: linear-gradient(to right, var(--color-base-100), var(--color-base-200));
  overflow: hidden;
  transition: width 0.3s ease;
}

/* --- Main --- */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: flex-basis 0.3s ease;
}

.header {
  position: relative;
  padding: 0 0.5rem;
  height: 3.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 0.0625rem solid var(--color-border);
  background: var(--color-base-100);
  color: var(--color-base-content);
  .header-left {
    display: flex;
    justify-content: start;
    align-items: center;
  }
  .header-center {
    position: absolute;
    left: 50%;
    top: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.3125rem;
  }
  .header-btn {
    width: 2.75rem;
    height: 2.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    color: inherit;
    background: transparent;
    cursor: pointer;
    position: relative;
  }
  .notify-badge {
    position: absolute;
    top: 0.375rem;
    right: 0.375rem;
    min-width: 1rem;
    height: 1rem;
    padding: 0 0.1875rem;
    border-radius: 62.4375rem;
    background: #ef4444;
    color: #fff;
    font-size: 0.5625rem;
    font-weight: 700;
    line-height: 1rem;
    text-align: center;
  }
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.5rem 1.5rem;
}

/* --- Responsive --- */
@media (width <= 48rem) {
  .main {
    padding: 1.5rem 1.5rem;
  }
  .sidebar {
    width: 0;
  }
}

/* Page transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.12s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
