<script setup lang="ts">
import { X } from '@lucide/vue'
import type { NoteItem, NoteMedia } from '~/composables/useNoteApi'
import { formatDate } from '~/utils/date'

const props = defineProps<{
  note: NoteItem
  showComments?: boolean
}>()

const emit = defineEmits<{ close: [] }>()

function isImage(media: NoteMedia) {
  return media.type === 'image' || media.mimeType.startsWith('image/')
}
</script>

<template>
  <article class="note-detail">
    <header class="detail-header">
      <div>
        <time>{{ formatDate(note.createdAt) }}</time>
        <div v-if="note.tags.length" class="detail-tags">
          <span v-for="tag in note.tags" :key="tag.id">#{{ tag.name }}</span>
        </div>
      </div>
      <button type="button" aria-label="关闭" title="关闭" @click="emit('close')">
        <X :size="18" :stroke-width="1.7" />
      </button>
    </header>

    <p class="detail-content">{{ note.content }}</p>

    <div v-if="note.media.length" class="detail-media">
      <a
        v-for="media in note.media"
        :key="media.id"
        :href="media.url || media.thumbnailUrl || undefined"
        target="_blank"
        rel="noopener noreferrer"
        class="detail-media-item"
        :style="media.placeholder ? { backgroundImage: `url(${media.placeholder})` } : undefined"
      >
        <img
          v-if="isImage(media)"
          :src="media.url || media.thumbnailUrl || ''"
          :alt="note.content.slice(0, 32)"
          loading="lazy"
          decoding="async"
        >
        <span v-else>{{ media.type }}</span>
      </a>
    </div>

    <CommentSection
      v-if="showComments"
      target-type="note"
      :target-id="note.id"
    />
  </article>
</template>

<style scoped lang="less">
.note-detail {
  width: min(46rem, calc(100vw - 2rem));
  padding: 1.5rem clamp(1.25rem, 5vw, 3rem) 3rem;
  border-radius: 0.5rem;
  background: var(--color-base-100);
  color: var(--color-base-content);
  box-shadow: var(--shadow-float);
}

.detail-header {
  position: sticky;
  top: -1.5rem;
  z-index: 1;
  min-height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: color-mix(in oklab, var(--color-base-100) 90%, transparent);
  backdrop-filter: blur(1rem);

  time {
    color: var(--color-subtle);
    font-size: 0.6875rem;
  }

  button {
    width: 2.25rem;
    height: 2.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--color-base-content);
    opacity: 0.48;
    cursor: pointer;
    transition: opacity 0.18s ease, background-color 0.18s ease;

    &:hover {
      background: var(--color-base-200);
      opacity: 1;
    }
  }
}

.detail-tags {
  margin-top: 0.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  color: var(--color-primary);
  font-size: 0.6875rem;
  font-weight: 650;
}

.detail-content {
  padding-top: 1.5rem;
  font-size: 1.0625rem;
  line-height: 1.95;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-media {
  margin-top: 1.75rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.detail-media-item {
  min-height: 12rem;
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

  &:only-child {
    grid-column: 1 / -1;
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
}

:deep(.section) {
  margin-top: 3rem;
}

@media (max-width: 768px) {
  .note-detail {
    padding-inline: 1.25rem;
  }

  .detail-media {
    grid-template-columns: 1fr;
  }

  .detail-media-item {
    min-height: 10rem;
  }
}
</style>
