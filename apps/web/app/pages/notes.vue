<script setup lang="ts">
import { formatDate, formatRelativeTime } from '~/utils/date'

const route = useRoute()
const router = useRouter()

const page = computed(() => Number(route.query.page) || 1)
const pageSize = 12

const noteApi = useNoteApi()
const { data: res, status } = await useAsyncData(
  'notes-list',
  () => noteApi.getList({ page: page.value, pageSize }),
  { watch: [page] }
)

const notes = computed(() => res.value?.data?.list ?? [])
const total = computed(() => res.value?.data?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / pageSize))

function isImage(type: string, mimeType: string) {
  return type === 'image' || mimeType.startsWith('image/')
}

useHead({ title: '说说 - 3qrain' })
</script>

<template>
  <div class="notes page-shell">
    <header class="page-hero">
      <span class="eyebrow">Moments</span>
      <div>
        <h1>说说</h1>
        <p>{{ total }} 条碎片，留给路过的心情、照片和现场。</p>
      </div>
    </header>

    <BaseLoading v-if="status === 'pending'" />

    <template v-else-if="notes.length">
      <div class="timeline">
        <article v-for="note in notes" :key="note.id" class="note">
          <div class="rail">
            <span />
          </div>

          <div class="note-body soft-card">
            <header class="note-head">
              <time>{{ formatDate(note.createdAt) }}</time>
              <span>{{ formatRelativeTime(note.createdAt) }}</span>
            </header>

            <p class="content">{{ note.content }}</p>

            <div v-if="note.media.length" class="media-grid" :class="`count-${Math.min(note.media.length, 4)}`">
              <a
                v-for="m in note.media"
                :key="m.id"
                :href="m.url || m.thumbnailUrl || undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="media-item"
              >
                <img
                  v-if="isImage(m.type, m.mimeType)"
                  :src="m.thumbnailUrl || m.url || ''"
                  :alt="note.content.slice(0, 20)"
                  loading="lazy"
                />
                <span v-else>{{ m.type }}</span>
              </a>
            </div>

            <div v-if="note.tags.length" class="tags">
              <span v-for="tag in note.tags" :key="tag.id">#{{ tag.name }}</span>
            </div>
          </div>
        </article>
      </div>

      <BasePagination
        class="pagination"
        :current-page="page"
        :total-pages="totalPages"
        @change="p => router.push({ query: { ...route.query, page: p > 1 ? p : undefined } })"
      />
    </template>

    <p v-else class="empty">还没有说说。</p>
  </div>
</template>

<style scoped lang="less">
.notes {
  max-width: 48rem;
  padding: 3rem 0 4rem;
}

.page-hero {
  padding-bottom: 2rem;

  h1 {
    margin-top: 0.75rem;
    font-size: clamp(2.5rem, 7vw, 5rem);
    line-height: 0.95;
    font-weight: 900;
    letter-spacing: 0;
  }

  p {
    margin-top: 1rem;
    max-width: 28rem;
    color: var(--color-muted);
    line-height: 1.8;
  }
}

.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.note {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 1rem;
}

.rail {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 1.25rem;
    bottom: -2rem;
    left: 0.5625rem;
    width: 1px;
    background: var(--color-border);
  }

  span {
    position: sticky;
    top: 6rem;
    display: block;
    width: 1.125rem;
    height: 1.125rem;
    border: 0.25rem solid var(--color-base-100);
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-border);
  }
}

.note:last-child .rail::before {
  display: none;
}

.note-body {
  padding: 1.25rem;
  border-radius: 0.5rem;
}

.note-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-subtle);
  font-size: 0.75rem;
}

.content {
  margin-top: 0.75rem;
  font-size: 1rem;
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;

  &.count-1 {
    grid-template-columns: minmax(12rem, 22rem);
  }

  &.count-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.media-item {
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--color-base-200);
  color: var(--color-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 800;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.22s ease;
  }

  &:hover img {
    transform: scale(1.04);
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  color: var(--color-subtle);
  font-size: 0.75rem;
  font-weight: 800;
}

.pagination {
  margin-top: 2rem;
}

.empty {
  padding: 5rem 0;
  text-align: center;
  color: var(--color-subtle);
}

@media (max-width: 620px) {
  .notes {
    padding-top: 2rem;
  }

  .note {
    grid-template-columns: 1rem minmax(0, 1fr);
    gap: 0.75rem;
  }

  .rail::before {
    left: 0.4375rem;
  }

  .rail span {
    width: 0.875rem;
    height: 0.875rem;
    border-width: 0.1875rem;
  }

  .note-body {
    padding: 1rem;
  }

  .media-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
