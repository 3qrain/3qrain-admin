<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import TiptapFloatingMenu from './menus/TiptapFloatingMenu.vue'
import TiptapBubbleMenu from './menus/TiptapBubbleMenu.vue'
import type { Editor } from '@tiptap/vue-3'
import { ImageBlock, mediaToImageBlockAttrs } from './nodes/image-block'
import MediaPickerModal from './nodes/image-block/MediaPickerModal.vue'
import type { MediaItem } from '~/api/media'
import { CodeBlock } from './nodes/code-block'

const props = defineProps<{ initialContent?: object }>()
const emit = defineEmits<{ (e: 'dirty'): void }>()
const showMediaPicker = ref(false)

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
      dropcursor: { color: 'var(--color-primary)' }
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ImageBlock,
    CodeBlock,
  ],
  content: props.initialContent,
  onUpdate: () => emit('dirty')
})

function getContent() {
  if (!editor.value) return {}
  return {
    json: editor.value.getJSON(),
    html: editor.value.getHTML(),
    text: editor.value.getText()
  }
}

function addLink(e?: Editor) {
  const ed = e || editor.value
  if (!ed) return
  const url = prompt('链接地址')
  if (url) ed.chain().focus().setLink({ href: url }).run()
}

function addImage(e?: Editor) {
  if (!e && !editor.value) return
  showMediaPicker.value = true
}

function insertMediaImage(item: MediaItem) {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus().insertContent({
    type: 'imageBlock',
    attrs: mediaToImageBlockAttrs(item)
  }).run()
}

onBeforeUnmount(() => editor.value?.destroy())
defineExpose({ getContent, editor })
</script>

<template>
  <TiptapFloatingMenu v-if="editor" :editor="editor" @add-image="addImage()" />
  <TiptapBubbleMenu v-if="editor" :editor="editor" @add-link="addLink()" />
  <EditorContent :editor="editor" class="tiptap-content" />
  <MediaPickerModal v-model:open="showMediaPicker" @select="insertMediaImage" />
</template>

<style scoped lang="less">
.tiptap-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.tiptap-content {
  flex: 1;
  padding-top: 1rem;
  position: relative;

  :deep(.ProseMirror) {
    min-height: 50vh;
    outline: none;
    // >=1rem 防止手机浏览器，编辑正文时放大网页
    // font-size: 1rem;
    // line-height: 1.75;
    color: var(--color-base-content);

    p {
      margin: 0.5em 0;
      line-height: 1.5;
    }
    h1 {
      font-size: 1.8em;
      font-weight: 700;
      margin: 0.8em 0 0.4em;
    }
    h2 {
      font-size: 1.5em;
      font-weight: 600;
      margin: 0.7em 0 0.35em;
    }
    h3 {
      font-size: 1.25em;
      font-weight: 600;
      margin: 0.6em 0 0.3em;
    }

    blockquote {
      border-left: .1875rem solid var(--color-primary);
      padding-left: 1em;
      margin: 0.75em 0;
      opacity: 0.85;
    }

    pre {
      background: var(--color-base-200);
      border-radius: .5rem;
      padding: .75rem 1rem;
      font-size: .8125rem;
      overflow-x: auto;
      code {
        background: none;
        padding: 0;
        font-size: inherit;
      }
    }

    code {
      background: var(--color-base-200);
      padding: .125rem .375rem;
      border-radius: .25rem;
      font-size: 0.9em;
    }

    hr {
      border: none;
      border-top: .0625rem solid var(--color-border);
      margin: 1.5em 0;
    }
    a {
      color: var(--color-primary);
    }
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      opacity: 0.3;
      pointer-events: none;
      float: left;
      height: 0;
    }
  }
}
</style>
