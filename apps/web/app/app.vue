<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import '~/assets/css/global.css'
import '~/assets/css/themes/index.css'

const appstore = useAppStore()

useHead({
  script: [
    {
      innerHTML: `
        (function () {
          try {
            var r = localStorage.getItem('${APP_STORAGE_KEY}')
            var state = r ? JSON.parse(r) : {}
            var t = state.theme || 'system'
            var s = state.season || 'autumn'

            if (!t || t === 'system') {
              t = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
            }

            document.documentElement.dataset.theme = t
            document.documentElement.dataset.season = s
          } catch (e) {}
        })()
      `
    }
  ]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Toaster position="bottom-right" :theme="appstore.theme" />
  </ClientOnly>
</template>
