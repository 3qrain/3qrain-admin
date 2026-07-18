<script setup lang="ts">
import { computed, ref } from 'vue'
import { Maximize2, X } from '@lucide/vue'
import Modal from './Modal.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  placeholder?: string
  disabled?: boolean
  rows?: number
  maxlength?: number
  showCount?: boolean
  expandable?: boolean
  expandTitle?: string
}>(), {
  placeholder: '',
  disabled: false,
  rows: 3,
  maxlength: undefined,
  showCount: true,
  expandable: false,
  expandTitle: '编辑内容'
})

const emit = defineEmits<{
  input: [event: Event]
}>()

const model = defineModel<string>({ default: '' })
const expanded = ref(false)
const count = computed(() => model.value.length)

function handleInput(event: Event) {
  model.value = (event.target as HTMLTextAreaElement).value
  emit('input', event)
}
</script>

<template>
  <div :class="['textarea-field', { 'is-disabled': disabled }]">
    <textarea
      v-bind="$attrs"
      :value="model"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxlength"
      class="base-textarea"
      @input="handleInput"
    />

    <div v-if="showCount || expandable" class="textarea-meta">
      <span v-if="showCount" class="textarea-count">
        {{ count }}<template v-if="maxlength"> / {{ maxlength }}</template> 字
      </span>
      <button
        v-if="expandable"
        type="button"
        class="expand-button"
        title="展开编辑"
        aria-label="展开编辑"
        :disabled="disabled"
        @click="expanded = true"
      >
        <Maximize2 :size="13" />
      </button>
    </div>

    <Modal v-if="expandable" v-model:open="expanded">
      <div class="textarea-modal">
        <header class="textarea-modal-head">
          <h3>{{ expandTitle }}</h3>
          <button type="button" title="关闭" aria-label="关闭" @click="expanded = false">
            <X :size="16" />
          </button>
        </header>

        <textarea
          :value="model"
          :placeholder="placeholder"
          :disabled="disabled"
          :maxlength="maxlength"
          class="base-textarea modal-textarea"
          autofocus
          @input="handleInput"
        />

        <footer v-if="showCount" class="textarea-modal-foot">
          {{ count }}<template v-if="maxlength"> / {{ maxlength }}</template> 字
        </footer>
      </div>
    </Modal>
  </div>
</template>

<style scoped lang="less">
.textarea-field {
  position: relative;
  width: 100%;
  min-width: 0;

  > .base-textarea {
    padding-bottom: 1.5rem;
  }

  &:not(.is-disabled):hover > .base-textarea {
    border-color: color-mix(in oklab, var(--color-base-content) 22%, transparent);
  }
}

.base-textarea {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 5rem;
  box-sizing: border-box;
  padding: .5625rem .625rem;
  border: .0625rem solid var(--color-border);
  border-radius: .5rem;
  background: var(--color-base-100);
  color: var(--color-base-content);
  font-family: inherit;
  font-size: .8125rem;
  line-height: 1.55;
  outline: none;
  resize: none;
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
    opacity: .5;
    cursor: not-allowed;
  }
}

.textarea-meta {
  position: absolute;
  right: .0625rem;
  bottom: .0625rem;
  left: .0625rem;
  height: 2.125rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .375rem;
  box-sizing: border-box;
  padding: .5rem .5rem .25rem;
  overflow: hidden;
  border-radius: 0 0 .4375rem .4375rem;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--color-base-100);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #fff 62%);
    mask-image: linear-gradient(to bottom, transparent 0%, #fff 62%);
  }

  > * {
    position: relative;
  }
}

.is-disabled .textarea-meta {
  opacity: .5;

  &::before {
    background: var(--color-base-200);
  }
}

.textarea-count {
  font-size: .6875rem;
  color: color-mix(in oklab, var(--color-base-content) 36%, transparent);
}

.expand-button,
.textarea-modal-head button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
  cursor: pointer;
  transition: color .15s ease;

  &:hover {
    color: var(--color-base-content);
  }

  &:focus-visible {
    outline: .125rem solid color-mix(in oklab, var(--color-primary) 28%, transparent);
    outline-offset: .125rem;
  }
}

.expand-button {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: .3125rem;
  pointer-events: auto;

  &:disabled {
    cursor: not-allowed;
  }
}

.textarea-modal {
  width: min(42rem, calc(100vw - 2rem));
  padding: 1rem;
  border: .0625rem solid var(--color-border);
  border-radius: .5rem;
  background: var(--color-base-100);
  box-shadow: 0 1rem 3rem rgb(0 0 0 / .16);
}

.textarea-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .75rem;

  h3 {
    margin: 0;
    font-size: .875rem;
    font-weight: 650;
  }

  button {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: .375rem;

    &:hover {
      background: var(--color-base-200);
    }
  }
}

.modal-textarea {
  min-height: min(24rem, 52vh);
}

.textarea-modal-foot {
  padding-top: .375rem;
  color: color-mix(in oklab, var(--color-base-content) 36%, transparent);
  font-size: .6875rem;
  text-align: right;
}
</style>
