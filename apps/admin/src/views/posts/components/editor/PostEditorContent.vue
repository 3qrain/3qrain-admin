<script setup lang="ts">
import { ref } from "vue";
import TiptapEditor from "./tiptap/TiptapEditor.vue";

const title = defineModel<string>("title", { default: "" });
defineProps<{ initialContent?: object }>();

const editorRef = ref<InstanceType<typeof TiptapEditor> | null>(null);

function getContent() {
  return editorRef.value?.getContent() || { json: {}, html: "", text: "" };
}

defineEmits<{ (e: "dirty"): void }>();
defineExpose({ getContent });
</script>

<template>
  <div class="post-editor-content-root">
    <div class="post-editor-content-wrap">
      <input
        :value="title"
        class="title-input"
        placeholder="文章标题"
        @input="title = ($event.target as HTMLInputElement).value"
      />
      <div class="divider" />
      <TiptapEditor ref="editorRef" :initial-content="initialContent" @dirty="$emit('dirty')" />
    </div>
  </div>
</template>

<style scoped lang="less">
.post-editor-content-root {
  height: 100%;
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.post-editor-content-wrap {
  max-width: 48rem;
  width: 100%;
  // margin: 0 auto;
  // margin: 1.5rem auto 1.25rem;
  padding: 1.5rem 2.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  box-sizing: border-box;
}

.title-input {
  border: none;
  outline: none;
  font-size: 1.75rem;
  font-weight: 700;
  padding: 0 0 1rem;
  color: var(--color-base-content);
  background: transparent;

  &::placeholder { opacity: 0.25; }
}

.divider {
  border-bottom: .0625rem solid var(--color-border);
  margin-bottom: .5rem;
}

@media (width <= 48rem) {
  .post-editor-content-wrap { padding: 1.5rem 0rem 1.25rem; }
}
</style>
