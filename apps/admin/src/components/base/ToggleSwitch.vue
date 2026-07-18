<script setup lang="ts">
const props = defineProps<{
  ariaLabel?: string
  disabled?: boolean
}>()

const model = defineModel<boolean>({ default: false })

function toggle() {
  if (props.disabled) return
  model.value = !model.value
}
</script>

<template>
  <span :class="['toggle', { disabled }]">
    <input v-model="model" type="checkbox" :disabled="disabled" />
    <span
      class="track"
      role="switch"
      :tabindex="disabled ? -1 : 0"
      :aria-checked="model"
      :aria-label="ariaLabel"
      :aria-disabled="disabled"
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

.toggle.disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
