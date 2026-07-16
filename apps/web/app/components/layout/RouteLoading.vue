<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

const rendered = ref(false)
const active = ref(false)
const nuxtApp = useNuxtApp()

let loadingRequested = false
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined
let safetyTimer: ReturnType<typeof setTimeout> | undefined

function clearTimers() {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  clearTimeout(safetyTimer)
  showTimer = undefined
  hideTimer = undefined
  safetyTimer = undefined
}

async function revealLoading() {
  rendered.value = true
  await nextTick()

  if (loadingRequested) {
    active.value = true
  }
}

function startLoading() {
  clearTimers()
  loadingRequested = true

  if (rendered.value) {
    active.value = true
  } else {
    showTimer = setTimeout(revealLoading, 90)
  }

  safetyTimer = setTimeout(() => {
    finishLoading()
  }, 15000)
}

function finishLoading() {
  loadingRequested = false
  clearTimeout(showTimer)
  clearTimeout(safetyTimer)
  showTimer = undefined
  safetyTimer = undefined

  if (!rendered.value) return
  if (!active.value) {
    if (!hideTimer) {
      rendered.value = false
    }
    return
  }

  active.value = false
  hideTimer = setTimeout(() => {
    hideTimer = undefined
    if (!loadingRequested) {
      rendered.value = false
    }
  }, 180)
}

if (import.meta.client) {
  const removeLoadingStart = nuxtApp.hook('page:loading:start', startLoading)
  const removeLoadingEnd = nuxtApp.hook('page:loading:end', finishLoading)
  const removeAppError = nuxtApp.hook('app:error', finishLoading)

  onBeforeUnmount(() => {
    clearTimers()
    removeLoadingStart()
    removeLoadingEnd()
    removeAppError()
  })
}
</script>

<template>
  <div class="route-switch">
    <Transition name="route-content">
      <div v-show="!rendered" class="route-content">
        <slot />
      </div>
    </Transition>

    <div
      v-if="rendered"
      :class="['route-loading', { active }]"
      role="status"
      aria-label="页面加载中"
    >
      <div class="rain-mark" aria-hidden="true">
        <i class="rain-drop rain-drop-left" />
        <i class="rain-drop rain-drop-main" />
        <i class="rain-drop rain-drop-right" />
        <span class="rain-ripple rain-ripple-first" />
        <span class="rain-ripple rain-ripple-second" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.route-switch {
  display: grid;
  min-width: 0;
}

.route-content,
.route-loading {
  grid-area: 1 / 1;
  min-width: 0;
}

.route-loading {
  display: grid;
  place-items: center;
  min-height: calc(100vh - var(--header-height));
  opacity: 0;
  transition: opacity 0.18s ease;

  &.active {
    opacity: 1;

    .rain-mark {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}

.rain-mark {
  position: relative;
  width: 5.5rem;
  height: 4.5rem;
  color: var(--color-primary);
  opacity: 0;
  transform: translateY(-0.375rem) scale(0.98);
  transition: opacity 0.16s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.rain-drop {
  position: absolute;
  top: 0;
  width: 0.125rem;
  height: 1.5rem;
  border-radius: 999px;
  background: currentColor;
  transform-origin: center bottom;
  animation: rain-fall 1.15s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.rain-drop-main {
  left: calc(50% - 0.0625rem);
}

.rain-drop-left {
  left: calc(50% - 1.25rem);
  height: 1rem;
  opacity: 0.34;
  animation-delay: -0.72s;
}

.rain-drop-right {
  left: calc(50% + 1.2rem);
  height: 0.75rem;
  opacity: 0.22;
  animation-delay: -0.38s;
}

.rain-ripple {
  position: absolute;
  left: 50%;
  bottom: 0.65rem;
  width: 4rem;
  height: 0.8rem;
  border: 0.0625rem solid currentColor;
  border-radius: 50%;
  transform: translateX(-50%) scale(0.2);
  animation: rain-ripple 1.15s ease-out infinite;
}

.rain-ripple-second {
  animation-delay: 0.34s;
}

.route-content-enter-active {
  transition: opacity 0.18s ease;
}

.route-content-leave-active {
  transition: opacity 0.1s ease;
}

.route-content-enter-from {
  opacity: 0;
}

.route-content-leave-to {
  opacity: 0;
}

@keyframes rain-fall {
  0% {
    opacity: 0;
    transform: translateY(-0.5rem) scaleY(0.45);
  }

  24% {
    opacity: 0.7;
  }

  72%,
  100% {
    opacity: 0;
    transform: translateY(2rem) scaleY(0.85);
  }
}

@keyframes rain-ripple {
  0%,
  48% {
    opacity: 0;
    transform: translateX(-50%) scale(0.18);
  }

  54% {
    opacity: 0.46;
  }

  100% {
    opacity: 0;
    transform: translateX(-50%) scale(1);
  }
}
</style>
