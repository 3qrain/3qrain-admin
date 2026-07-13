<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, Search } from '@lucide/vue'
import { toast } from 'vue-sonner'
import BaseModal from '~/components/base/Modal.vue'
import Button from '~/components/base/Button.vue'
import Pagination from '~/components/table/Pagination.vue'
import { getMedia, type MediaItem } from '~/api/media'

type MediaPickerType = 'image' | 'video' | 'audio' | 'file'

const props = withDefaults(defineProps<{
  type?: MediaPickerType
  multiple?: boolean
  title?: string
  description?: string
}>(), {
  type: 'image',
  multiple: false,
  title: '选择媒体',
  description: ''
})

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  (e: 'select', item: MediaItem): void
  (e: 'confirm', items: MediaItem[]): void
}>()

const keyword = ref('')
const loading = ref(false)
const items = ref<MediaItem[]>([])
const selected = ref<MediaItem[]>([])
const page = ref(1)
const pageSize = 30
const total = ref(0)
const totalPages = ref(0)
const t = ref(Date.now())
const scrollRootId = `media-picker-scroll-${Math.random().toString(36).slice(2)}`

const fallbackDescription = computed(() => {
  if (props.description) return props.description
  if (props.type === 'image') return '选择后会返回原图、缩略图、预览图和占位图信息。'
  return '选择后会返回媒体文件信息。'
})

function isSelected(item: MediaItem) {
  return selected.value.some(current => current.id === item.id)
}

async function load(append = false) {
  loading.value = true
  try {
    const res = await getMedia({
      keyword: keyword.value,
      type: props.type,
      pageSize,
      offset: append ? items.value.length : 0,
      t: t.value
    })
    items.value = append ? [...items.value, ...res.list] : res.list
    total.value = res.total
    totalPages.value = Math.ceil(res.total / pageSize)
  } catch {
    toast.error('媒体加载失败')
  } finally {
    loading.value = false
  }
}

function select(item: MediaItem) {
  if (!props.multiple) {
    emit('select', item)
    open.value = false
    return
  }

  selected.value = isSelected(item)
    ? selected.value.filter(current => current.id !== item.id)
    : [...selected.value, item]
}

function confirm() {
  if (!selected.value.length) return
  emit('confirm', selected.value)
  selected.value = []
  open.value = false
}

function search() {
  page.value = 1
  t.value = Date.now()
  load(false)
}

function goPage(nextPage: number) {
  page.value = nextPage
  load(true)
}

watch(open, val => {
  if (val) {
    page.value = 1
    selected.value = []
    t.value = Date.now()
    load(false)
  }
})

watch(() => props.type, () => {
  if (!open.value) return
  page.value = 1
  selected.value = []
  t.value = Date.now()
  load(false)
})
</script>

<template>
  <BaseModal v-model:open="open">
    <div class="picker">
      <div class="head">
        <div>
          <h3>{{ props.title }}</h3>
          <p>{{ fallbackDescription }}</p>
        </div>
        <Button variant="ghost" size="sm" @click="open = false">关闭</Button>
      </div>

      <label class="search">
        <Search :size="14" />
        <input v-model="keyword" placeholder="搜索媒体" @keyup.enter="search" />
        <Button variant="secondary" size="sm" :loading="loading" @click="search">搜索</Button>
      </label>

      <div :id="scrollRootId" class="body">
        <div v-if="items.length" class="grid">
          <button
            v-for="item in items"
            :key="item.id"
            class="item"
            :class="{ selected: isSelected(item) }"
            :style="item.placeholder ? { '--placeholder': `url(${item.placeholder})` } : {}"
            @click="select(item)"
          >
            <img v-if="item.type === 'image'" :src="item.thumbnailUrl || item.previewUrl || item.url" :alt="item.filename" loading="lazy" />
            <div v-else class="file-card">
              <span>{{ item.ext || item.type }}</span>
            </div>
            <span class="name">{{ item.filename }}</span>
            <span v-if="props.multiple" class="check">
              <Check :size="14" />
            </span>
          </button>
        </div>

        <p v-else class="empty">{{ loading ? '加载中...' : '暂无媒体' }}</p>

        <Pagination
          mode="scroll"
          :current-page="page"
          :total-pages="totalPages"
          :loading="loading"
          :root-id="scrollRootId"
          @change="goPage"
        />
      </div>

      <div v-if="props.multiple" class="foot">
        <span>已选择 {{ selected.length }} 个</span>
        <Button size="sm" :disabled="!selected.length" @click="confirm">确定</Button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped lang="less">
.picker {
  width: min(48rem, calc(100vw - 2rem));
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--color-base-100);
  display: flex;
  flex-direction: column;
  max-height: min(42rem, calc(100vh - 4rem));
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  p {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    opacity: 0.45;
  }
}

.search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-base-200);

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-base-content);
    font-size: 0.8125rem;
  }

  svg {
    opacity: 0.35;
    margin-left: 0.25rem;
  }
}

.body {
  min-height: 0;
  overflow-y: auto;
  margin-top: 1rem;
  padding-right: 0.25rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: 0.75rem;
}

.item {
  position: relative;
  aspect-ratio: 1;
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--color-base-200);
  cursor: pointer;
  outline: 0.125rem solid transparent;
  outline-offset: -0.125rem;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: var(--placeholder);
    background-position: center;
    background-size: cover;
    filter: blur(1.25rem);
    transform: scale(1.08);
  }

  img {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.16s;
  }

  &:hover {
    img {
      transform: scale(1.04);
    }

    .name {
      opacity: 1;
    }
  }

  &.selected {
    outline-color: var(--color-primary);

    .check {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.file-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-base-content);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.name {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1rem 0.5rem 0.375rem;
  color: #fff;
  background: linear-gradient(to top, rgb(0 0 0 / 0.55), transparent);
  font-size: 0.6875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.15s;
}

.check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-primary-content);
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.15s, transform 0.15s;
}

.empty {
  padding: 3rem 0;
  text-align: center;
  font-size: 0.875rem;
  opacity: 0.4;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 0.0625rem solid var(--color-border);
  margin-top: 1rem;
  font-size: 0.8125rem;
  opacity: 0.8;
}
</style>
