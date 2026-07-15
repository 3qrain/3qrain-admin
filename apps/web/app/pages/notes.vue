<script setup lang="ts">
import { formatDateOnly } from '~/utils/date'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

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
          <time class="note-date">{{ formatDateOnly(note.createdAt) }}</time>

          <div class="note-main">
            <p class="content">{{ note.content }}</p>

            <div v-if="note.media.length" class="media-grid" :class="`count-${Math.min(note.media.length, 4)}`">
              <a
                v-for="media in note.media"
                :key="media.id"
                :href="media.url || media.thumbnailUrl || undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="media-item"
                :style="media.placeholder ? { backgroundImage: `url(${media.placeholder})` } : undefined"
              >
                <img
                  v-if="isImage(media.type, media.mimeType)"
                  :src="media.thumbnailUrl || media.url || ''"
                  :alt="note.content.slice(0, 24)"
                  loading="lazy"
                />
                <span v-else>{{ media.type }}</span>
              </a>
            </div>

            <div v-if="note.tags.length" class="tags">
              <span v-for="tagItem in note.tags" :key="tagItem.id">#{{ tagItem.name }}</span>
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

    <p v-else class="empty">最近很安静。</p>
  </div>
</template>

<style scoped lang="less">
.notes {
  max-width: 50rem;
  padding: 4rem 0;
}

.page-intro {
  padding-bottom: 3rem;

  h1 {
    margin-top: 0.75rem;
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: clamp(2.75rem, 7vw, 4.75rem);
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    max-width: 30rem;
    margin-top: 1rem;
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.75;
  }
}

.note-list {
  border-top: 1px solid var(--color-border);
}

.note {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  gap: 1.75rem;
  padding: 2rem 0;
  border-bottom: 1px solid var(--color-border);
}

.note-date {
  padding-top: 0.25rem;
  color: var(--color-subtle);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.note-main {
  min-width: 0;
}

.content {
  color: var(--color-base-content);
  font-size: 1rem;
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 1.25rem;

  &.count-1 {
    grid-template-columns: minmax(12rem, 28rem);
  }

  &.count-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 34rem;
  }
}

.media-item {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.375rem;
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
    transition: transform 0.25s ease, opacity 0.2s ease;
  }

  &:hover img {
    transform: scale(1.025);
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  margin-top: 1rem;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
}

.pagination {
  margin-top: 2.5rem;
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
    padding-bottom: 2.25rem;
  }

  .note {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1.5rem 0;
  }

  .media-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
