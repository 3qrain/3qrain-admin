<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { Check, Code2, Copy } from '@lucide/vue'
import { CODE_BLOCK_LANGUAGES } from '@3qrain/shared'
import SearchSelect from '~/components/base/SearchSelect.vue'

const props = defineProps(nodeViewProps)
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const language = computed({
  get: () => String(props.node.attrs.language || 'text'),
  set: value => props.updateAttributes({ language: value }),
})

async function copyCode() {
  await navigator.clipboard.writeText(props.node.textContent)
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1600)
}

onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <NodeViewWrapper as="div" :class="['editor-code-block', { selected: props.selected }]">
    <span class="editor-code-accent" aria-hidden="true" />

    <div class="editor-code-head" contenteditable="false">
      <SearchSelect
        v-model="language"
        :options="CODE_BLOCK_LANGUAGES"
        variant="ghost"
        search-placeholder="搜索语言"
      >
        <template #prefix><Code2 :size="14" /></template>
      </SearchSelect>

      <button type="button" :title="copied ? '已复制' : '复制代码'" @click.stop="copyCode">
        <Check v-if="copied" :size="14" />
        <Copy v-else :size="14" />
        <span style="font-size: .6875rem;">{{ copied ? '已复制' : '复制' }}</span>
      </button>
    </div>

    <pre class="editor-code-scroll"><NodeViewContent
      as="code"
      class="editor-code-content"
      :class="`language-${language}`"
      :data-language="language"
    /></pre>
  </NodeViewWrapper>
</template>

<style lang="less">
html.dark .editor-code-content {
  color: #c9d1d9;

  .hljs-doctag,
  .hljs-keyword,
  .hljs-meta .hljs-keyword,
  .hljs-template-tag,
  .hljs-template-variable,
  .hljs-type,
  .hljs-variable.language_ {
    color: #ff7b72;
  }

  .hljs-title,
  .hljs-title.class_,
  .hljs-title.class_.inherited__,
  .hljs-title.function_ {
    color: #d2a8ff;
  }

  .hljs-attr,
  .hljs-attribute,
  .hljs-literal,
  .hljs-meta,
  .hljs-number,
  .hljs-operator,
  .hljs-variable,
  .hljs-selector-attr,
  .hljs-selector-class,
  .hljs-selector-id {
    color: #79c0ff;
  }

  .hljs-regexp,
  .hljs-string,
  .hljs-meta .hljs-string {
    color: #a5d6ff;
  }

  .hljs-built_in,
  .hljs-symbol {
    color: #ffa657;
  }

  .hljs-comment,
  .hljs-code,
  .hljs-formula {
    color: #8b949e;
  }

  .hljs-name,
  .hljs-quote,
  .hljs-selector-tag,
  .hljs-selector-pseudo {
    color: #7ee787;
  }

  .hljs-subst,
  .hljs-emphasis,
  .hljs-strong {
    color: #c9d1d9;
  }

  .hljs-section {
    color: #1f6feb;
  }

  .hljs-bullet {
    color: #f2cc60;
  }

  .hljs-addition {
    color: #aff5b4;
    background-color: #033a16;
  }

  .hljs-deletion {
    color: #ffdcd7;
    background-color: #67060c;
  }
}
</style>

<style scoped lang="less">
.editor-code-block {
  position: relative;
  margin: 1.75rem 0;
  overflow: hidden;
  border-radius: 0.5rem;
  background: var(--color-base-200);
  box-shadow: 0 0.125rem 0.75rem oklch(24% 0.012 70 / 0.045);
  transition: box-shadow 0.16s ease, outline-color 0.16s ease;

  &.selected {
    outline: 0.125rem solid color-mix(in oklab, var(--color-primary) 48%, transparent);
    outline-offset: 0.125rem;
    box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.18);
  }
}

.editor-code-accent {
  position: absolute;
  inset: 0 0 auto;
  height: 0.125rem;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    var(--color-primary),
    color-mix(in oklab, var(--color-primary) 38%, transparent) 42%,
    transparent 78%
  );
  filter: blur(0.9375rem);
}

.editor-code-head {
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  color: color-mix(in oklab, var(--color-base-content) 58%, transparent);
  background: color-mix(in oklab, var(--color-base-100) 82%, var(--color-base-200));
  font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace;
  font-size: 0.6875rem;
  text-transform: uppercase;

  > button {
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0 0.4rem;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: 0.72;
    transition: color 0.15s ease, opacity 0.15s ease;

    &:hover {
      color: var(--color-primary);
      opacity: 1;
    }
  }
}

.editor-code-scroll {
  margin: 0;
  padding: 0;
  overflow-x: auto;
  background: transparent;
}

.editor-code-content {
  display: block;
  min-width: max-content;
  margin: 0;
  padding: 1.5rem 1rem 1rem;
  background: transparent !important;
  color: #24292e;
  font-family: ui-monospace, 'SFMono-Regular', 'Cascadia Code', Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.75;
  white-space: pre;
  caret-color: var(--color-primary);

  :deep(.hljs-doctag),
  :deep(.hljs-keyword),
  :deep(.hljs-meta .hljs-keyword),
  :deep(.hljs-template-tag),
  :deep(.hljs-template-variable),
  :deep(.hljs-type),
  :deep(.hljs-variable.language_) {
    color: #d73a49;
  }

  :deep(.hljs-title),
  :deep(.hljs-title.class_),
  :deep(.hljs-title.class_.inherited__),
  :deep(.hljs-title.function_) {
    color: #6f42c1;
  }

  :deep(.hljs-attr),
  :deep(.hljs-attribute),
  :deep(.hljs-literal),
  :deep(.hljs-meta),
  :deep(.hljs-number),
  :deep(.hljs-operator),
  :deep(.hljs-variable),
  :deep(.hljs-selector-attr),
  :deep(.hljs-selector-class),
  :deep(.hljs-selector-id) {
    color: #005cc5;
  }

  :deep(.hljs-regexp),
  :deep(.hljs-string),
  :deep(.hljs-meta .hljs-string) {
    color: #032f62;
  }

  :deep(.hljs-built_in),
  :deep(.hljs-symbol) {
    color: #e36209;
  }

  :deep(.hljs-comment),
  :deep(.hljs-code),
  :deep(.hljs-formula) {
    color: #6a737d;
  }

  :deep(.hljs-name),
  :deep(.hljs-quote),
  :deep(.hljs-selector-tag),
  :deep(.hljs-selector-pseudo) {
    color: #22863a;
  }

  :deep(.hljs-subst),
  :deep(.hljs-emphasis),
  :deep(.hljs-strong) {
    color: #24292e;
  }

  :deep(.hljs-section) {
    color: #005cc5;
    font-weight: 700;
  }

  :deep(.hljs-bullet) {
    color: #735c0f;
  }

  :deep(.hljs-emphasis) {
    font-style: italic;
  }

  :deep(.hljs-strong) {
    font-weight: 700;
  }

  :deep(.hljs-addition) {
    color: #22863a;
    background-color: #f0fff4;
  }

  :deep(.hljs-deletion) {
    color: #b31d28;
    background-color: #ffeef0;
  }
}
</style>
