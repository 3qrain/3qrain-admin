<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import { ImagePlus, Images, X, Eye, EyeOff } from '@lucide/vue'
import Button from '~/components/base/Button.vue'
import MediaPickerModal from '~/components/media/MediaPickerModal.vue'
import { useAppStore } from '~/stores/app'
import { TUS_CHUNK_SIZE } from '~/stores/uppy'
import { createNote, updateNote } from '~/api/notes'
import type { Note } from '~/api/notes/types'
import type { Tag } from '~/api/tags/types'
import type { MediaItem } from '~/api/media'
import { withMinDuration } from '~/utils/async'

interface ComposeImage {
  mediaId?: number
  uppyFileId?: string
  preview: string
  progress: number
  status: 'existing' | 'uploading' | 'done' | 'error'
}

const props = defineProps<{
  note?: Note
  tags: Tag[]
}>()

const emit = defineEmits<{
  published: [note?: Note]
  cancelled: []
}>()

const content = ref('')
const images = ref<ComposeImage[]>([])
const selectedTagIds = ref<number[]>([])
const isPublished = ref(true)
const publishing = ref(false)
const fileInput = ref<HTMLInputElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const showMediaPicker = ref(false)

const appStore = useAppStore()
const mediaResults = new Map<string, any>()

const uppy = new Uppy({ autoProceed: true })

const isEdit = () => !!props.note

function setupUppy() {
  uppy.use(Tus, {
    endpoint: '/api/admin/upload/',
    chunkSize: TUS_CHUNK_SIZE,
    onAfterResponse: (req: any, res: any) => {
      const header = res.getHeader('X-Media-Record')
      if (header) {
        mediaResults.set(req.getURL(), JSON.parse(header))
      }
    }
  })

  uppy.on('upload-progress', (file: any, progress: any) => {
    const img = images.value.find(i => i.uppyFileId === file?.id)
    if (img && progress.bytesTotal) {
      img.progress = Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
    }
  })

  uppy.on('upload-success', (file: any, response: any) => {
    const img = images.value.find(i => i.uppyFileId === file?.id)
    if (!img) return
    const record = mediaResults.get(response.uploadURL)
    if (record) {
      img.mediaId = record.id
      img.preview = record.thumbnailUrl || record.url
      img.status = 'done'
      img.progress = 100
      mediaResults.delete(response.uploadURL)
    } else {
      img.status = 'done'
      img.progress = 100
    }
  })

  uppy.on('upload-error', (file: any) => {
    const img = images.value.find(i => i.uppyFileId === file?.id)
    if (img) {
      img.status = 'error'
      toast.error(`${file?.name} 上传失败`)
    }
  })
}

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function saveDraft() {
  if (isEdit()) return
  appStore.noteComposeDraft = {
    content: content.value,
    tagIds: selectedTagIds.value,
    isPublished: isPublished.value,
    images: images.value.filter(i => i.mediaId).map(i => ({ mediaId: i.mediaId!, preview: i.preview })),
  }
}

function restoreDraft() {
  const d = appStore.noteComposeDraft
  if (!d) return
  content.value = d.content || ''
  selectedTagIds.value = d.tagIds || []
  isPublished.value = d.isPublished ?? true
  images.value = (d.images || []).map((i: any) => ({
    mediaId: i.mediaId,
    preview: i.preview,
    progress: 100,
    status: 'existing' as const,
  }))
  nextTick(autoResize)
}

function clearDraft() {
  appStore.noteComposeDraft = null
}

function initFromNote() {
  if (!props.note) return
  content.value = props.note.content
  isPublished.value = props.note.isPublished
  selectedTagIds.value = props.note.tags.map(t => t.id)
  images.value = props.note.media.map(m => ({
    mediaId: m.id,
    preview: m.thumbnailUrl || m.url,
    progress: 100,
    status: 'existing' as const
  }))
  nextTick(autoResize)
}

function selectImages() {
  fileInput.value?.click()
}

function addMediaImages(items: MediaItem[]) {
  const existingIds = new Set(images.value.filter(img => img.mediaId).map(img => img.mediaId))
  const nextImages = items
    .filter(item => !existingIds.has(item.id))
    .map(item => ({
      mediaId: item.id,
      preview: item.thumbnailUrl || item.previewUrl || item.url,
      progress: 100,
      status: 'existing' as const
    }))

  if (!nextImages.length) return
  images.value.push(...nextImages)
}

const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  for (const file of Array.from(input.files)) {
    if (!allowedTypes.includes(file.type)) {
      toast.error(`${file.name} 格式不支持，仅支持 JPG/PNG/GIF/WebP/SVG/AVIF`)
      continue
    }
    try {
      const fileId = uppy.addFile({ name: file.name, type: file.type, data: file })
      images.value.push({
        uppyFileId: fileId,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'uploading'
      })
    } catch {
      toast.error(`${file.name} 添加失败`)
    }
  }
  input.value = ''
}

function removeImage(index: number) {
  const img = images.value[index]
  if (img.uppyFileId) {
    try { uppy.removeFile(img.uppyFileId) } catch { /* ignore */ }
  }
  if (img.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview)
  images.value.splice(index, 1)
}

function toggleTag(id: number) {
  const idx = selectedTagIds.value.indexOf(id)
  if (idx >= 0) selectedTagIds.value.splice(idx, 1)
  else selectedTagIds.value.push(id)
}

function reset() {
  content.value = ''
  images.value.forEach(img => {
    if (img.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview)
  })
  images.value = []
  selectedTagIds.value = []
  isPublished.value = true
  clearDraft()
  nextTick(autoResize)
}

async function publish() {
  if (!content.value.trim()) {
    toast.error('内容不能为空')
    return
  }
  if (images.value.some(i => i.status === 'uploading')) {
    toast.error('图片还在上传中')
    return
  }
  if (images.value.some(i => i.status === 'error')) {
    toast.error('有图片上传失败，请移除后重试')
    return
  }

  publishing.value = true
  try {
    const mediaIds = images.value.filter(i => i.mediaId).map(i => i.mediaId!)
    const body = {
      content: content.value,
      isPublished: isPublished.value,
      tagIds: selectedTagIds.value.length ? selectedTagIds.value : undefined,
      mediaIds: mediaIds.length ? mediaIds : undefined
    }

    if (isEdit()) {
      await withMinDuration(() => updateNote(props.note!.id, body))
      toast.success('已更新')
      emit('published', {
        ...props.note!,
        content: content.value,
        isPublished: isPublished.value,
        tags: props.tags.filter(t => selectedTagIds.value.includes(t.id)).map(t => ({ id: t.id, name: t.name, slug: t.slug })),
        media: images.value.filter(i => i.mediaId).map((img, i) => ({
          id: img.mediaId!,
          url: img.preview,
          thumbnailUrl: img.preview,
          previewUrl: null,
          placeholder: null,
          type: 'image',
          mimeType: '',
          filename: '',
          ext: '',
          width: null,
          height: null,
          sort: i,
        })),
      })
    } else {
      await withMinDuration(() => createNote(body))
      toast.success('已发布')
      reset()
      emit('published')
    }
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  } finally {
    publishing.value = false
  }
}

onMounted(() => {
  setupUppy()
  if (isEdit()) {
    initFromNote()
  } else {
    restoreDraft()
    watch([content, selectedTagIds, isPublished, images], saveDraft, { deep: true })
  }
})

onUnmounted(() => {
  uppy?.destroy()
  images.value.forEach(img => {
    if (img.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview)
  })
})
</script>

<template>
  <div class="compose">
    <textarea ref="textareaRef" v-model="content" class="compose-input" placeholder="说点什么..." @input="autoResize" />

    <div v-if="images.length > 0" class="compose-images">
      <div v-for="(img, i) in images" :key="i" :class="['compose-img', img.status === 'error' && 'errored']">
        <img :src="img.preview" alt="" />
        <div v-if="img.status === 'uploading'" class="img-overlay">
          <div class="img-progress" :style="{ width: `${img.progress}%` }" />
        </div>
        <div v-else-if="img.status === 'error'" class="img-overlay error">
          <X style="width: 1rem; height: 1rem; color: #fff" />
        </div>
        <button class="img-remove" @click="removeImage(i)">
          <X style="width: 0.625rem; height: 0.625rem" />
        </button>
      </div>
    </div>

    <div class="compose-footer">
      <div class="compose-left">
        <button class="tool-btn" title="添加图片" @click="selectImages">
          <ImagePlus style="width: 1.125rem; height: 1.125rem" />
        </button>
        <button class="tool-btn" title="从媒体库选择" @click="showMediaPicker = true">
          <Images style="width: 1.125rem; height: 1.125rem" />
        </button>
        <button
          :class="['tool-btn', !isPublished && 'off']"
          :title="isPublished ? '公开' : '隐藏'"
          @click="isPublished = !isPublished"
        >
          <Eye v-if="isPublished" style="width: 1.125rem; height: 1.125rem" />
          <EyeOff v-else style="width: 1.125rem; height: 1.125rem" />
        </button>
        <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFilesSelected" />
      </div>
      <div class="compose-right">
        <Button v-if="isEdit()" variant="ghost" size="sm" @click="emit('cancelled')">取消</Button>
        <Button size="sm" :loading="publishing" @click="publish">
          {{ isEdit() ? '更新' : '发布' }}
        </Button>
      </div>
    </div>

    <div v-if="tags.length > 0" class="compose-tags">
      <button
        v-for="tag in tags"
        :key="tag.id"
        :class="['tag-chip', selectedTagIds.includes(tag.id) && 'on']"
        @click="toggleTag(tag.id)"
      >
        {{ tag.name }}
      </button>
    </div>

    <MediaPickerModal
      v-model:open="showMediaPicker"
      type="image"
      multiple
      title="选择说说图片"
      description="从媒体库选择图片添加到这条说说。"
      @confirm="addMediaImages"
    />
  </div>
</template>

<style scoped lang="less">
.compose {
  background: var(--color-base-200);
  border-radius: 0.75rem;
  padding: 0.875rem;
}

.compose-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--color-base-content);
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.6;
  min-height: 4.5rem;
  overflow: hidden;
}

.compose-images {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

.compose-img {
  position: relative;
  width: 5rem;
  height: 5rem;
  border-radius: 0.375rem;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.img-overlay {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.4);

  &.error {
    background: rgb(220 50 50 / 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.img-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  // height: 0.1875rem;
  height: .25rem;
  background: var(--color-primary);
  transition: width 0.2s;
}

.img-remove {
  position: absolute;
  top: 0.1875rem;
  right: 0.1875rem;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  border: none;
  background: rgb(0 0 0 / 0.5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.1s;

  .compose-img:hover &,
  .compose-img.errored & {
    opacity: 1;
  }
}

.compose-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.625rem;
}

.compose-left,
.compose-right {
  display: flex;
  gap: 0.25rem;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.4;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    opacity: 0.7;
    background: var(--color-base-300);
  }
  &.off {
    color: var(--color-warning);
    opacity: 0.7;
  }
}

.compose-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3125rem;
  margin-top: 0.625rem;
  padding-top: 0.625rem;
  border-top: 0.0625rem solid var(--color-border);
}

.tag-chip {
  padding: 0.125rem 0.5rem;
  border-radius: 0.3125rem;
  border: 0.0625rem solid var(--color-border);
  background: transparent;
  font-size: 0.6875rem;
  color: var(--color-base-content);
  opacity: 0.45;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    opacity: 0.7;
  }

  &.on {
    opacity: 1;
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-primary-content);
  }
}

@media (max-width: 48rem) {
  .img-remove {
    opacity: 1;
  }
}
</style>
