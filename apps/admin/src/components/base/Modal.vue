<script setup lang="ts">
import { watch } from 'vue'
const props = withDefaults(
  defineProps<{
    borderRadius?: string
  }>(),
  {
    borderRadius: '0.5rem'
  }
)

const open = defineModel<boolean>('open', { default: false })

watch(open, value => {
  if (value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="overlay" @click.self="open = false">
        <div class="modal-inner" :style="{ '--modal-border-radius': borderRadius }" @click.stop>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="less">
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgb(0 0 0 / 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-inner {
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 10rem);
  overflow-y: auto;
  border-radius: var(--modal-border-radius);
  > :first-child {
    border-radius: var(--modal-border-radius);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal-inner {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-inner {
    transform: scale(0.95);
  }
}
</style>
