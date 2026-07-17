<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { X } from '@lucide/vue'
import type { CSSProperties } from 'vue'
import type { TiptapNode } from '@3qrain/shared'

const props = defineProps<{ node: TiptapNode }>()

const imageRef = ref<HTMLImageElement | null>(null)
const currentSrc = ref('')
const loaded = ref(false)
const previewOpen = ref(false)

const attrs = computed(() => props.node.attrs || {})
const thumbnailUrl = computed(() => String(attrs.value.thumbnailUrl || ''))
const previewUrl = computed(() => String(attrs.value.previewUrl || ''))
const originalUrl = computed(() => String(attrs.value.url || ''))
const placeholder = computed(() => String(attrs.value.placeholder || ''))
const alt = computed(() => String(attrs.value.alt || ''))
const caption = computed(() => String(attrs.value.caption || ''))
const align = computed(() => String(attrs.value.align || 'center'))

const displayStyle = computed<CSSProperties>(() => {
  const width = Number(attrs.value.displayWidth)
  return {
    width: align.value === 'full' || !Number.isFinite(width) ? '100%' : `${width}px`,
    maxWidth: '100%',
  }
})

const stageStyle = computed<CSSProperties>(() => {
  const width = Number(attrs.value.intrinsicWidth)
  const height = Number(attrs.value.intrinsicHeight)
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? { aspectRatio: `${width} / ${height}` }
    : {}
})

const previewSource = computed(() => previewUrl.value || originalUrl.value || currentSrc.value)

function loadPreview() {
  const nextSource = previewUrl.value || originalUrl.value
  if (!nextSource || nextSource === currentSrc.value) return

  const image = new Image()
  image.onload = async () => {
    currentSrc.value = nextSource
    await nextTick()
    loaded.value = true
  }
  image.src = nextSource
}

function handleLoad() {
  loaded.value = true
  loadPreview()
}

onMounted(() => {
  currentSrc.value = thumbnailUrl.value || previewUrl.value || originalUrl.value
  if (imageRef.value?.complete && imageRef.value.naturalWidth) {
    handleLoad()
  }
})

currentSrc.value = thumbnailUrl.value || previewUrl.value || originalUrl.value
</script>

<template>
  <figure :class="['post-image-block', `align-${align}`]" :style="displayStyle">
    <button
      type="button"
      class="post-image-stage"
      :class="{ loaded }"
      :style="stageStyle"
      title="查看大图"
      @click="previewOpen = true"
    >
      <span
        v-if="placeholder"
        class="post-image-placeholder"
        :style="{ backgroundImage: `url(${placeholder})` }"
      />
      <img
        ref="imageRef"
        :src="currentSrc"
        :alt="alt"
        :width="Number(attrs.intrinsicWidth) || undefined"
        :height="Number(attrs.intrinsicHeight) || undefined"
        loading="lazy"
        decoding="async"
        @load="handleLoad"
      />
    </button>
    <figcaption v-if="caption">{{ caption }}</figcaption>

    <BaseModal v-model:open="previewOpen">
      <div class="image-preview">
        <img :src="previewSource" :alt="alt" />
        <button type="button" title="关闭预览" @click="previewOpen = false">
          <X :size="18" />
        </button>
      </div>
    </BaseModal>
  </figure>
</template>

<style scoped lang="less">
.post-image-block {
  margin-top: 1.75rem;
  margin-bottom: 1.75rem;

  &.align-left { margin-right: auto; }
  &.align-center { margin-right: auto; margin-left: auto; }
  &.align-right { margin-left: auto; }
  &.align-full { width: 100%; }
}

.post-image-stage {
  position: relative;
  width: 100%;
  display: block;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 0.5rem;
  background: var(--color-base-200);
  cursor: zoom-in;
  user-select: none;

  img {
    position: relative;
    width: 100%;
    height: auto;
    display: block;
    opacity: 0;
    transition: opacity 0.35s ease;
  }

  &.loaded img {
    opacity: 1;
  }
}

.post-image-placeholder {
  position: absolute;
  inset: -1rem;
  background-position: center;
  background-size: cover;
  filter: blur(1.25rem);
  transform: scale(1.06);
  opacity: 0.72;
  transition: opacity 0.35s ease;

  .loaded & {
    opacity: 0;
  }
}

figcaption {
  max-width: 32rem;
  margin: 0.625rem auto 0;
  color: var(--color-subtle);
  font-size: 0.75rem;
  line-height: 1.6;
  text-align: center;
}

.image-preview {
  position: relative;
  display: grid;
  place-items: center;

  img {
    display: block;
    max-width: min(92vw, 90rem);
    max-height: 88vh;
    object-fit: contain;
    border-radius: 0.375rem;
    box-shadow: var(--shadow-float);
  }

  button {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 2.25rem;
    height: 2.25rem;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: color-mix(in oklab, black 58%, transparent);
    color: white;
    cursor: pointer;
  }
}
</style>
