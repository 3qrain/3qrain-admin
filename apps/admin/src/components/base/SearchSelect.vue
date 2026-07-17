<script setup lang="ts" generic="T extends string | number">
import { computed, nextTick, ref } from 'vue'
import { Check, ChevronDown, Search } from '@lucide/vue'
import type { Placement } from '@floating-ui/vue'
import Popover from './Popover.vue'

interface SelectOption<T> {
  label: string
  value: T
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: readonly SelectOption<T>[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  placement?: Placement
  variant?: 'default' | 'ghost'
}>(), {
  placeholder: '请选择',
  searchPlaceholder: '搜索',
  emptyText: '无匹配选项',
  disabled: false,
  placement: 'bottom-start',
  variant: 'default',
})

const model = defineModel<T>()
const open = ref(false)
const query = ref('')
const searchRef = ref<HTMLInputElement>()

const selectedOption = computed(() => props.options.find(option => option.value === model.value))
const filteredOptions = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase()
  if (!keyword) return props.options
  return props.options.filter(option =>
    option.label.toLocaleLowerCase().includes(keyword)
    || String(option.value).toLocaleLowerCase().includes(keyword),
  )
})

async function handleOpen(value: boolean) {
  open.value = value
  if (!value) return
  query.value = ''
  await nextTick()
  searchRef.value?.focus()
}

function select(option: SelectOption<T>, close: () => void) {
  if (option.disabled) return
  model.value = option.value
  close()
}
</script>

<template>
  <Popover
    :placement="placement"
    :show-arrow="false"
    variant="menu"
    @update:open="handleOpen"
  >
    <button
      type="button"
      class="search-select-trigger"
      :class="[`is-${variant}`, { 'is-open': open }]"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
    >
      <span v-if="$slots.prefix" class="search-select-prefix"><slot name="prefix" /></span>
      <span class="search-select-value">{{ selectedOption?.label || placeholder }}</span>
      <ChevronDown class="search-select-chevron" :size="13" aria-hidden="true" />
    </button>

    <template #content="{ close }">
      <div class="search-select-content">
        <label class="search-select-search">
          <Search :size="13" aria-hidden="true" />
          <input
            ref="searchRef"
            v-model="query"
            type="text"
            :placeholder="searchPlaceholder"
            @keydown.esc.stop.prevent="close"
            @keydown.stop
          >
        </label>

        <div class="search-select-options" role="listbox">
          <button
            v-for="option in filteredOptions"
            :key="String(option.value)"
            type="button"
            role="option"
            :aria-selected="option.value === model"
            :disabled="option.disabled"
            @click="select(option, close)"
          >
            <span>{{ option.label }}</span>
            <Check v-if="option.value === model" :size="13" aria-hidden="true" />
          </button>
          <p v-if="filteredOptions.length === 0" class="search-select-empty">{{ emptyText }}</p>
        </div>
      </div>
    </template>
  </Popover>
</template>

<style scoped lang="less">
.search-select-trigger {
  min-width: 8rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  padding: 0 0.625rem;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-base-100);
  color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
  font: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;

  &.is-ghost {
    min-width: 0;
    height: 1.75rem;
    padding: 0 0.25rem;
    border: 0;
    background: transparent;
  }

  &:hover,
  &.is-open {
    border-color: color-mix(in oklab, var(--color-primary) 42%, transparent);
    color: color-mix(in oklab, var(--color-primary) 80%, var(--color-base-content));
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.search-select-prefix {
  display: inline-flex;
  flex: 0 0 auto;
}

.search-select-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-select-chevron {
  flex: 0 0 auto;
  opacity: 0.65;
  transition: transform 0.18s ease;
}

.is-open .search-select-chevron {
  transform: rotate(180deg);
}

.search-select-content {
  width: 13rem;
  color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
  font-size: 0.75rem;
}

.search-select-search {
  height: 2rem;
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  padding: 0 0.5625rem;
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--color-base-200) 72%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 42%, transparent);
  transition: background 0.15s ease, color 0.15s ease;

  &:focus-within {
    background: var(--color-base-200);
    color: color-mix(in oklab, var(--color-primary) 72%, var(--color-base-content));
  }

  input {
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: color-mix(in oklab, var(--color-base-content) 78%, transparent);
    font: inherit;

    &::placeholder {
      color: color-mix(in oklab, var(--color-base-content) 32%, transparent);
    }
  }
}

.search-select-options {
  max-height: 12rem;
  margin-top: 0.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  button {
    width: 100%;
    min-height: 1.875rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.375rem 0.5625rem;
    border: 0;
    border-radius: 0.3rem;
    background: transparent;
    color: color-mix(in oklab, var(--color-base-content) 66%, transparent);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: background 0.14s ease, color 0.14s ease;

    &:hover {
      background: var(--color-base-200);
      color: color-mix(in oklab, var(--color-base-content) 90%, transparent);
    }

    &[aria-selected='true'] {
      background: color-mix(in oklab, var(--color-primary) 8%, transparent);
      color: color-mix(in oklab, var(--color-primary) 76%, var(--color-base-content));
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.search-select-empty {
  margin: 0;
  padding: 1rem 0.5rem;
  color: color-mix(in oklab, var(--color-base-content) 38%, transparent);
  text-align: center;
}
</style>
