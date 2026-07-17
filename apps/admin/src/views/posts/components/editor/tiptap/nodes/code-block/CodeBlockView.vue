<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { Code2 } from '@lucide/vue'
import { CODE_BLOCK_LANGUAGES } from '@3qrain/shared'

const props = defineProps(nodeViewProps)
</script>

<template>
  <NodeViewWrapper as="div" :class="['code-block', { selected }]">
    <div class="head" contenteditable="false">
      <span class="label">
        <Code2 :size="14" />
        Code
      </span>
      <select
        :value="props.node.attrs.language || 'text'"
        @change="props.updateAttributes({ language: ($event.target as HTMLSelectElement).value })"
      >
        <option v-for="item in CODE_BLOCK_LANGUAGES" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
    </div>
    <pre><NodeViewContent as="code" :class="`language-${props.node.attrs.language || 'text'}`" :data-language="props.node.attrs.language || 'text'" /></pre>
  </NodeViewWrapper>
</template>

<style scoped lang="less">
.code-block {
  margin: 1rem 0;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--color-base-200);

  &.selected {
    outline: 0.125rem solid color-mix(in oklab, var(--color-primary) 55%, transparent);
  }
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 0.0625rem solid var(--color-border);
  background: color-mix(in oklab, var(--color-base-300) 62%, transparent);
}

.label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.65;
}

select {
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-base-100);
  color: var(--color-base-content);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  outline: none;
}

pre {
  margin: 0;
  padding: 0;
  overflow-x: auto;
  background: transparent;
}

code {
  display: block;
  padding: 1rem;
  font-family: "SF Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace;
  font-size: 0.875rem;
  line-height: 1.7;
  white-space: pre;

  :deep(.hljs-keyword),
  :deep(.hljs-selector-tag),
  :deep(.hljs-built_in) {
    color: #c678dd;
  }

  :deep(.hljs-string),
  :deep(.hljs-attr),
  :deep(.hljs-symbol) {
    color: #98c379;
  }

  :deep(.hljs-title),
  :deep(.hljs-name),
  :deep(.hljs-section) {
    color: #61afef;
  }

  :deep(.hljs-number),
  :deep(.hljs-literal),
  :deep(.hljs-variable) {
    color: #d19a66;
  }

  :deep(.hljs-comment),
  :deep(.hljs-quote) {
    color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
    font-style: italic;
  }
}
</style>
