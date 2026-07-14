import { ref } from 'vue'
import { defineStore } from 'pinia'
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import ImageEditor from '@uppy/image-editor'
import ScreenCapture from '@uppy/screen-capture'
import Tus from '@uppy/tus'
import { expireTime_localstorage } from '@3qrain/shared'

export const TUS_CHUNK_SIZE = 1024 * 1024 * 100  // Tus分块大小，100MB
export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error'

export const useUppyStore = defineStore('uppy', () => {
  sweepLocalStorage()
  const uppy = new Uppy()
    .use(ImageEditor)
    // ScreenCapture 需要安全上下文（HTTPS/localhost）。
    // 使用局域网 HTTP 地址访问时会报："Screen recorder access not supported"
    .use(ScreenCapture)
    .use(Tus, { endpoint: '/api/admin/upload/', removeFingerprintOnSuccess: true, chunkSize: TUS_CHUNK_SIZE })
  const uploadStatus = ref<UploadStatus>('idle')
  const uploadProgress = ref(0)
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  function mountDashboard(target: string | HTMLElement, theme: 'light' | 'dark' | 'auto' = 'auto') {
    const existing = uppy.getPlugin('Dashboard')
    if (existing) uppy.removePlugin(existing)
    uppy.use(Dashboard, { inline: true, target, theme })
  }

  function clearResetTimer() {
    if (!resetTimer) return
    clearTimeout(resetTimer)
    resetTimer = null
  }

  function scheduleReset() {
    clearResetTimer()
    resetTimer = setTimeout(() => {
      uploadStatus.value = 'idle'
      uploadProgress.value = 0
      resetTimer = null
    }, 2200)
  }

  uppy.on('upload', () => {
    clearResetTimer()
    if (uploadStatus.value !== 'uploading') uploadProgress.value = 0
    uploadStatus.value = 'uploading'
  })
  uppy.on('progress', progress => {
    uploadProgress.value = Math.max(0, Math.min(100, Math.round(progress || 0)))
    if (uploadStatus.value === 'idle') uploadStatus.value = 'uploading'
  })
  uppy.on('upload-error', () => {
    uploadStatus.value = 'error'
    scheduleReset()
  })
  uppy.on('complete', result => {
    uploadProgress.value = 100
    uploadStatus.value = result.failed?.length ? 'error' : 'done'
    scheduleReset()
  })

  return { uppy, mountDashboard, uploadStatus, uploadProgress }
})

function sweepLocalStorage(): void {
  // 检查localStorage中所有tus上传文件记录是否过期，过期就删，避免日后挤爆localStorage
  const cutoff = Date.now() - expireTime_localstorage
  // 获取所有的tus上传文件记录
  const keys = Object.keys(localStorage).filter(x => x.startsWith('tus::tus-uppy'))
  for (const key of keys) {
    const value = localStorage.getItem(key)
    if (value != null) {
      if (Date.parse(JSON.parse(value).creationTime) < cutoff) {
        localStorage.removeItem(key)
      }
    }
  }
}
