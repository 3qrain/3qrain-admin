<script setup lang="ts">
import type { TiptapDocument } from '@3qrain/shared'
import NodeRenderer from './NodeRenderer.vue'

defineProps<{ content: TiptapDocument }>()
</script>

<template>
  <div class="post-content">
    <NodeRenderer
      v-for="(node, index) in content.content"
      :key="index"
      :node="node"
    />
  </div>
</template>

<style lang="less">
.post-content {
  color: var(--color-base-content);
  font-size: 1.03125rem;
  line-height: 1.9;
  overflow-wrap: anywhere;

  > :first-child { margin-top: 0; }
  > :last-child { margin-bottom: 0; }

  p {
    margin: 0.9rem 0;
  }

  h1,
  h2,
  h3 {
    color: var(--color-base-content);
    line-height: 1.35;
    letter-spacing: 0;
    text-wrap: balance;
  }

  h1 {
    margin: 3rem 0 1rem;
    font-size: 1.875rem;
  }

  h2 {
    margin: 2.75rem 0 0.875rem;
    font-size: 1.5rem;
  }

  h3 {
    margin: 2.25rem 0 0.75rem;
    font-size: 1.2rem;
  }

  a {
    color: var(--color-primary);
    text-decoration: underline;
    text-decoration-color: color-mix(in oklab, var(--color-primary) 38%, transparent);
    text-underline-offset: 0.2em;
    transition: text-decoration-color 0.15s ease;

    &:hover {
      text-decoration-color: currentColor;
    }
  }

  strong { font-weight: 750; }

  .inline-code {
    padding: 0.12rem 0.35rem;
    border-radius: 0.25rem;
    background: var(--color-base-200);
    font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace;
    font-size: 0.88em;
  }

  blockquote {
    margin: 1.75rem 0;
    padding: 0.1rem 0 0.1rem 1.1rem;
    border-left: 0.1875rem solid var(--color-primary);
    color: var(--color-muted);

    p { margin: 0.65rem 0; }
  }

  ul,
  ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  ul { list-style: disc; }
  ol { list-style: decimal; }

  li {
    margin: 0.3rem 0;

    &::marker {
      color: var(--color-primary);
      font-weight: 650;
    }
  }

  hr {
    width: 3rem;
    height: 0.0625rem;
    margin: 3rem auto;
    border: 0;
    background: var(--color-border);
  }

  .unsupported-node {
    margin: 1rem 0;
  }
}

@media (max-width: 768px) {
  .post-content {
    font-size: 1rem;
    line-height: 1.85;

    h1 { font-size: 1.625rem; }
    h2 { font-size: 1.375rem; }
    h3 { font-size: 1.125rem; }
  }
}
</style>
