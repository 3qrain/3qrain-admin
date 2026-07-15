<script setup lang="ts">
import { onMounted } from 'vue'

const store = useAppStore()
const siteApi = useSiteApi()
const userApi = useUserApi()
useWebSocket()

const { data: siteRes } = await useAsyncData('layout-site', () => siteApi.get())

watch(siteRes, (val) => {
  if (val?.success) store.site = val.data
}, { immediate: true })

onMounted(async () => {
  try {
    const res = await userApi.me()
    store.user = res.data ?? null
  } catch {
    store.user = null
  }
})
</script>

<template>
  <div class="layout">
    <ClientOnly>
      <ThemeSeasonRain />
    </ClientOnly>

    <div class="layout-content">
      <LayoutAppHeader />

      <main class="main">
        <slot />
      </main>

      <LayoutAppFooter />
    </div>
  </div>
</template>

<style scoped lang="less">
.layout {
  position: relative;
  min-height: 100vh;
}

.layout-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  padding-top: var(--header-height);
  width: 100%;
}

</style>
