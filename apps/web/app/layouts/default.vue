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
    <LayoutAppHeader />

    <main class="main">
      <slot />
    </main>

    <LayoutAppFooter />
  </div>
</template>

<style scoped lang="less">
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  padding-top: 5.5rem;
  width: 100%;
}

@media (max-width: 720px) {
  .main {
    padding-top: 4.75rem;
  }
}
</style>
