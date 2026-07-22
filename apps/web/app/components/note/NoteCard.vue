<script setup lang="ts">
import { Images, Maximize2, MessageCircle } from '@lucide/vue'
import type { NoteItem, NoteMedia } from '~/composables/useNoteApi'
import { formatDateOnly } from '~/utils/date'

const props = defineProps<{
  note: NoteItem
  index: number
  mode: 'canvas' | 'list'
  active?: boolean
}>()

const emit = defineEmits<{
  focus: []
  detail: []
  comments: []
}>()

const previewMedia = computed(() => props.note.media.slice(0, props.mode === 'canvas' ? 3 : 4))

function isImage(media: NoteMedia) {
  return media.type === 'image' || media.mimeType.startsWith('image/')
}

function mediaStyle(media: NoteMedia) {
  return media.placeholder ? { backgroundImage: `url(${media.placeholder})` } : undefined
}
</script>

<template>
  <article
    :id="mode === 'list' ? `note-${note.id}` : undefined"
    :class="['note-card', `is-${mode}`, { active }]"
    :aria-current="active ? 'true' : undefined"
    @click="emit('focus')"
  >
    <div class="note-card-inner">
      <header class="note-meta">
        <div class="date-group">
          <span class="sequence">{{ String(index + 1).padStart(2, '0') }}</span>
          <time>{{ formatDateOnly(note.createdAt) }}</time>
        </div>
        <div v-if="note.tags.length" class="tags">
          <span v-for="tag in note.tags.slice(0, 2)" :key="tag.id">#{{ tag.name }}</span>
        </div>
      </header>

      <p class="note-content">{{ note.content }}</p>

      <div
        v-if="previewMedia.length"
        :class="['note-media', `media-count-${Math.min(previewMedia.length, 4)}`]"
      >
        <button
          v-for="(media, mediaIndex) in previewMedia"
          :key="media.id"
          type="button"
          class="media-item"
          :style="mediaStyle(media)"
          :aria-label="`查看第 ${mediaIndex + 1} 个附件`"
          @click.stop="emit('detail')"
        >
          <img
            v-if="isImage(media)"
            :src="media.thumbnailUrl || media.url || ''"
            :alt="note.content.slice(0, 32)"
            loading="lazy"
            decoding="async"
          >
          <span v-else class="media-type">{{ media.type }}</span>
          <span
            v-if="mediaIndex === previewMedia.length - 1 && note.media.length > previewMedia.length"
            class="media-more"
          >
            <Images :size="14" :stroke-width="1.7" />
            +{{ note.media.length - previewMedia.length }}
          </span>
        </button>
      </div>

      <footer class="note-actions">
        <div class="detail-actions">
          <button type="button" title="查看完整内容" aria-label="查看完整内容" @click.stop="emit('detail')">
            <Maximize2 :size="15" :stroke-width="1.7" />
          </button>
          <button type="button" title="查看评论" aria-label="查看评论" @click.stop="emit('comments')">
            <MessageCircle :size="15" :stroke-width="1.7" />
          </button>
        </div>

      </footer>
    </div>
  </article>
</template>

<style scoped lang="less">
.note-card {
  position: relative;
  color: var(--color-base-content);
  cursor: default;
}

.note-card-inner {
  position: relative;
}

.is-canvas {
  width: 20rem;
  padding: 1.125rem 1.125rem 0.875rem;
  border-radius: 0.5rem;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(1rem);
  cursor: pointer;
  transition: box-shadow 0.24s ease, background-color 0.24s ease, opacity 0.24s ease;

  &:hover,
  &.active {
    background: color-mix(in oklab, var(--color-surface) 92%, var(--color-primary) 8%);
    box-shadow: var(--shadow-float);
  }

  &.active::before {
    content: '';
    position: absolute;
    inset: 0.35rem auto 0.35rem 0;
    width: 0.1875rem;
    border-radius: 0 0.25rem 0.25rem 0;
    background: var(--color-primary);
  }

  .note-content {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
  }
}

.is-list {
  width: 100%;
  padding: 2.25rem 0 2.5rem;

  &::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-border) 18% 82%, transparent);
  }

  .note-content {
    max-width: 42rem;
    font-size: 1.0625rem;
    line-height: 1.9;
  }

  .note-media {
    max-width: 42rem;
    height: 18rem;
  }
}

.note-meta,
.date-group,
.tags,
.note-actions,
.detail-actions {
  display: flex;
  align-items: center;
}

.note-meta {
  min-height: 1.25rem;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-subtle);
  font-size: 0.6875rem;
}

.date-group {
  gap: 0.625rem;
}

.sequence {
  color: var(--color-primary);
  font-size: 0.625rem;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.tags {
  min-width: 0;
  justify-content: flex-end;
  gap: 0.5rem;
  color: var(--color-primary);
  font-weight: 650;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.note-content {
  margin-top: 0.75rem;
  line-height: 1.78;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-media {
  height: 10rem;
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem;
  overflow: hidden;
  border-radius: 0.375rem;

  &.media-count-1 {
    grid-template-columns: 1fr;
  }

  &.media-count-3 .media-item:first-child,
  &.media-count-4 .media-item:first-child {
    grid-row: span 2;
  }
}

.media-item {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 0;
  background-color: var(--color-base-200);
  background-position: center;
  background-size: cover;
  color: var(--color-muted);
  cursor: zoom-in;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover img {
    transform: scale(1.035);
  }
}

.media-type,
.media-more {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-type {
  font-size: 0.75rem;
  font-weight: 650;
  text-transform: uppercase;
}

.media-more {
  gap: 0.25rem;
  background: var(--color-overlay);
  color: var(--color-overlay-content);
  font-size: 0.75rem;
  font-weight: 700;
  backdrop-filter: blur(0.25rem);
}

.note-actions {
  height: 2rem;
  margin-top: 0.75rem;
  justify-content: space-between;
}

.detail-actions {
  gap: 0.125rem;
}

.note-actions button {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.42;
  cursor: pointer;
  transition: opacity 0.18s ease, color 0.18s ease, transform 0.18s ease;

  &:hover {
    color: var(--color-primary);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .is-canvas {
    width: min(18rem, calc(100vw - 3rem));
  }

  .is-list {
    padding: 1.75rem 0 2rem;

    .note-media {
      height: 13rem;
    }
  }
}
</style>
