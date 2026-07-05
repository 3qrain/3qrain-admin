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
  padding: .4375rem .625rem;
  border-radius: .5rem;
  border: .0625rem solid var(--color-border);
  background: var(--color-base-100);
  font-size: .8125rem;
  color: var(--color-base-content);
  outline: none;
  box-sizing: border-box;
  font-family: inherit;

  &::placeholder { opacity: 0.35; }

  &:focus { border-color: var(--color-primary); }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
