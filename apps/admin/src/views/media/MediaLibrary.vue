<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Plus, Trash2, Copy, Search, ShieldAlert } from '@lucide/vue'
import Button from '~/components/base/Button.vue'
import ToggleGroup from '~/components/base/ToggleGroup.vue'
import Pagination from '~/components/table/Pagination.vue'
import MediaPreview from '~/components/media/MediaPreview.vue'
import { getMedia, deleteMedia, getMediaHealth, type MediaItem } from '~/api/media'
import { useAppStore } from '~/stores/app'
import { useGlobalStore } from '~/stores/global'
import { useUppyStore } from '~/stores/uppy'
import { storeToRefs } from 'pinia'
import { withMinDuration } from '~/utils/async'
import { formatDateWithWeek } from '~/utils/date'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const uppyStore = useUppyStore()

const globalStore = useGlobalStore()
const { drawerPanel } = storeToRefs(globalStore)

interface fileItem extends MediaItem {
  _loaded: boolean
}
const files = ref<fileItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(36)
const t = ref<number>(Date.now())
const totalPages = ref(1)
const keyword = ref('')
const loading = ref(true)
const previewOpen = ref(false)
const previewIndex = ref(0)
const { mediaPaginationMode: paginationMode } = storeToRefs(appStore)

type FilesGroupsByDate = {
  date: string
  files: fileItem[]
}

const filesGroupsByDate = computed<FilesGroupsByDate[]>(() => {
  const groups: FilesGroupsByDate[] = []

  for (const file of files.value) {
    const date = formatDateWithWeek(file.createdAt)

    const lastIndex = groups.length - 1

    if (lastIndex >= 0 && groups[lastIndex].date === date) {
      groups[lastIndex].files.push(file)
    } else {
      groups.push({
        date,
        files: [file]
      })
    }
  }

  return groups
})

function openPreview(item: fileItem) {
  previewIndex.value = files.value.indexOf(item)
  previewOpen.value = true
}

const showUpload = ref(false)
const health = ref({ unregistered: 0, missing: 0 })

async function load(append = false) {
  loading.value = true
  try {
    !append && (files.value = [])
    const params: any = { t: t.value, pageSize: pageSize.value }
    if (paginationMode.value === 'scroll') {
      params.offset = append ? files.value.length : 0
    } else {
      params.page = page.value
    }
    if (keyword.value) params.keyword = keyword.value
    const result = await withMinDuration(() => getMedia(params), 0)
    files.value = append ? [...files.value, ...(result.list as any)] : (result.list as any)
    total.value = result.total
    totalPages.value = Math.ceil(result.total / result.pageSize)
  } catch (e: any) {
    if (e?.code === 'ERR_CANCELED') return
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

function goPage(p: number) {
  page.value = p
  if (paginationMode.value === 'button') {
    router.replace({ query: { ...route.query, page: String(p) } })
  }
  load(paginationMode.value === 'scroll')
}

async function checkHealth() {
  try {
    health.value = await getMediaHealth()
  } catch {
    /* */
  }
}

async function onDelete(item: MediaItem) {
  if (!confirm(`删除「${item.filename}」？`)) return
  try {
    await deleteMedia([item.id])
    toast.success('已删除')
    if (paginationMode.value === 'scroll') {
      files.value = files.value.filter(f => f.id !== item.id)
      total.value--
    } else {
      await load()
    }
    await checkHealth()
  } catch {
    toast.error('删除失败')
  }
}

function copyUrl(url: string) {
  navigator.clipboard.writeText(url)
  toast.success('已复制')
}

function formatBytes(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function isImg(t: string) {
  return t === 'image' || t === 'svg'
}

function search() {
  page.value = 1
  load()
}

function onUploadsComplete() {
  router.replace({ query: {} })
  page.value = 1
  t.value = Date.now()
  load()
  checkHealth()
}

watch(paginationMode, val => {
  page.value = 1
  if (val === 'scroll') {
    router.replace({ query: {} })
  }
  t.value = Date.now()
  load()
})

onMounted(() => {
  if (paginationMode.value === 'button') {
    const urlPage = Number(route.query.page)
    if (urlPage > 0) page.value = urlPage
  }
  load()
  checkHealth()
  toRaw(uppyStore.uppy).on('complete', onUploadsComplete)
})

onUnmounted(() => {
  toRaw(uppyStore.uppy).off('complete', onUploadsComplete)
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="head">
      <div>
        <h1>媒体库</h1>
        <span class="sub">{{ total }} 个文件</span>
      </div>
      <div class="head-act">
        <label class="search-box">
          <Search :size="14" />
          <input v-model="keyword" placeholder="搜索..." @keyup.enter="search" />
        </label>
        <Button
          variant="ghost"
          size="sm"
          @click="checkHealth()"
          :class="{ warn: health.unregistered > 0 || health.missing > 0 }"
        >
          <ShieldAlert :size="14" />
          健康
          <span v-if="health.unregistered || health.missing" class="health-num">{{
            health.unregistered + health.missing
          }}</span>
        </Button>
        <ToggleGroup
          v-model="paginationMode"
          :options="[
            { label: '滚动', value: 'scroll' },
            { label: '分页', value: 'button' }
          ]"
          size="sm"
        />
        <Button variant="primary" size="sm" @click="drawerPanel = 'upload'"> <Plus :size="15" /> {{ '上传' }} </Button>
      </div>
    </div>

    <!-- Upload Area -->
    <Transition name="slide">
      <div v-if="showUpload" class="upload-area">
        <div id="uppy-inline" class="uppy-wrap" />
      </div>
    </Transition>

    <!-- Grid -->
    <div v-if="!loading && files.length === 0" class="dim">暂无文件</div>

    <template v-else-if="files.length > 0">
      <div class="group" v-for="group in filesGroupsByDate">
        <div class="group-date">{{ group.date }}</div>
        <div class="grid">
          <div v-for="item in group.files" :key="item.id" class="card">
            <div
              class="thumb"
              :class="{ loaded: item._loaded }"
              :style="item.placeholder ? { '--placeholder': `url(${item.placeholder})` } : {}"
              @click="openPreview(item)"
            >
              <img
                v-if="item.thumbnailUrl"
                :src="item.thumbnailUrl"
                :alt="item.filename"
                loading="lazy"
                @load="item._loaded = true"
              />
              <img
                v-else-if="isImg(item.type)"
                :src="item.url"
                :alt="item.filename"
                loading="lazy"
                @load="item._loaded = true"
              />
              <div v-else class="file-type">{{ item.ext?.replace('.', '')?.toUpperCase() || item.type }}</div>
            </div>
            <div class="card-overlay">
              <div class="meta">
                <div class="name" :title="item.filename">{{ item.filename }}</div>
                <div class="info-row">
                  <span>{{ formatBytes(item.size) }}</span>
                  <span v-if="item.width">{{ item.width }}×{{ item.height }}</span>
                </div>
              </div>
              <div class="card-act" @click.stop>
                <button title="复制链接" @click="copyUrl(item.url)"><Copy :size="13" /></button>
                <button title="删除" class="del" @click="onDelete(item)"><Trash2 :size="13" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="media-pagination">
      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        :loading="loading"
        :mode="paginationMode"
        @change="goPage"
      />
    </div>

    <!-- Preview -->
    <MediaPreview v-model="previewOpen" :items="files" :initial-index="previewIndex" height="85vh" />
  </div>
</template>

<style scoped lang="less">
.page {
  // padding: 1.5rem 2rem;
}

/* Header */
.head {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}
.sub {
  font-size: 0.8125rem;
  opacity: 0.4;
  display: block;
  margin-top: 0.125rem;
}
.head-act {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3125rem 0.625rem;
  border-radius: 0.5rem;
  background: var(--color-base-200);
  border: 0.0625rem solid transparent;
  input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.8125rem;
    width: 7.5rem;
    color: var(--color-base-content);
  }
  svg {
    opacity: 0.35;
    flex-shrink: 0;
  }
  &:focus-within {
    border-color: var(--color-base-300);
  }
}
.warn {
  color: var(--color-warning) !important;
}
.health-num {
  background: var(--color-warning);
  color: #fff;
  font-size: 0.625rem;
  padding: 0.0625rem 0.3125rem;
  border-radius: 0.5rem;
  margin-left: 0.125rem;
  font-weight: 600;
}

/* Upload */
.upload-area {
  margin-bottom: 1.25rem;
}
.uppy-wrap {
  border-radius: 0.75rem;
  overflow: hidden;
  border: 0.0625rem solid var(--color-border);
  :deep(.uppy-Root) {
    font-family: inherit;
  }
  :deep(.uppy-Dashboard-inner) {
    border: none;
    background: var(--color-base-100);
  }
  :deep(.uppy-Dashboard-AddFiles) {
    border-color: var(--color-border);
  }
  :deep(.uppy-Dashboard-browse) {
    color: var(--color-primary);
  }
}

.group {
  --gap: 0.75rem;
  position: relative;
  // padding-top: calc(var(--gap));
  .group-date {
    position: sticky;
    z-index: 9;
    top: 0;
    display: flex;
    align-items: center;
    // justify-content: center;
    height: 2.5rem;
    font-size: 1.125rem;
    font-style: italic;
    font-weight: 600;
    color: var(--color-base-content);
    text-shadow: 0 1px 2px color-mix(in oklab, var(--color-base-100) 40%, transparent);
    opacity: 0.7;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: var(--gap);
  }
}

// @media (min-width: 40rem) {
//   .grid { grid-template-columns: repeat(2, 1fr); }
//   .page { padding: 1rem; }
// }
// @media (min-width: 48rem) {
//   .grid { grid-template-columns: repeat(3, 1fr); }
//   .page { padding: 1rem; }
// }
// @media (min-width: 64rem) {
//   .grid { grid-template-columns: repeat(4, 1fr); }
//   .page { padding: 1rem; }
// }
// @media (min-width: 80rem) {
//   .grid { grid-template-columns: repeat(4, 1fr); }
// }
// @media (min-width: 88rem) {
//   .grid { grid-template-columns: repeat(5, 1fr); }
// }
// @media (min-width: 96rem) {
//   .grid { grid-template-columns: repeat(6, 1fr); }
// }
.card {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
}

.thumb {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-base-200);
  position: relative;
  cursor: pointer;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: var(--placeholder);
    background-size: cover;
    background-position: center;
    filter: blur(1.25rem);
    transform: scale(1.1);
    transition: opacity 0.3s;
  }
  &.loaded::before {
    opacity: 0;
  }

  img {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    user-select: none;
  }

  .file-type {
    font-size: 0.75rem;
    font-weight: 600;
    opacity: 0.25;
    position: relative;
    z-index: 1;
  }
}

.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 0.5rem 0.375rem;
  color: oklch(97% 0.03 256);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.25rem;
  z-index: 2;
  .card:hover & {
    opacity: 1;
  }
}

.meta {
  min-width: 0;
  flex: 1;
  .name {
    font-size: 0.6875rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .info-row {
    display: flex;
    gap: 0.375rem;
    margin-top: 0.0625rem;
    font-size: 0.625rem;
    opacity: 0.4;
  }
}

.card-act {
  display: flex;
  gap: 0.0625rem;
  flex-shrink: 0;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    border-radius: 0.3125rem;
    background: transparent;
    // color: var(--color-base-content);
    color: inherit;
    opacity: 0.5;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      opacity: 1;
      // background: var(--color-base-200);
    }
    &.del {
      color: var(--color-error);
    }
    &.del:hover {
      color: var(--color-error);
    }
  }
}
.media-pagination {
  margin-top: 2rem;
}
.dim {
  text-align: center;
  padding: 5rem 0;
  font-size: 0.875rem;
  opacity: 0.35;
}
/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@media (max-width: 48rem) {
  // .page {
  //   padding: 1.25rem 1rem;
  // }
}
</style>
