<script setup lang="ts">
withDefaults(defineProps<{
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}>(), {
  placeholder: "",
  disabled: false,
  type: "text",
});

const model = defineModel<string | number>({ default: '' })
</script>

<template>
  <input
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    class="base-input"
  />
</template>

<style scoped lang="less">
.base-input {
  width: 100%;
  min-width: 0;
  height: 2.25rem;
  padding: .4375rem .625rem;
  border-radius: .5rem;
  border: .0625rem solid var(--color-border);
  background: var(--color-base-100);
  font-size: .8125rem;
  line-height: 1.25;
  color: var(--color-base-content);
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  transition:
    border-color .16s ease,
    background-color .16s ease,
    box-shadow .16s ease;

  &::placeholder {
    color: color-mix(in oklab, var(--color-base-content) 35%, transparent);
  }

  &:hover:not(:disabled) {
    border-color: color-mix(in oklab, var(--color-base-content) 22%, transparent);
  }

  &:focus {
    border-color: color-mix(in oklab, var(--color-primary) 42%, var(--color-border));
    box-shadow: 0 0 0 .1875rem color-mix(in oklab, var(--color-primary) 7%, transparent);
  }

  &:disabled {
    background: var(--color-base-200);
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
