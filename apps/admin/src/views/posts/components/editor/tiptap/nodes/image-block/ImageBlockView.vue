<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { Image as ImageIcon } from '@lucide/vue'

const props = defineProps(nodeViewProps)

const attrs = computed(() => props.node.attrs)
const loaded = ref(false)
const resizing = ref(false)
const frameRef = ref<HTMLElement | null>(null)
let startX = 0
let startWidth = 0
let resizeSign = 1
let activePointerId: number | null = null

const displayStyle = computed(() => {
  const width = attrs.value.displayWidth ? `${attrs.value.displayWidth}px` : 'min(100%, 45rem)'
  return {
    width: attrs.value.align === 'full' ? '100%' : width,
    maxWidth: '100%'
  }
})

function startResize(e: PointerEvent, side: 'left' | 'right') {
  if (attrs.value.align === 'full') return
  resizing.value = true
  startX = e.clientX
  resizeSign = side === 'left' ? -1 : 1
  activePointerId = e.pointerId
  startWidth = frameRef.value?.getBoundingClientRect().width || attrs.value.displayWidth || 480
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  window.addEventListener('pointermove', onResize)
  window.addEventListener('pointerup', stopResize)
  window.addEventListener('pointercancel', stopResize)
}

function onResize(e: PointerEvent) {
  if (!resizing.value) return
  e.preventDefault()
  const next = Math.max(120, Math.round(startWidth + (e.clientX - startX) * resizeSign * 2))
  props.updateAttributes({ displayWidth: next })
}

function stopResize(e?: PointerEvent) {
  if (e && activePointerId !== null) {
    try {
      ;(e.target as HTMLElement)?.releasePointerCapture?.(activePointerId)
    } catch {
      /* ignore */
    }
  }
  resizing.value = false
  activePointerId = null
  window.removeEventListener('pointermove', onResize)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)
}

onBeforeUnmount(stopResize)
</script>

<template>
  <NodeViewWrapper
    as="figure"
    :class="['image-block', `align-${attrs.align}`, { selected, resizing }]"
    data-type="image-block"
  >
    <div ref="frameRef" class="frame" :style="displayStyle">
      <div
        class="image-wrap"
        :class="{ loaded }"
        :style="attrs.placeholder ? { '--placeholder': `url(${attrs.placeholder})` } : {}"
        contenteditable="false"
      >
        <img
          v-if="attrs.url"
          :src="attrs.previewUrl || attrs.thumbnailUrl || attrs.url"
          :alt="attrs.alt"
          draggable="false"
          @load="loaded = true"
        />
        <div v-else class="empty-image">
          <ImageIcon :size="24" />
        </div>
      </div>
      <button v-if="attrs.align !== 'full'" class="resize-handle left" contenteditable="false" @pointerdown.prevent="startResize($event, 'left')" />
      <button v-if="attrs.align !== 'full'" class="resize-handle right" contenteditable="false" @pointerdown.prevent="startResize($event, 'right')" />
    </div>

    <input
      class="caption"
      :value="attrs.caption"
      placeholder="添加图片说明"
      @input="updateAttributes({ caption: ($event.target as HTMLInputElement).value })"
    />
  </NodeViewWrapper>
</template>

<style scoped lang="less">
.image-block {
  position: relative;
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &.align-left {
    align-items: flex-start;
  }

  &.align-center {
    align-items: center;
  }

  &.align-right {
    align-items: flex-end;
  }

  &.align-full {
    align-items: stretch;
  }

  &.selected .frame {
    outline: 0.125rem solid color-mix(in oklab, var(--color-primary) 65%, transparent);
  }
}

.frame {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  // transition: outline-color 0.15s;
}

.image-wrap {
  position: relative;
  width: 100%;
  background: var(--color-base-200);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: var(--placeholder);
    background-position: center;
    background-size: cover;
    filter: blur(1.25rem);
    transform: scale(1.08);
    opacity: 0.75;
    transition: opacity 0.25s;
  }

  &.loaded::before {
    opacity: 0;
  }

  img {
    position: relative;
    display: block;
    width: 100%;
    height: auto;
    user-select: none;
  }
}

.empty-image {
  min-height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-base-content);
  opacity: 0.3;
}

.resize-handle {
  position: absolute;
  top: 50%;
  width: 1.5rem;
  height: 3rem;
  border: none;
  border-radius: 0;
  background: transparent;
  opacity: 0;
  cursor: ew-resize;
  transform: translateY(-50%);
  transition: opacity 0.12s;
  touch-action: none;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 0.1875rem;
    height: 1.75rem;
    border-radius: 999px;
    background: var(--color-primary);
    transform: translateY(-50%);
    box-shadow: 0 0 0 0.0625rem color-mix(in oklab, var(--color-primary) 25%, transparent);
  }

  &.left {
    left: 0.125rem;

    &::after {
      left: 0.25rem;
    }
  }

  &.right {
    right: 0.125rem;

    &::after {
      right: 0.25rem;
    }
  }
}

.selected .resize-handle,
.resizing .resize-handle {
  opacity: 0.85;
}

.caption {
  width: min(100%, 32rem);
  align-self: center;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-base-content);
  font-size: 0.8125rem;
  line-height: 1.5;
  text-align: center;
  opacity: 0.55;

  &::placeholder {
    opacity: 0.45;
  }

  &:focus {
    opacity: 1;
  }
}
</style>
