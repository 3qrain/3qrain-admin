<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties, Component } from 'vue'
import type { TiptapNode } from '@3qrain/shared'
import TextNode from './TextNode.vue'
import ImageBlock from './ImageBlock.vue'
import CodeBlock from './CodeBlock.vue'

const props = defineProps<{ node: TiptapNode }>()

const customRenderers: Record<string, Component> = {
  imageBlock: ImageBlock,
  codeBlock: CodeBlock,
}

const tagMap: Record<string, string> = {
  paragraph: 'p',
  heading: 'h2',
  bulletList: 'ul',
  orderedList: 'ol',
  listItem: 'li',
  blockquote: 'blockquote',
}

const customRenderer = computed(() => customRenderers[props.node.type])
const tag = computed(() => {
  if (props.node.type === 'heading') {
    const level = Math.min(3, Math.max(1, Number(props.node.attrs?.level) || 2))
    return `h${level}`
  }
  return tagMap[props.node.type] || 'div'
})

const nodeStyle = computed<CSSProperties>(() => ({
  ...(props.node.attrs?.textAlign ? { textAlign: String(props.node.attrs.textAlign) as CSSProperties['textAlign'] } : {}),
  ...(props.node.attrs?.textIndent ? { textIndent: '2em' } : {}),
}))
</script>

<template>
  <TextNode v-if="node.type === 'text'" :node="node" />
  <br v-else-if="node.type === 'hardBreak'">
  <hr v-else-if="node.type === 'horizontalRule'">
  <component v-else-if="customRenderer" :is="customRenderer" :node="node" />
  <component
    :is="tag"
    v-else
    :class="node.type in tagMap ? undefined : 'unsupported-node'"
    :data-node-type="node.type in tagMap ? undefined : node.type"
    :style="nodeStyle"
  >
    <NodeRenderer
      v-for="(child, index) in node.content || []"
      :key="index"
      :node="child"
    />
  </component>
</template>
