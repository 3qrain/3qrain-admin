<script setup lang="ts">
import '@uppy/core/css/style.min.css'
import '@uppy/dashboard/css/style.min.css'
import '@uppy/image-editor/css/style.min.css'
import '@uppy/screen-capture/css/style.min.css'

import { onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { useUppyStore } from '~/stores/uppy'

const appStore = useAppStore()
const uppyStore = useUppyStore()

onMounted(() => {
  uppyStore.mountDashboard('#uppy-dashboard', appStore.theme === 'system' ? 'auto' : appStore.theme)
})
</script>

<template>
  <div class="uploader">
    <div id="uppy-dashboard"></div>
  </div>
</template>

<style scoped lang="less">
.uploader {
  padding: 0 1.5rem 1.5rem;
  height: 100%;
}
#uppy-dashboard {
  height: 100%;
  :deep(.uppy-Root) {
    height: 100%;
    .uppy-Dashboard {
      display: flex;
      justify-content: center;
      height: 100%;
      .uppy-Dashboard-inner {
        height: 100% !important;
        border-color: rgba(159, 159, 159, 0.3);
        .uppy-Dashboard-AddFiles {
          border-color: rgba(159, 159, 159, 0.3);
        }
      }
    }
  }
}
</style>
