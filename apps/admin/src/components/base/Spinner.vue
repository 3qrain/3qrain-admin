<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'

withDefaults(defineProps<{
  size?: number
}>(), {
  size: 24
})
</script>

<template>
  <LoaderCircle :size="size" class="spinner" aria-hidden="true" />
</template>

<style scoped lang="less">
.spinner {
  opacity: 0.1;
  animation: spinner-rotate 1s linear infinite, spinner-fade-in 0.3s ease-in-out;
}

@keyframes spinner-fade-in {
  from { opacity: 0; }
  to { opacity: 0.1; }
}

@keyframes spinner-rotate {
  to { transform: rotate(360deg); }
}
</style>
