<script setup lang="ts">
import { computed, ref } from 'vue'
import { Image, ImagePlus, Trash2 } from '@lucide/vue'
import Input from '~/components/base/Input.vue'
import SearchSelect from '~/components/base/SearchSelect.vue'
import Textarea from '~/components/base/Textarea.vue'
import Button from '~/components/base/Button.vue'
import ToggleSwitch from '~/components/base/ToggleSwitch.vue'
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

function toggleTag(id: number) {
  tagIds.value = tagIds.value.includes(id)
    ? tagIds.value.filter(tagId => tagId !== id)
    : [...tagIds.value, id]
  emit('change')
}
</script>

<template>
  <div class="panel">
    <h2 class="panel-title">文章设置</h2>
    <div class="body">
      <div class="field">
        <span>分类</span>
        <SearchSelect
          v-model="categoryId"
          :options="categoryOptions"
          full-width
          size="md"
          placeholder="选择分类"
          search-placeholder="搜索分类"
          empty-text="暂无分类"
          @update:model-value="emit('change')"
        />
      </div>

      <div class="field">
        <span>标识</span>
        <Input v-model="slug" aria-label="文章标识" placeholder="hello-world" @input="emit('change')" />
      </div>

      <div class="field">
        <span>摘要</span>
        <Textarea
          v-model="summary"
          :rows="6"
          expandable
          expand-title="编辑文章摘要"
          aria-label="文章摘要"
          placeholder="文章摘要"
          @input="emit('change')"
        />
      </div>

      <div class="field">
        <span>封面</span>
        <div class="cover-box" :class="{ empty: !cover }">
          <img v-if="cover" :src="cover" alt="文章封面" />
          <div v-else class="cover-empty">
            <Image :size="22" />
            <small>未设置封面</small>
          </div>
        </div>
        <div class="cover-actions">
          <Button class="cover-picker" size="sm" variant="secondary" @click="showCoverPicker = true">
            <ImagePlus :size="14" />
            {{ cover ? '更换图片' : '选择图片' }}
          </Button>
          <Button v-if="cover" size="sm" variant="ghost" icon title="移除封面" @click="clearCover">
            <Trash2 :size="14" />
          </Button>
        </div>
        <Input v-model="cover" placeholder="也可以粘贴图片 URL" @input="emit('change')" />
      </div>

      <div class="field row">
        <span>置顶</span>
        <ToggleSwitch v-model="isPinned" aria-label="置顶" @update:model-value="emit('change')" />
      </div>

      <div class="field">
        <span>标签</span>
        <div class="chip-list">
          <button
            v-for="tag in tags"
            :key="tag.id"
            :class="['chip', tagIds.includes(tag.id) && 'on']"
            :aria-pressed="tagIds.includes(tag.id)"
            @click="toggleTag(tag.id)"
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
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: .3125rem;
  font-size: .8125rem;

  > span:first-child {
    font-size: .75rem;
    font-weight: 600;
    letter-spacing: 0;
    opacity: .48;
  }

  &.row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    min-height: 2rem;
  }
}

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

.cover-picker {
  flex: 1;
}

.chip-list { display: flex; flex-wrap: wrap; gap: .375rem; }

.chip {
  padding: .25rem .5625rem;
  border-radius: .375rem;
  border: .0625rem solid transparent;
  background: var(--color-base-200);
  font-size: .75rem;
  line-height: 1.25;
  cursor: pointer;
  color: color-mix(in oklab, var(--color-base-content) 58%, transparent);
  transition:
    color .15s ease,
    background-color .15s ease,
    border-color .15s ease,
    transform .12s ease;

  &:hover {
    color: var(--color-base-content);
    background: var(--color-base-300);
  }

  &:active { transform: scale(.97); }

  &:focus-visible {
    outline: .125rem solid color-mix(in oklab, var(--color-primary) 30%, transparent);
    outline-offset: .0625rem;
  }

  &.on {
    color: var(--color-primary);
    background: color-mix(in oklab, var(--color-primary) 12%, var(--color-base-100));
    border-color: color-mix(in oklab, var(--color-primary) 22%, transparent);
  }
}

.dim { font-size: .75rem; opacity: 0.35; }
</style>
