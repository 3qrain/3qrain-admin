<script setup lang="ts">
import { FloatingMenu } from '@tiptap/vue-3/menus'
import type { Editor } from '@tiptap/vue-3'
import {
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Image as ImageIcon,
  TextAlignStart,
  TextAlignCenter,
  TextAlignEnd
} from '@lucide/vue'
import MenuButton from '../MenuButton.vue'

const props = defineProps<{ editor: Editor }>()

const emit = defineEmits<{ (e: 'addImage'): void }>()
</script>

<template>
  <FloatingMenu class="menu" :editor="props.editor" :options="{ placement: 'bottom-start' }" >
    <MenuButton
      :active="props.editor.isActive({ textAlign: 'left' })"
      @click="props.editor.chain().focus().setTextAlign('left').run()"
    >
      <TextAlignStart :size="15" />
    </MenuButton>
    <MenuButton
      :active="props.editor.isActive({ textAlign: 'center' })"
      @click="props.editor.chain().focus().setTextAlign('center').run()"
    >
      <TextAlignCenter :size="15" />
    </MenuButton>
    <MenuButton
      :active="props.editor.isActive({ textAlign: 'right' })"
      @click="props.editor.chain().focus().setTextAlign('right').run()"
    >
      <TextAlignEnd :size="15" />
    </MenuButton>
    <span class="sep" />
    <MenuButton
      :active="props.editor.isActive('heading', { level: 2 })"
      @click="props.editor.chain().focus().toggleHeading({ level: 2 }).run()"
    >
      <Heading2 :size="16" />
    </MenuButton>
    <MenuButton
      :active="props.editor.isActive('heading', { level: 3 })"
      @click="props.editor.chain().focus().toggleHeading({ level: 3 }).run()"
    >
      <Heading3 :size="16" />
    </MenuButton>
    <span class="sep" />
    <MenuButton
      :active="props.editor.isActive('bulletList')"
      @click="props.editor.chain().focus().toggleBulletList().run()"
    >
      <List :size="16" />
    </MenuButton>
    <MenuButton
      :active="props.editor.isActive('orderedList')"
      @click="props.editor.chain().focus().toggleOrderedList().run()"
    >
      <ListOrdered :size="16" />
    </MenuButton>
    <MenuButton
      :active="props.editor.isActive('blockquote')"
      @click="props.editor.chain().focus().toggleBlockquote().run()"
    >
      <Quote :size="16" />
    </MenuButton>
    <MenuButton
      :active="props.editor.isActive('codeBlock')"
      @click="props.editor.chain().focus().toggleCodeBlock().run()"
      ><Code :size="16"
    /></MenuButton>
    <span class="sep" />
    <MenuButton @click="props.editor.chain().focus().setHorizontalRule().run()">
      <Minus :size="16" />
    </MenuButton>
    <MenuButton @click="emit('addImage')">
      <ImageIcon :size="16" />
    </MenuButton>
  </FloatingMenu>
</template>

<style scoped lang="less">
.menu {
  display: flex;
  align-items: center;
  gap: .125rem;
  padding: .25rem;
  border-radius: .5rem;
  background: var(--color-base-100);
  border: .0625rem solid var(--color-border);
  box-shadow: 0 .25rem .75rem var(--color-border);
}

.sep {
  width: .0625rem;
  height: 1.125rem;
  background: var(--color-border);
  margin: 0 .125rem;
}
</style>
