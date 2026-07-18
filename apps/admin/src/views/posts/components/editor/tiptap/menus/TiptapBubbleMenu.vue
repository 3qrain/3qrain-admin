<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { computePosition, flip, offset, shift } from '@floating-ui/vue'
import type { Editor } from '@tiptap/vue-3'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Expand,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  Strikethrough,
  Trash2
} from '@lucide/vue'
import MenuButton from '../MenuButton.vue'

const props = defineProps<{ editor: Editor }>()
const emit = defineEmits<{ (e: 'addLink'): void }>()

type MenuMode = 'text' | 'image'

const menuRef = ref<HTMLElement | null>(null)
const visible = ref(false)
const mode = ref<MenuMode>('text')
const menuStyle = ref<Record<string, string>>({})
let updateSeq = 0

function getTextAnchorRect() {
  const { selection } = props.editor.state
  if (selection.empty || (selection as any).node || props.editor.isActive('codeBlock')) return null

  const selectedText = props.editor.state.doc.textBetween(selection.from, selection.to, ' ').trim()
  if (!selectedText) return null

  const from = props.editor.view.coordsAtPos(selection.from)
  const to = props.editor.view.coordsAtPos(selection.to)

  const left = Math.min(from.left, to.left)
  const right = Math.max(from.right, to.right)
  const top = Math.min(from.top, to.top)
  const bottom = Math.max(from.bottom, to.bottom)
  const width = Math.max(1, right - left)
  const height = Math.max(1, bottom - top)

  return new DOMRect(left, top, width, height)
}

function getImageAnchorRect() {
  const { selection } = props.editor.state
  const selectedNode = (selection as any).node
  if (!selectedNode || selectedNode.type.name !== 'imageBlock') return null
  const dom = props.editor.view.nodeDOM(selection.from)
  return dom instanceof HTMLElement ? dom.getBoundingClientRect() : null
}

function getAnchorRect() {
  const imageRect = getImageAnchorRect()
  if (imageRect) {
    mode.value = 'image'
    return imageRect
  }

  const textRect = getTextAnchorRect()
  if (textRect) {
    mode.value = 'text'
    return textRect
  }

  return null
}

async function updateMenu() {
  const seq = ++updateSeq
  await nextTick()
  if (seq !== updateSeq) return

  const anchorRect = getAnchorRect()
  if (!anchorRect || !menuRef.value) {
    visible.value = false
    return
  }

  const virtualEl = {
    getBoundingClientRect: () => anchorRect
  }

  const { x, y } = await computePosition(virtualEl, menuRef.value, {
    placement: 'top',
    middleware: [offset(10), flip(), shift({ padding: 8 })]
  })
  if (seq !== updateSeq) return

  menuStyle.value = {
    left: `${x}px`,
    top: `${y}px`
  }
  visible.value = true
}

function hideOnBlur({ event }: { event: FocusEvent }) {
  if (event.relatedTarget instanceof Node && menuRef.value?.contains(event.relatedTarget)) return
  visible.value = false
}

function updateImageAlign(align: 'left' | 'center' | 'right' | 'full') {
  props.editor.chain().focus().updateAttributes('imageBlock', { align }).run()
  updateMenu()
}

function deleteImage() {
  props.editor.chain().focus().deleteSelection().run()
  visible.value = false
}

onMounted(() => {
  props.editor.on('selectionUpdate', updateMenu)
  props.editor.on('transaction', updateMenu)
  props.editor.on('focus', updateMenu)
  props.editor.on('blur', hideOnBlur)
  window.addEventListener('scroll', updateMenu, true)
  window.addEventListener('resize', updateMenu)
})

onBeforeUnmount(() => {
  props.editor.off('selectionUpdate', updateMenu)
  props.editor.off('transaction', updateMenu)
  props.editor.off('focus', updateMenu)
  props.editor.off('blur', hideOnBlur)
  window.removeEventListener('scroll', updateMenu, true)
  window.removeEventListener('resize', updateMenu)
})
</script>

<template>
  <div ref="menuRef" class="menu" :class="[mode, { 'is-visible': visible }]" :style="menuStyle" :aria-hidden="!visible">
    <template v-if="mode === 'image'">
      <MenuButton :active="props.editor.isActive('imageBlock', { align: 'left' })" @mousedown.prevent @click="updateImageAlign('left')">
        <AlignLeft :size="15" />
      </MenuButton>
      <MenuButton :active="props.editor.isActive('imageBlock', { align: 'center' })" @mousedown.prevent @click="updateImageAlign('center')">
        <AlignCenter :size="15" />
      </MenuButton>
      <MenuButton :active="props.editor.isActive('imageBlock', { align: 'right' })" @mousedown.prevent @click="updateImageAlign('right')">
        <AlignRight :size="15" />
      </MenuButton>
      <MenuButton :active="props.editor.isActive('imageBlock', { align: 'full' })" @mousedown.prevent @click="updateImageAlign('full')">
        <Expand :size="15" />
      </MenuButton>
      <span class="sep" />
      <MenuButton @mousedown.prevent @click="deleteImage">
        <Trash2 :size="15" />
      </MenuButton>
    </template>

    <template v-else>
      <MenuButton
        :active="props.editor.isActive({ textAlign: 'left' })"
        @mousedown.prevent
        @click="props.editor.chain().focus().setTextAlign('left').run()"
      >
        <AlignLeft :size="15" />
      </MenuButton>
      <MenuButton
        :active="props.editor.isActive({ textAlign: 'center' })"
        @mousedown.prevent
        @click="props.editor.chain().focus().setTextAlign('center').run()"
      >
        <AlignCenter :size="15" />
      </MenuButton>
      <MenuButton
        :active="props.editor.isActive({ textAlign: 'right' })"
        @mousedown.prevent
        @click="props.editor.chain().focus().setTextAlign('right').run()"
      >
        <AlignRight :size="15" />
      </MenuButton>
      <span class="sep" />
      <MenuButton :active="props.editor.isActive('bold')" @mousedown.prevent @click="props.editor.chain().focus().toggleBold().run()">
        <Bold :size="15" />
      </MenuButton>
      <MenuButton :active="props.editor.isActive('italic')" @mousedown.prevent @click="props.editor.chain().focus().toggleItalic().run()">
        <Italic :size="15" />
      </MenuButton>
      <MenuButton :active="props.editor.isActive('strike')" @mousedown.prevent @click="props.editor.chain().focus().toggleStrike().run()">
        <Strikethrough :size="15" />
      </MenuButton>
      <span class="sep" />
      <MenuButton :active="props.editor.isActive('code')" @mousedown.prevent @click="props.editor.chain().focus().toggleCode().run()">
        <Code :size="15" />
      </MenuButton>
      <MenuButton :active="props.editor.isActive('link')" @mousedown.prevent @click="emit('addLink')">
        <LinkIcon :size="15" />
      </MenuButton>
      <span class="sep" />
      <MenuButton
        :active="props.editor.isActive('heading', { level: 2 })"
        @mousedown.prevent
        @click="props.editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <Heading2 :size="15" />
      </MenuButton>
      <MenuButton
        :active="props.editor.isActive('heading', { level: 3 })"
        @mousedown.prevent
        @click="props.editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <Heading3 :size="15" />
      </MenuButton>
    </template>
  </div>
</template>

<style scoped lang="less">
.menu {
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background: var(--color-base-100);
  border: 0.0625rem solid var(--color-border);
  box-shadow: 0 0.25rem 0.75rem var(--color-border);
  transform-origin: center bottom;
  transform: translateY(0.25rem);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.14s ease, transform 0.14s ease, visibility 0.14s ease;
  z-index: 80;
}

.menu.is-visible {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.sep {
  width: 0.0625rem;
  height: 1.125rem;
  background: var(--color-border);
  margin: 0 0.125rem;
}

</style>
