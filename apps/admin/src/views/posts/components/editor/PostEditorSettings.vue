<script setup lang="ts">
import { computed, ref } from 'vue'
import { Image, Trash2 } from '@lucide/vue'
import Input from '~/components/base/Input.vue'
import Select from '~/components/base/Select.vue'
import Button from '~/components/base/Button.vue'
import MediaPickerModal from '~/components/media/MediaPickerModal.vue'
import type { Category, Tag } from '~/api/tags/types'
import type { MediaItem } from '~/api/media'

const slug = defineModel<string>('slug', { default: '' })
const summary = defineModel<string>('summary', { default: '' })
const cover = defineModel<string>('cover', { default: '' })
const isPinned = defineModel<boolean>('isPinned', { default: false })
const categoryId = defineModel<number>('categoryId', { default: 0 })
const tagIds = defineModel<number[]>('tagIds', { default: () => [] })

const props = defineProps<{
  categories: Category[];
  tags: Tag[];
}>();

const emit = defineEmits<{ (e: "change"): void }>();
const showCoverPicker = ref(false)

const categoryOptions = computed(() =>
  props.categories.map(c => ({ label: c.name, value: c.id }))
);

function selectCover(item: MediaItem) {
  cover.value = item.previewUrl || item.thumbnailUrl || item.url
  emit('change')
}

function clearCover() {
  cover.value = ''
  emit('change')
}
</script>

<template>
  <div class="panel">
    <h2 class="panel-title">文章设置</h2>
    <div class="body">
      <label class="field">
        <span>分类</span>
        <Select v-model="categoryId" :options="categoryOptions" placeholder="选择分类" @change="emit('change')" />
      </label>

      <label class="field">
        <span>标识</span>
        <Input v-model="slug" placeholder="hello-world" @input="emit('change')" />
      </label>

      <label class="field">
        <span>摘要</span>
        <textarea :value="summary" class="input area" rows="3" placeholder="文章摘要" @input="summary = ($event.target as HTMLTextAreaElement).value; emit('change')" />
      </label>

      <label class="field">
        <span>封面</span>
        <div class="cover-box" :class="{ empty: !cover }">
          <img v-if="cover" :src="cover" alt="文章封面" />
          <div v-else class="cover-empty">
            <Image :size="22" />
            <small>未设置封面</small>
          </div>
        </div>
        <div class="cover-actions">
          <Button size="sm" variant="secondary" @click="showCoverPicker = true">选择图片</Button>
          <Button v-if="cover" size="sm" variant="ghost" icon @click="clearCover">
            <Trash2 :size="14" />
          </Button>
        </div>
        <Input v-model="cover" placeholder="也可以粘贴图片 URL" @input="emit('change')" />
      </label>

      <label class="field row">
        <input :checked="isPinned" type="checkbox" class="checkbox" @change="isPinned = ($event.target as HTMLInputElement).checked; emit('change')" />
        <span>置顶</span>
      </label>

      <div class="field">
        <span>标签</span>
        <div class="chip-list">
          <button
            v-for="tag in tags"
            :key="tag.id"
            :class="['chip', tagIds.includes(tag.id) && 'on']"
            @click="tagIds.includes(tag.id) ? tagIds = tagIds.filter(i => i !== tag.id) : tagIds.push(tag.id); emit('change')"
          >{{ tag.name }}</button>
          <span v-if="tags.length === 0" class="dim">暂无标签</span>
        </div>
      </div>
    </div>
    <MediaPickerModal
      v-model:open="showCoverPicker"
      type="image"
      title="选择封面"
      description="选择一张图片作为文章封面。"
      @select="selectCover"
    />
  </div>
</template>

<style scoped lang="less">
.panel {
  width: 17.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: .0625rem solid var(--color-border);
}

.panel-title {
  display: flex;
  align-items: center;
  padding: 0 1.25rem;
  height: 3rem;
  font-size: .9375rem;
  font-weight: 700;
  border-bottom: .0625rem solid var(--color-border);
  flex-shrink: 0;
  margin: 0;
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: .875rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: .3125rem;
  font-size: .8125rem;

  > span:first-child {
    font-size: .75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .025rem;
    opacity: 0.4;
  }

  &.row {
    flex-direction: row;
    align-items: center;
    gap: .5rem;
  }
}

.input {
  padding: .4375rem .625rem;
  border-radius: .5rem;
  border: .0625rem solid var(--color-border);
  background: var(--color-base-100);
  font-size: .8125rem;
  color: var(--color-base-content);
  outline: none;
  font-family: inherit;

  &:focus { border-color: var(--color-primary); }
}

.area { resize: vertical; }

.cover-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: .0625rem solid var(--color-border);
  border-radius: .5rem;
  background: var(--color-base-200);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.empty {
    border-style: dashed;
  }
}

.cover-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .375rem;
  color: var(--color-base-content);
  opacity: 0.35;

  small {
    font-size: .75rem;
  }
}

.cover-actions {
  display: flex;
  align-items: center;
  gap: .375rem;
}

.chip-list { display: flex; flex-wrap: wrap; gap: .375rem; }

.chip {
  padding: .1875rem .5625rem;
  border-radius: .375rem;
  border: .0625rem solid var(--color-border);
  background: var(--color-base-100);
  font-size: .75rem;
  cursor: pointer;
  color: var(--color-base-content);
  opacity: 0.5;
  transition: all 0.12s;

  &:hover { opacity: 0.8; }

  &.on {
    opacity: 1;
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-primary-content);
  }
}

.dim { font-size: .75rem; opacity: 0.35; }
.checkbox { accent-color: var(--color-primary); }
</style>
