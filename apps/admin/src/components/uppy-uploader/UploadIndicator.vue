<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, CloudCheck, CloudUpload } from '@lucide/vue'
import { useUppyStore } from '~/stores/uppy'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'md'
  }
)

const emit = defineEmits<{
  click: []
}>()

const uppyStore = useUppyStore()

const progress = computed(() => uppyStore.uploadProgress)
const status = computed(() => uppyStore.uploadStatus)
const isUploading = computed(() => status.value === 'uploading')
const isDone = computed(() => status.value === 'done')
const isError = computed(() => status.value === 'error')
const iconSize = computed(() => {
  if (props.size === 'sm') return 18
  if (props.size === 'lg') return 23
  return 21
})
const progressScale = computed(() => Math.max(0, Math.min(1, progress.value / 100)))
const title = computed(() => {
  if (isUploading.value) return `上传中 ${progress.value}%`
  if (isDone.value) return '上传完成'
  if (isError.value) return '上传失败'
  return '上传文件'
})
</script>

<template>
  <button
    type="button"
    :class="['upload-indicator', props.size, status]"
    :title="title"
    :aria-label="title"
    @click="emit('click')"
  >
    <span class="center">
      <Transition name="swap" mode="out-in">
        <CloudCheck v-if="isDone" key="done" :size="iconSize" class="done-icon" />
        <AlertCircle v-else-if="isError" key="error" :size="iconSize" class="error-icon" />
        <CloudUpload v-else key="upload" :size="iconSize" class="upload-icon" />
      </Transition>
    </span>

    <span
      v-if="status !== 'idle'"
      class="progress-track"
      aria-hidden="true"
    >
      <span class="progress-fill" :style="{ transform: `scaleX(${progressScale})` }" />
    </span>
  </button>
</template>

<style scoped lang="less">
.upload-indicator {
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.66;
  transition:
    color 0.18s,
    opacity 0.15s,
    scale 0.12s;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    opacity: 1;
  }

  &:active {
    scale: 0.96;
  }

  &.sm {
    width: 2.1875rem;
    height: 2.1875rem;
  }

  &.md {
    width: 2.5rem;
    height: 2.5rem;
  }

  &.lg {
    width: 2.75rem;
    height: 2.75rem;
  }

  &.uploading,
  &.done,
  &.error {
    opacity: 1;
  }

  &.uploading {
    color: var(--color-primary);
  }

  &.done {
    color: var(--color-success);
  }

  &.error {
    color: #ef4444;
  }
}

.center {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  stroke-width: 1.9;
  transition:
    opacity 0.18s,
    transform 0.18s;

  .uploading & {
    animation: upload-drift 1.45s ease-in-out infinite;
  }
}

.done-icon {
  stroke-width: 1.95;
  animation: done-settle 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.error-icon {
  stroke-width: 1.95;
}

.progress-track {
  position: absolute;
  left: 50%;
  bottom: 0.375rem;
  width: 1.25rem;
  height: 0.125rem;
  overflow: hidden;
  border-radius: 62.4375rem;
  background: color-mix(in oklab, currentColor 18%, transparent);
  transform: translateX(-50%);

  .lg & {
    bottom: 0.4375rem;
    width: 1.5rem;
  }

  .sm & {
    bottom: 0.3125rem;
    width: 1.125rem;
  }
}

.progress-fill {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: currentColor;
  transform-origin: left center;
  transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1);

  .uploading &::after {
    position: absolute;
    top: 0;
    right: -0.25rem;
    width: 0.5rem;
    height: 100%;
    border-radius: inherit;
    background: currentColor;
    content: '';
    filter: blur(0.125rem);
    opacity: 0.5;
  }
}

.swap-enter-active,
.swap-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}

.swap-enter-from,
.swap-leave-to {
  opacity: 0;
  transform: translateY(0.1875rem);
}

@keyframes upload-drift {
  0%,
  100% {
    opacity: 0.9;
    transform: translateY(0);
  }

  45% {
    opacity: 1;
    transform: translateY(-0.125rem);
  }
}

@keyframes done-settle {
  from {
    opacity: 0;
    transform: translateY(0.125rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .upload-icon,
  .done-icon,
  .swap-enter-active,
  .swap-leave-active {
    animation: none;
    transition: none;
  }
}
</style>
