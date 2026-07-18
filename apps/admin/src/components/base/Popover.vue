<script setup lang="ts">
import {
  ref,
  nextTick,
  watch,
  onUnmounted,
} from 'vue'
import {
  computePosition,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  type Placement,
} from '@floating-ui/vue'

const props = withDefaults(
  defineProps<{
    placement?: Placement
    trigger?: 'click' | 'hover'
    showArrow?: boolean
    variant?: 'default' | 'menu'
    width?: string
  }>(),
  {
    placement: 'top-end',
    trigger: 'click',
    showArrow: true,
    variant: 'default',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const open = ref(false)

const triggerRef = ref<HTMLElement>()
const floatingRef = ref<HTMLElement>()
const arrowRef = ref<HTMLElement>()

const floatingStyle = ref<Record<string, string>>({})
const arrowStyle = ref<Record<string, string>>({})

const currentPlacement = ref<Placement>(props.placement)

let cleanupAutoUpdate: (() => void) | null = null
let hoverTimer: number | undefined


async function updatePosition() {
  if (!triggerRef.value || !floatingRef.value) return

  const result = await computePosition(
    triggerRef.value,
    floatingRef.value,
    {
      placement: props.placement,
      middleware: [
        offset(8),
        flip(),
        shift({ padding: 8 }),
        ...(props.showArrow && arrowRef.value
          ? [
              arrow({
                element: arrowRef.value,
              }),
            ]
          : []),
      ],
    },
  )

  currentPlacement.value = result.placement

  floatingStyle.value = {
    left: `${result.x}px`,
    top: `${result.y}px`,
  }

  if (props.showArrow && result.middlewareData.arrow) {
    const { x, y } = result.middlewareData.arrow

    arrowStyle.value = {
      left: x != null ? `${x}px` : '',
      top: y != null ? `${y}px` : '',
    }
  }
}


function startAutoUpdate() {
  if (
    cleanupAutoUpdate ||
    !triggerRef.value ||
    !floatingRef.value
  ) return

  cleanupAutoUpdate = autoUpdate(
    triggerRef.value,
    floatingRef.value,
    updatePosition,
  )
}


function stopAutoUpdate() {
  cleanupAutoUpdate?.()
  cleanupAutoUpdate = null
}


function openPopover() {
  if (open.value) return

  open.value = true
  emit('update:open', true)

  nextTick(() => {
    updatePosition()
    startAutoUpdate()
    addGlobalEvents()
  })
}


function close() {
  if (!open.value) return
  open.value = false
  emit('update:open', false)
  stopAutoUpdate()
  removeGlobalEvents()
}


function toggle() {
  open.value
    ? close()
    : openPopover()
}


// -------------------------
// outside click
// -------------------------

function onPointerDown(e: PointerEvent) {
  const target = e.target as Node

  if (
    triggerRef.value?.contains(target) ||
    floatingRef.value?.contains(target)
  ) {
    return
  }

  close()
}


// -------------------------
// ESC
// -------------------------

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}


let listening = false

function addGlobalEvents() {
  if (listening) return

  listening = true

  document.addEventListener(
    'pointerdown',
    onPointerDown,
  )

  document.addEventListener(
    'keydown',
    onKeydown,
  )
}


function removeGlobalEvents() {
  if (!listening) return

  listening = false

  document.removeEventListener(
    'pointerdown',
    onPointerDown,
  )

  document.removeEventListener(
    'keydown',
    onKeydown,
  )
}


// -------------------------
// hover
// -------------------------

function hoverOpen() {
  if (props.trigger !== 'hover') return

  clearHoverTimer()
  openPopover()
}


function hoverClose() {
  if (props.trigger !== 'hover') return

  hoverTimer = window.setTimeout(() => {
    close()
  }, 100)
}


function clearHoverTimer() {
  if (hoverTimer) {
    window.clearTimeout(hoverTimer)
    hoverTimer = undefined
  }
}


watch(open, (value) => {
  if (!value) {
    clearHoverTimer()
  }
})


onUnmounted(() => {
  stopAutoUpdate()
  removeGlobalEvents()
})


defineExpose({
  close,
})
</script>


<template>
  <div
    class="popover-wrapper"
    @mouseenter="hoverOpen"
    @mouseleave="hoverClose"
  >
    <div
      ref="triggerRef"
      class="trigger"
      @click.stop="props.trigger === 'click' && toggle()"
    >
      <slot />
    </div>


    <Teleport to="body">
      <Transition name="popover">
        <div
          v-if="open"
          ref="floatingRef"
          :class="['popover', `is-${variant}`]"
          :data-side="currentPlacement.split('-')[0]"
          :style="[floatingStyle, width ? { width, minWidth: width } : undefined]"
          @mouseenter="clearHoverTimer"
          @mouseleave="hoverClose"
        >
          <slot
            name="content"
            :close="close"
          />


          <div
            v-if="showArrow"
            ref="arrowRef"
            class="popover-arrow"
            :data-side="currentPlacement.split('-')[0]"
            :style="arrowStyle"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>


<style scoped lang="less">
.popover-wrapper {
  display: inline-flex;
}

.trigger {
  display: inline-flex;
}


.popover {
  position: absolute;
  z-index: 9999;

  min-width: 10rem;

  padding: .75rem;

  border-radius: .5rem;

  background: var(--color-base-100);

  border: .0625rem solid var(--color-border);

  box-shadow:
    0 .5rem 1.5rem rgb(0 0 0 / .12);
}

.popover.is-menu {
  min-width: 13rem;
  padding: 0.375rem;
  border-radius: 0.5rem;
  box-shadow: 0 0.75rem 2rem rgb(0 0 0 / 0.16);
}


/*
  arrow
  Floating UI 推荐：
  一个真实元素，通过 rotate 形成箭头
*/

.popover-arrow {
  position: absolute;

  width: .625rem;
  height: .625rem;

  background: var(--color-base-100);

  border-left: .0625rem solid var(--color-border);
  border-top: .0625rem solid var(--color-border);

  transform: rotate(45deg);
}


.popover-arrow[data-side="bottom"] {
  top: -.35rem;
}

.popover-arrow[data-side="top"] {
  bottom: -.35rem;
  transform: rotate(225deg);
}

.popover-arrow[data-side="right"] {
  left: -.35rem;
  transform: rotate(315deg);
}

.popover-arrow[data-side="left"] {
  right: -.35rem;
  transform: rotate(135deg);
}


/*
 animation
*/

.popover-enter-active,
.popover-leave-active {
  transition:
    opacity .12s ease,
    transform .15s cubic-bezier(
      .34,
      1.56,
      .64,
      1
    );
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: scale(.96);
}
</style>
