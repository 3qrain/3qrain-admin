<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Pencil, Trash2, RotateCcw, Trash } from '@lucide/vue'
import Button from '~/components/base/Button.vue'
import Badge from '~/components/base/Badge.vue'
import Popover from '~/components/base/Popover.vue'
import Modal from '~/components/base/Modal.vue'
import Pagination from '~/components/table/Pagination.vue'
import ToggleGroup from '~/components/base/ToggleGroup.vue'
import MediaPreview from '~/components/media/MediaPreview.vue'
import NoteCompose from './components/NoteCompose.vue'
import { getNotes, deleteNote, restoreNote, destroyNote, emptyTrashNotes } from '~/api/notes'
import { getTags } from '~/api/tags'
import type { Note } from '~/api/notes/types'
import type { Tag } from '~/api/tags/types'
import { withMinDuration } from '~/utils/async'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

const notes = ref<Note[]>([])
const allTags = ref<Tag[]>([])
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const { notesPaginationMode: paginationMode } = storeToRefs(useAppStore())
const showDeleted = ref(false)

const route = useRoute()
const router = useRouter()

const editingNote = ref<Note | null>(null)
const editModalOpen = ref(false)
const previewOpen = ref(false)
const previewIndex = ref(0)
const previewMedia = ref<any[]>([])

function relativeTime(ts: any): string {
  const diff = Date.now() - new Date(ts).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const d = Math.floor(hr / 24)
  return `${d} 天前`
}

async function load(append = false) {
  loading.value = true
  try {
    !append && (notes.value = [])
    const params: any = { pageSize: pageSize.value, deleted: showDeleted.value || undefined }
    if (paginationMode.value === 'scroll') {
      params.offset = append ? notes.value.length : 0
    } else {
      params.page = page.value
    }
    const result = await withMinDuration(() => getNotes(params))
    notes.value = append ? [...notes.value, ...result.list] : result.list
    total.value = result.total
    totalPages.value = Math.ceil(result.total / result.pageSize)
  } catch {
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

function goPage(p: number) {
  page.value = p
  if (paginationMode.value === 'button') {
    if (!showDeleted.value) router.replace({ query: { ...route.query, page: String(p) } })
  }
  load(paginationMode.value === 'scroll')
}

function onPublished() {
  page.value = 1
  load()
}

async function loadTags() {
  try {
    allTags.value = await getTags()
  } catch {
    /* ignore */
  }
}

function startEdit(note: Note) {
  editingNote.value = note
  editModalOpen.value = true
}

function openNotePreview(note: Note, index: number) {
  previewMedia.value = note.media
  previewIndex.value = index
  previewOpen.value = true
}

function onEdited(note?: Note) {
  editModalOpen.value = false
  editingNote.value = null
  if (note) {
    const idx = notes.value.findIndex(n => n.id === note.id)
    if (idx >= 0) notes.value[idx] = note
  }
}

async function remove(note: Note) {
  try {
    await deleteNote([note.id])
    toast.success('已移至回收站')
    if (paginationMode.value === 'scroll') {
      notes.value = notes.value.filter(n => n.id !== note.id)
      total.value--
    } else {
      load()
    }
  } catch {
    toast.error('删除失败')
  }
}

async function handleRestore(note: Note) {
  try {
    await restoreNote(note.id)
    toast.success('已恢复')
    if (paginationMode.value === 'scroll') {
      notes.value = notes.value.filter(n => n.id !== note.id)
      total.value--
    } else {
      load()
    }
  } catch {
    toast.error('恢复失败')
  }
}

async function handleDestroy(note: Note) {
  try {
    await destroyNote([note.id])
    toast.success('已永久删除')
    if (paginationMode.value === 'scroll') {
      notes.value = notes.value.filter(n => n.id !== note.id)
      total.value--
    } else {
      load()
    }
  } catch {
    toast.error('删除失败')
  }
}

function toggleDeleted() {
  if (loading.value) return
  showDeleted.value = !showDeleted.value
  page.value = 1
  router.replace({ query: {} })
  load()
}

async function handleEmptyTrash() {
  if (!confirm('确定清空回收站？所有说说将被永久删除。')) return
  try {
    await emptyTrashNotes()
    load()
    toast.success('回收站已清空')
  } catch (e: any) {
    toast.error(e?.message || '操作失败')
  }
}

watch(paginationMode, val => {
  page.value = 1
  if (val === 'scroll') {
    router.replace({ query: {} })
  }
  load()
})

onMounted(() => {
  if (paginationMode.value === 'button') {
    const urlPage = Number(route.query.page)
    if (urlPage > 0) page.value = urlPage
  }
  load()
  loadTags()
})
</script>

<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>{{ showDeleted ? '说说-回收站' : '说说' }}</h1>
        <span class="sub">共 {{ total }} 条</span>
      </div>
      <div class="head-right">
        <Button v-if="showDeleted" variant="danger" size="sm" @click="handleEmptyTrash">清空回收站</Button>
        <button
          :class="['trash-toggle', showDeleted && 'active']"
          :title="showDeleted ? '返回说说' : '回收站'"
          @click="toggleDeleted"
        >
          <Trash style="width: 1rem; height: 1rem" />
        </button>
        <ToggleGroup
          v-model="paginationMode"
          :options="[
            { label: '滚动', value: 'scroll' },
            { label: '分页', value: 'button' }
          ]"
          size="sm"
        />
      </div>
    </div>

    <!-- 编写区 -->
    <NoteCompose v-if="!showDeleted" :tags="allTags" @published="onPublished" />

    <!-- 时间线 -->
    <div v-if="!loading && notes.length === 0" class="empty">{{ showDeleted ? '回收站为空' : '还没有说说' }}</div>
    <div v-else-if="notes.length > 0" class="timeline">
      <div v-for="note in notes" :key="note.id" class="note">
        <Badge v-if="!note.isPublished" variant="neutral" class="pin-badge">隐藏</Badge>
        <div class="note-header">
          <span class="note-time">{{ relativeTime(note.createdAt) }}</span>
          <div class="note-actions">
            <template v-if="showDeleted">
              <button class="act" title="恢复" @click="handleRestore(note)">
                <RotateCcw style="width: 0.75rem; height: 0.75rem" />
              </button>
              <Popover>
                <button class="act del">
                  <Trash2 style="width: 0.75rem; height: 0.75rem" />
                </button>
                <template #content="{ close }">
                  <p class="confirm-text">永久删除？此操作不可恢复</p>
                  <div class="confirm-actions">
                    <Button variant="ghost" size="sm" @click="close()">取消</Button>
                    <Button
                      variant="danger"
                      size="sm"
                      @click="
                        () => {
                          handleDestroy(note)
                          close()
                        }
                      "
                      >确定</Button
                    >
                  </div>
                </template>
              </Popover>
            </template>
            <template v-else>
              <button class="act" @click="startEdit(note)">
                <Pencil style="width: 0.75rem; height: 0.75rem" />
              </button>
              <Popover>
                <button class="act del">
                  <Trash2 style="width: 0.75rem; height: 0.75rem" />
                </button>
                <template #content="{ close }">
                  <p class="confirm-text">确定删除这条说说？</p>
                  <div class="confirm-actions">
                    <Button variant="ghost" size="sm" @click="close()">取消</Button>
                    <Button
                      variant="danger"
                      size="sm"
                      @click="
                        () => {
                          remove(note)
                          close()
                        }
                      "
                      >确定</Button
                    >
                  </div>
                </template>
              </Popover>
            </template>
          </div>
        </div>

        <div class="note-content">{{ note.content }}</div>

        <div v-if="note.media.length > 0" class="note-images">
          <div
            v-for="(m, mi) in note.media"
            :key="m.id"
            class="note-thumb"
            :class="{ loaded: (m as any)._loaded }"
            :style="m.placeholder ? { '--placeholder': `url(${m.placeholder})` } : {}"
            @click.stop="openNotePreview(note, mi)"
          >
            <img :src="m.thumbnailUrl || m.url" :alt="m.filename" loading="lazy" @load="(m as any)._loaded = true" />
          </div>
        </div>

        <div v-if="note.tags.length > 0" class="note-footer">
          <Badge v-for="tag in note.tags" :key="tag.id" variant="info">{{ tag.name }}</Badge>
        </div>
      </div>
    </div>

    <div class="note-pagination">
      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        :loading="loading"
        :mode="paginationMode"
        @change="goPage"
      />
    </div>

    <!-- 编辑弹窗 -->
    <Modal v-model:open="editModalOpen">
      <div class="edit-modal">
        <NoteCompose
          v-if="editingNote"
          :note="editingNote"
          :tags="allTags"
          @published="onEdited"
          @cancelled="editModalOpen = false"
        />
      </div>
    </Modal>

    <MediaPreview v-model="previewOpen" :items="previewMedia" :initial-index="previewIndex" height="85vh" />
  </div>
</template>

<style scoped lang="less">
.page {
  max-width: 38rem;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }
}

.head-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trash-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.3;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    opacity: 0.6;
  }
  &.active {
    opacity: 1;
    color: var(--color-error);
  }
}

.sub {
  font-size: 0.75rem;
  opacity: 0.35;
  display: block;
  margin-top: 0.125rem;
}

/* ---- Timeline ---- */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.note {
  position: relative;
  padding: 0.625rem 0.875rem 0.875rem;
  border-radius: 0.625rem;
  border: 0.0625rem solid var(--color-border);
  transition: background 0.1s;

  &:hover {
    background: var(--color-base-200);
  }
}

.pin-badge {
  position: absolute;
  top: -0.5rem;
  left: -0.375rem;
  transform: rotate(-8deg);
  z-index: 1;
  font-size: 0.625rem;
  box-shadow: 0 0.0625rem 0.25rem rgb(0 0 0 / 0.1);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
}

.note-content {
  font-size: 0.875rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-images {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.625rem;
}

.note-thumb {
  width: 6rem;
  height: 6rem;
  border-radius: 0.375rem;
  overflow: hidden;
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
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: relative;
    z-index: 1;
  }
}

.note-footer {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-top: 0.625rem;
}

.note-time {
  font-size: 0.6875rem;
  opacity: 0.3;
}

.note-actions {
  display: flex;
  gap: 0.125rem;
  opacity: 0;
  transition: opacity 0.1s;

  .note:hover & {
    opacity: 1;
  }
}

.note:has([data-popover-open]) .note-actions {
  opacity: 1;
}

.act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: 0.3125rem;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.35;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    opacity: 0.7;
    background: var(--color-base-200);
  }
  &.del:hover {
    color: var(--color-error);
  }
}

.confirm-text {
  font-size: 0.75rem;
  margin: 0 0 0.625rem;
  white-space: nowrap;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

.edit-modal {
  width: 35rem;
  max-width: calc(100vw - 3rem);
}

.empty {
  text-align: center;
  padding: 3rem 0;
  font-size: 0.875rem;
  opacity: 0.3;
}

.note-pagination {
  margin-top: 1rem;
}

@media (max-width: 48rem) {
  .note-actions {
    opacity: 1;
  }
}
</style>
