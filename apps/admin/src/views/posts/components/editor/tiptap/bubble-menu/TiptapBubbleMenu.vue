<script setup lang="ts">
import { BubbleMenu } from '@tiptap/vue-3/menus'
import type { Editor } from '@tiptap/vue-3'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Heading2,
  Heading3,
  TextAlignStart,
  TextAlignCenter,
  TextAlignEnd
} from '@lucide/vue'
import MenuButton from '../MenuButton.vue'

const props = defineProps<{ editor: Editor }>()

const emit = defineEmits<{ (e: 'addLink'): void }>()
</script>

<template>
  <BubbleMenu class="menu" :editor="props.editor" :options="{ placement: 'top-start' }">
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
    <template v-if="!props.editor.isActive('image')">
      <span class="sep" />
      <MenuButton :active="props.editor.isActive('bold')" @click="props.editor.chain().focus().toggleBold().run()">
        <Bold :size="15" />
      </MenuButton>
      <MenuButton :active="props.editor.isActive('italic')" @click="props.editor.chain().focus().toggleItalic().run()">
        <Italic :size="15" />
      </MenuButton>
      <MenuButton :active="props.editor.isActive('strike')" @click="props.editor.chain().focus().toggleStrike().run()">
        <Strikethrough :size="15" />
      </MenuButton>
      <MenuButton :active="props.editor.isActive('code')" @click="props.editor.chain().focus().toggleCode().run()"
        ><Code :size="15"
      /></MenuButton>
      <span class="sep" />
      <MenuButton :active="props.editor.isActive('link')" @click="emit('addLink')">
        <LinkIcon :size="15" />
      </MenuButton>
      <!-- <MenuButton
        :active="props.editor.isActive('heading', { level: 1 })"
        @click="props.editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <Heading1 :size="15" />
      </MenuButton> -->
      <MenuButton
        :active="props.editor.isActive('heading', { level: 2 })"
        @click="props.editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <Heading2 :size="15" />
      </MenuButton>
            <MenuButton
        :active="props.editor.isActive('heading', { level: 3 })"
        @click="props.editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <Heading3 :size="15" />
      </MenuButton>
    </template>
  </BubbleMenu>
</template>

<style scoped lang="less">
.menu {
  display: flex;
  align-items: center;
  gap: .125rem;
  padding: .25rem;
  border-radius: .625rem;
  background: var(--color-base-100);
  border: .0625rem solid var(--color-border);
  box-shadow: 0 .25rem .75rem rgb(0 0 0 / 0.1);
  box-shadow: 0 .25rem .75rem var(--color-border);
}

.sep {
  width: .0625rem;
  height: 1.125rem;
  background: var(--color-border);
  margin: 0 .125rem;
}
</style>
