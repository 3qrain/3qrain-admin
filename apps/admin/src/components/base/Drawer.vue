<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    open?: boolean
    height?: string
    showHandle?: boolean
  }>(),
  {
    height: '75vh',
    showHandle: true
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const drawerRef = ref<HTMLElement>()

function close() {
  emit('update:open', false)
}

// --- drag ---
let startY = 0

function getClientY(e: TouchEvent | MouseEvent) {
  return 'touches' in e ? e.touches[0].clientY : e.clientY
}

function onDragStart(e: TouchEvent | MouseEvent) {
  // 避免a标签等拖动导致drawer的拖动异常
  // const target = e.target as HTMLElement | null
  // if (target && ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return

  startY = getClientY(e)
  if (drawerRef.value) drawerRef.value.style.transition = 'none'
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('touchend', onDragEnd)
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: TouchEvent | MouseEvent) {
  e.preventDefault()
  const delta = getClientY(e) - startY
  if (delta <= 0) return
  if (drawerRef.value) {
    drawerRef.value.style.transform = `translateY(${delta}px)`
  }
}

function onDragEnd(e: TouchEvent | MouseEvent) {
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)

  const el = drawerRef.value
  if (!el) return
  const delta = ('changedTouches' in e ? e.changedTouches[0].clientY : e.clientY) - startY

  if (delta > el.offsetHeight * 0.25) {
    el.style.transition = 'transform 0.3s ease'
    el.style.transform = 'translateY(100%)'
    el.addEventListener('transitionend', () => emit('update:open', false), { once: true })
  } else {
    el.style.transition = 'transform 0.3s ease'
    el.style.transform = ''
  }
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="overlay" @click="close" @touchmove.prevent />
  </Transition>

  <Transition name="drawer">
    <aside v-if="open" ref="drawerRef" class="drawer">
      <div class="drawer-header" @touchstart="onDragStart" @mousedown="onDragStart">
        <div v-if="showHandle" class="drawer-handle" />
        <slot name="header" />
      </div>
      <div class="drawer-content">
        <slot />
      </div>
    </aside>
  </Transition>
</template>

<style scoped lang="less">
.overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  z-index: 40;
}

.drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: v-bind(height);
  background: var(--color-base-200);
  border-top-left-radius: 1.25rem;
  border-top-right-radius: 1.25rem;
  box-shadow:
    0 -0.625rem 1.875rem rgb(0 0 0 / 0.12),
    0 -0.125rem .625rem rgb(0 0 0 / 0.08);
  z-index: 50;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  * {
    user-select: none;
  }
  a {
    pointer-events: none;
  }
}

.drawer-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: .75rem 1rem;
  flex-shrink: 0;
  cursor: grab;
}

.drawer-handle {
  width: 3rem;
  height: .3125rem;
  border-radius: 62.4375rem;
  background: rgb(120 120 120 / 0.35);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
}

/* --- Transitions --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(100%);
}
</style>
