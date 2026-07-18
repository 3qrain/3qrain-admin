<script setup lang="ts">
import { Loader } from '@lucide/vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'neutral'
    size?: 'sm' | 'md'
    icon?: boolean
    loading?: boolean
    disabled?: boolean
    active?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    icon: false,
    loading: false,
    disabled: false,
    active: false
  }
)
</script>

<template>
  <button :disabled="disabled || loading" :class="['btn', variant, size, { active, icon, loading }]">
    <span class="content" :class="{ invisible: loading }">
      <slot />
    </span>
    <Loader
      v-if="loading"
      :style="size === 'sm' ? { height: '.8125rem', width: '.8125rem' } : { height: '.9375rem', width: '.9375rem' }"
      class="spin loader"
    />
  </button>
</template>

<style scoped lang="less">
.btn {
  --fade-in-duration: 0.3s;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  font-family: inherit;
  outline: none;
  border: 0.0625rem solid transparent;
  border-radius: 0.25rem;
  user-select: none;
  transition:
    background 0.2s,
    opacity 0.2s,
    scale 0.12s,
    box-shadow 0.2s;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &.loading:disabled {
    opacity: 0.75;
    cursor: default;
  }
  &:active:not(:disabled) {
    scale: 0.97;
  }
  &:focus-visible {
    box-shadow: 0 0 0 0.125rem color-mix(in oklab, var(--color-primary) 40%, transparent);
  }
}

.content {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  opacity: 1;
  transition: opacity var(--fade-in-duration);
  &.invisible {
    opacity: 0.3;
  }
}

.loader {
  position: absolute;
}

.spin {
  animation: spin 1s linear infinite, fadeIn var(--fade-in-duration);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* sizes */
.sm {
  height: 1.75rem;
  padding: 0 0.75rem;
  font-size: 0.75rem;
}
.md {
  padding: 0.4375rem 1rem;
  font-size: 0.8125rem;
}

.icon {
  &.sm {
    width: 1.75rem;
    padding: 0;
  }
  &.md {
    padding: 0.4375rem;
  }
}

/* variants */
.primary {
  background: var(--color-primary);
  color: var(--color-primary-content);
  border-color: var(--color-primary);
  box-shadow: 0 0.125rem 0.1875rem -0.125rem var(--color-primary);
  &:hover:not(:disabled) {
    opacity: 0.88;
  }
}

.secondary {
  background: var(--color-base-200);
  color: var(--color-base-content);
  border-color: var(--color-border);
  box-shadow: 0 0.125rem 0.1875rem -0.125rem var(--color-base-200);
  &:hover:not(:disabled) {
    background: var(--color-base-300);
  }
}

.ghost {
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.5;

  &:hover:not(:disabled) {
    opacity: 0.8;
    background: var(--color-base-300);
    box-shadow: 0 0.125rem 0.1875rem -0.125rem var(--color-base-300);
  }

  &.active {
    opacity: 1;
    background: var(--color-base-300);
    box-shadow: 0 0.125rem 0.1875rem -0.125rem var(--color-base-300);
  }
}

.neutral {
  background: var(--color-neutral);
  color: var(--color-neutral-content);
  border-color: var(--color-border);
  box-shadow: 0 0.125rem 0.1875rem -0.125rem var(--color-neutral);
  &:hover:not(:disabled) {
    opacity: 0.88;
  }
}

.danger {
  background: color-mix(in oklab, var(--color-error) 10%, transparent);
  color: var(--color-error);
  border-color: color-mix(in oklab, var(--color-error) 20%, transparent);
  box-shadow: 0 0.0625rem 0.1875rem -0.125rem var(--color-error);

  &:hover:not(:disabled) {
    background: color-mix(in oklab, var(--color-error) 18%, transparent);
    border-color: color-mix(in oklab, var(--color-error) 35%, transparent);
  }
}

.success {
  background: var(--color-success);
  color: var(--color-success-content);
  border-color: var(--color-success);
  box-shadow: 0 0.125rem 0.1875rem -0.125rem var(--color-success);

  &:hover:not(:disabled) {
    opacity: 0.88;
  }
}
</style>
