<script setup lang="ts">
import { ChevronDown, ChevronUp, MessageCircle, Send, UserRound } from '@lucide/vue'
import type { NoteMedia } from '~/composables/useNoteApi'
import { formatDateOnly } from '~/utils/date'

interface PreviewComment {
  id: number
  content: string
  username: string
}

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const page = computed(() => Number(route.query.page) || 1)
const pageSize = 12
const expandedMedia = reactive(new Set<number>())
const openComments = reactive(new Set<number>())
const commentDrafts = reactive<Record<number, string>>({})
const previewComments = reactive<Record<number, PreviewComment[]>>({})

const noteApi = useNoteApi()
const { data: res, status } = await useAsyncData(
  'notes-list',
  () => noteApi.getList({ page: page.value, pageSize }),
  { watch: [page] }
)

const notes = computed(() => res.value?.data?.list ?? [])
const total = computed(() => res.value?.data?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / pageSize))

function isImage(media: NoteMedia) {
  return media.type === 'image' || media.mimeType.startsWith('image/')
}

function compactMedia(media: NoteMedia[]) {
  return media.slice(0, 4)
}

function mediaStyle(media: NoteMedia) {
  return media.placeholder ? { backgroundImage: `url(${media.placeholder})` } : undefined
}

function toggleMedia(noteId: number) {
  if (expandedMedia.has(noteId)) expandedMedia.delete(noteId)
  else expandedMedia.add(noteId)
}

function toggleComments(noteId: number) {
  if (openComments.has(noteId)) openComments.delete(noteId)
  else openComments.add(noteId)
}

function submitPreviewComment(noteId: number) {
  const content = commentDrafts[noteId]?.trim()
  if (!content) return

  previewComments[noteId] ??= []
  previewComments[noteId].push({
    id: Date.now(),
    content,
    username: store.user?.username || '访客'
  })
  commentDrafts[noteId] = ''
}

useHead({ title: computed(() => `说说 - ${store.site.name || '3qrain'}`) })
</script>

<template>
  <div class="notes page-shell">
    <header class="page-intro">
      <span class="eyebrow">Moments</span>
      <h1>说说</h1>
      <p>一些短句、照片和当时的心情，共 {{ total }} 条。</p>
    </header>

    <BaseLoading v-if="status === 'pending'" />

    <template v-else-if="notes.length">
      <div class="note-list">
        <article v-for="note in notes" :key="note.id" class="note">
          <header class="note-meta">
            <time>{{ formatDateOnly(note.createdAt) }}</time>
            <div v-if="note.tags.length" class="tags">
              <span v-for="tagItem in note.tags" :key="tagItem.id">#{{ tagItem.name }}</span>
            </div>
          </header>

          <p class="content">{{ note.content }}</p>

          <div v-if="note.media.length" class="media-wrap">
            <Transition name="media-swap" mode="out-in">
              <div v-if="expandedMedia.has(note.id)" key="expanded" class="expanded-media">
                <div class="expanded-grid">
                  <a
                    v-for="media in note.media"
                    :key="media.id"
                    :href="media.url || media.thumbnailUrl || undefined"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="media-item"
                    :style="mediaStyle(media)"
                  >
                    <img
                      v-if="isImage(media)"
                      :src="media.thumbnailUrl || media.url || ''"
                      :alt="note.content.slice(0, 24)"
                      loading="lazy"
                      decoding="async"
                    />
                    <span v-else>{{ media.type }}</span>
                  </a>
                </div>

                <button type="button" class="fold-button" @click="toggleMedia(note.id)">
                  <ChevronUp :size="14" :stroke-width="1.8" />
                  收起图片
                </button>
              </div>

              <div
                v-else
                key="compact"
                :class="['compact-media', `count-${Math.min(note.media.length, 4)}`]"
              >
                <a
                  v-for="media in compactMedia(note.media)"
                  :key="media.id"
                  :href="media.url || media.thumbnailUrl || undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="media-item"
                  :style="mediaStyle(media)"
                >
                  <img
                    v-if="isImage(media)"
                    :src="media.thumbnailUrl || media.url || ''"
                    :alt="note.content.slice(0, 24)"
                    loading="lazy"
                    decoding="async"
                  />
                  <span v-else>{{ media.type }}</span>
                </a>

                <button
                  v-if="note.media.length > 4"
                  type="button"
                  class="more-media"
                  :aria-label="`展开其余 ${note.media.length - 4} 张图片`"
                  :aria-expanded="false"
                  @click="toggleMedia(note.id)"
                >
                  <strong>+{{ note.media.length - 4 }}</strong>
                  <span>查看全部</span>
                  <ChevronDown :size="14" :stroke-width="1.8" />
                </button>
              </div>
            </Transition>
          </div>

          <div class="note-actions">
            <button
              type="button"
              class="comment-trigger"
              :aria-expanded="openComments.has(note.id)"
              @click="toggleComments(note.id)"
            >
              <MessageCircle :size="15" :stroke-width="1.7" />
              评论
              <span v-if="previewComments[note.id]?.length">{{ previewComments[note.id].length }}</span>
            </button>
          </div>

          <Transition name="comments-reveal">
            <section v-if="openComments.has(note.id)" class="comments" aria-label="评论区">
              <div v-if="previewComments[note.id]?.length" class="comment-list">
                <div v-for="comment in previewComments[note.id]" :key="comment.id" class="comment-row">
                  <span class="comment-avatar">
                    <UserRound :size="14" :stroke-width="1.7" />
                  </span>
                  <div>
                    <strong>{{ comment.username }}</strong>
                    <p>{{ comment.content }}</p>
                  </div>
                </div>
              </div>
              <p v-else class="comment-empty">还没有评论。</p>

              <form class="comment-composer" @submit.prevent="submitPreviewComment(note.id)">
                <img v-if="store.user?.avatarUrl" :src="store.user.avatarUrl" alt="" />
                <span v-else class="composer-avatar">
                  <UserRound :size="15" :stroke-width="1.7" />
                </span>
                <textarea
                  v-model="commentDrafts[note.id]"
                  rows="1"
                  maxlength="500"
                  placeholder="写下评论..."
                  aria-label="评论内容"
                />
                <button
                  type="submit"
                  title="发送评论"
                  :disabled="!commentDrafts[note.id]?.trim()"
                >
                  <Send :size="16" :stroke-width="1.8" />
                </button>
              </form>
            </section>
          </Transition>
        </article>
      </div>

      <BasePagination
        class="pagination"
        :current-page="page"
        :total-pages="totalPages"
        @change="p => router.push({ query: { ...route.query, page: p > 1 ? p : undefined } })"
      />
    </template>

    <p v-else class="empty">最近很安静。</p>
  </div>
</template>

<style scoped lang="less">
.notes {
  max-width: 46rem;
  padding: 4rem 0;
}

.page-intro {
  padding-bottom: 4rem;

  h1 {
    margin-top: 0.75rem;
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: clamp(2.75rem, 7vw, 4.75rem);
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    margin-top: 1rem;
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.75;
  }
}

.note + .note {
  margin-top: 4rem;
}

.note-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-subtle);
  font-size: 0.72rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.625rem;
  color: var(--color-primary);
  font-weight: 700;
}

.content {
  margin-top: 0.85rem;
  font-size: 1.0625rem;
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
}

.media-wrap {
  margin-top: 1.25rem;
}

.compact-media {
  position: relative;
  height: 9rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.375rem;

  &.count-1 {
    width: min(28rem, 100%);
    height: 17rem;
    grid-template-columns: 1fr;
  }

  &.count-2 {
    width: min(36rem, 100%);
    height: 13rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &.count-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.media-item {
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.3125rem;
  background-color: var(--color-base-200);
  background-position: center;
  background-size: cover;
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 700;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.25s ease;
  }

  &:hover img {
    transform: scale(1.025);
  }
}

.more-media {
  position: absolute;
  inset: 0 0 0 auto;
  width: calc((100% - 1.125rem) / 4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.2rem;
  border: none;
  border-radius: 0.3125rem;
  background: var(--color-overlay);
  color: var(--color-overlay-content);
  backdrop-filter: blur(0.25rem);
  cursor: pointer;

  strong {
    font-size: 1.15rem;
  }

  span {
    font-size: 0.65rem;
  }
}

.expanded-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;

  .media-item {
    aspect-ratio: 4 / 3;
  }
}

.fold-button {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0.75rem auto 0;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-subtle);
  font-size: 0.7rem;
  cursor: pointer;

  &:hover {
    color: var(--color-primary);
  }
}

.media-swap-enter-active,
.media-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.media-swap-enter-from,
.media-swap-leave-to {
  opacity: 0;
  transform: translateY(0.3rem);
}

.note-actions {
  margin-top: 1rem;
}

.comment-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-subtle);
  font-size: 0.72rem;
  cursor: pointer;

  &:hover,
  &[aria-expanded='true'] {
    color: var(--color-primary);
  }

  > span {
    font-variant-numeric: tabular-nums;
  }
}

.comments {
  margin-top: 1.25rem;
}

.comment-empty {
  color: var(--color-subtle);
  font-size: 0.78rem;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.comment-row {
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr);
  gap: 0.65rem;

  strong {
    display: block;
    font-size: 0.75rem;
  }

  p {
    margin-top: 0.2rem;
    color: var(--color-muted);
    font-size: 0.85rem;
    line-height: 1.7;
  }
}

.comment-avatar,
.composer-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-accent-soft);
  color: var(--color-primary);
}

.comment-avatar {
  width: 1.75rem;
  height: 1.75rem;
}

.comment-composer {
  display: grid;
  grid-template-columns: 1.875rem minmax(0, 1fr) 2rem;
  gap: 0.625rem;
  align-items: center;
  margin-top: 0.9rem;

  > img,
  .composer-avatar {
    width: 1.875rem;
    height: 1.875rem;
    border-radius: 50%;
    object-fit: cover;
  }

  textarea {
    width: 100%;
    min-height: 2.35rem;
    max-height: 8rem;
    padding: 0.55rem 0.7rem;
    resize: vertical;
    border: none;
    border-radius: 0.3125rem;
    outline: none;
    background: var(--color-surface-muted);
    color: var(--color-base-content);
    font-size: 0.8rem;
    line-height: 1.5;

    &::placeholder {
      color: var(--color-subtle);
    }

    &:focus {
      box-shadow: inset 0 0 0 1px var(--color-primary);
    }
  }

  > button {
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background: var(--color-base-content);
    color: var(--color-base-100);
    cursor: pointer;

    &:disabled {
      cursor: default;
      opacity: 0.2;
    }
  }
}

.comments-reveal-enter-active,
.comments-reveal-leave-active {
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.comments-reveal-enter-from,
.comments-reveal-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem);
}

.pagination {
  margin-top: 4rem;
}

.empty {
  padding: 5rem 0;
  text-align: center;
  color: var(--color-subtle);
}

@media (max-width: 620px) {
  .notes {
    padding-top: 2.5rem;
  }

  .page-intro {
    padding-bottom: 3rem;
  }

  .note + .note {
    margin-top: 3.25rem;
  }

  .note-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tags {
    justify-content: flex-start;
  }

  .compact-media,
  .compact-media.count-2,
  .compact-media.count-3 {
    width: 100%;
    height: 11rem;
  }

  .compact-media.count-1 {
    width: 100%;
    height: 15rem;
  }

  .expanded-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
