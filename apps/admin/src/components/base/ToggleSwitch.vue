<script setup lang="ts">
defineProps<{
  ariaLabel?: string
}>()

const model = defineModel<boolean>({ default: false })

function toggle() {
  model.value = !model.value
}
</script>

<template>
  <span class="toggle">
    <input v-model="model" type="checkbox" />
    <span
      class="track"
      role="switch"
      tabindex="0"
      :aria-checked="model"
      :aria-label="ariaLabel"
      @click.prevent="toggle"
      @keydown.space.prevent="toggle"
      @keydown.enter.prevent="toggle"
    />
  </span>
</template>

<style scoped lang="less">
.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
}

.track {
  width: 2.625rem;
  height: 1.5rem;
  border-radius: 62.4375rem;
  background: color-mix(in oklab, var(--color-base-content) 20%, transparent);
  transition: background .2s;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: .1875rem;
    width: 1.125rem;
    height: 1.125rem;
    border-radius: 50%;
    background: var(--color-base-100);
    box-shadow: 0 .0625rem .1875rem rgb(0 0 0 / 0.12);
    transform: translateY(-50%);
    transition: transform .2s ease;
  }
}

input:checked + .track {
  background: var(--color-base-content);

  &::before {
    transform: translateY(-50%) translateX(1.125rem);
  }
}
</style>
