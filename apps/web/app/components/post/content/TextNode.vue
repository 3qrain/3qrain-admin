<script lang="ts">
import { defineComponent, h, type PropType, type VNodeChild } from 'vue'
import type { TiptapMark, TiptapNode } from '@3qrain/shared'

function safeLinkAttrs(mark: TiptapMark) {
  const value = typeof mark.attrs?.href === 'string' ? mark.attrs.href.trim() : ''
  const href = /^(https?:|mailto:|tel:|\/|#)/i.test(value) ? value : ''
  const external = /^https?:\/\//i.test(href)

  return {
    href,
    ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  }
}

export default defineComponent({
  name: 'PostTextNode',
  props: {
    node: {
      type: Object as PropType<TiptapNode>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      let content: VNodeChild = props.node.text || ''

      for (const mark of props.node.marks || []) {
        if (mark.type === 'bold') content = h('strong', [content])
        else if (mark.type === 'italic') content = h('em', [content])
        else if (mark.type === 'strike') content = h('s', [content])
        else if (mark.type === 'underline') content = h('u', [content])
        else if (mark.type === 'code') content = h('code', { class: 'inline-code' }, [content])
        else if (mark.type === 'link') content = h('a', safeLinkAttrs(mark), [content])
      }

      return content
    }
  },
})
</script>
