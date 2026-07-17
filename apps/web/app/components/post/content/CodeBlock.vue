<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown, ChevronUp, Code2, Copy } from '@lucide/vue'
import type { TiptapNode } from '@3qrain/shared'

const props = defineProps<{ node: TiptapNode }>()
const collapsedHeight = 416

const copied = ref(false)
const expanded = ref(false)
const contentHeight = ref(collapsedHeight)
const blockElement = ref<HTMLElement | null>(null)
const scrollElement = ref<HTMLElement | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const language = computed(() => String(props.node.attrs?.language || 'text'))
const highlightedHtml = computed(() => String(props.node.attrs?.highlightedHtml || ''))

function getText(node: TiptapNode): string {
  if (node.type === 'text') return node.text || ''
  return node.content?.map(getText).join('') || ''
}

const code = computed(() => getText(props.node))
const collapsible = ref(code.value.split('\n').length > 18)
const viewportStyle = computed(() => ({
  maxHeight: collapsible.value
    ? `${expanded.value ? contentHeight.value : collapsedHeight}px`
    : `${contentHeight.value}px`
}))

function measureContent() {
  const element = scrollElement.value
  if (!element) return

  contentHeight.value = Math.max(element.scrollHeight, collapsedHeight)
  collapsible.value = element.scrollHeight > collapsedHeight + 1
}

function toggleExpanded() {
  if (expanded.value) {
    scrollElement.value?.scrollTo({ top: 0 })
  }
  expanded.value = !expanded.value
}

async function copyCode() {
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1600)
}

onMounted(() => {
  nextTick(measureContent)
})

onBeforeUnmount(() => {
  clearTimeout(copiedTimer)
})
</script>

<template>
  <div ref="blockElement" class="post-code-block">
    <span class="post-code-accent" aria-hidden="true" />

    <div class="post-code-head">
      <span class="post-code-language">
        <Code2 :size="14" />
        {{ language }}
      </span>
      <button type="button" :title="copied ? '已复制' : '复制代码'" @click="copyCode">
        <Check v-if="copied" :size="14" />
        <Copy v-else :size="14" />
        <span>{{ copied ? '已复制' : '复制' }}</span>
      </button>
    </div>

    <div class="post-code-viewport">
      <div
        ref="scrollElement"
        class="post-code-scroll"
        :class="{
          'is-masked': collapsible && !expanded,
          'has-toggle': collapsible
        }"
        :style="viewportStyle"
      >
        <div v-if="highlightedHtml" class="post-code-body" v-html="highlightedHtml" />
        <pre v-else class="post-code-fallback"><code>{{ code }}</code></pre>
      </div>
      <button
        v-if="collapsible"
        type="button"
        class="post-code-toggle"
        :aria-expanded="expanded"
        @click="toggleExpanded"
      >
        <ChevronUp v-if="expanded" :size="14" />
        <ChevronDown v-else :size="14" />
        {{ expanded ? '收起' : '展开' }}
      </button>
    </div>
  </div>
</template>

<style lang="less">
.post-code-block {
  position: relative;
  margin: 1.75rem 0;
  overflow: hidden;
  scroll-margin-top: calc(var(--header-height) + 1rem);
  border-radius: 0.5rem;
  background: var(--color-code-surface);
  box-shadow: var(--shadow-code);
}

.post-code-accent {
  position: absolute;
  inset: 0 0 auto;
  height: 0.125rem;
  background: linear-gradient(
    90deg,
    var(--color-primary),
    color-mix(in oklab, var(--color-primary) 38%, transparent) 42%,
    transparent 78%
  );
  filter: blur(0.9375rem);
}

.post-code-head {
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem 0 1rem;
  color: var(--color-subtle);
  background: var(--color-code-header);
  font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace;
  font-size: 0.6875rem;
  text-transform: uppercase;

  button {
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
    transition:
      color 0.15s ease,
      opacity 0.15s ease;

    &:hover {
      color: var(--color-primary);
      opacity: 1;
    }
  }
}

.post-code-language {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: color-mix(in oklab, var(--color-primary) 78%, var(--color-base-content));
  font-weight: 700;
}

.post-code-viewport {
  position: relative;
}

.post-code-scroll {
  --code-inline-padding: 1rem;
  --code-bottom-padding: 1rem;
  overflow-anchor: none;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklab, var(--color-primary) 30%, transparent) transparent;
  transition: max-height 0.46s cubic-bezier(0.22, 1, 0.36, 1);
}

.post-code-scroll.has-toggle {
  --code-bottom-padding: 2.5rem;
}

.post-code-scroll.is-masked {
  -webkit-mask-image: linear-gradient(#fff0 0%, #fff 3.125rem calc(100% - 3.125rem), #fff0 100%);
  mask-image: linear-gradient(#fff0 0%, #fff 3.125rem calc(100% - 3.125rem), #fff0 100%);
}

.post-code-fallback {
  margin: 0;
  padding: 1.5rem var(--code-inline-padding) var(--code-bottom-padding);
}

.post-code-body .shiki {
  margin: 0;
  padding: 1.5rem var(--code-inline-padding) var(--code-bottom-padding);
  overflow: visible;
  background: transparent !important;
}

.post-code-body .shiki,
.post-code-body .shiki span {
  color: var(--shiki-light);
  font-style: var(--shiki-light-font-style);
  font-weight: var(--shiki-light-font-weight);
  text-decoration: var(--shiki-light-text-decoration);
}

.post-code-body code,
.post-code-fallback code {
  display: block;
  min-width: max-content;
  font-family: ui-monospace, 'SFMono-Regular', 'Cascadia Code', Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.75;
}

.post-code-toggle {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0 0.5rem;
  border: 0;
  background: transparent;
  color: var(--color-subtle);
  font-size: 0.7rem;
  font-weight: 650;
  cursor: pointer;
  transform: translateX(-50%);
  transition: color 0.16s ease;

  &:hover {
    color: var(--color-primary);
  }
}

html[data-theme='dark'] .post-code-body .shiki,
html[data-theme='dark'] .post-code-body .shiki span {
  color: var(--shiki-dark) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}

@media (max-width: 768px) {
  .post-code-head {
    padding-right: 0.625rem;
    padding-left: 0.875rem;
  }

  .post-code-scroll {
    --code-inline-padding: 0.875rem;
    --code-bottom-padding: 0.875rem;
  }
}
</style>
