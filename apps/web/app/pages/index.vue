<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { formatDateOnly } from '~/utils/date'

const postApi = usePostApi()
const noteApi = useNoteApi()
const store = useAppStore()

const { data: postsRes } = await useAsyncData('home-posts', () => postApi.getList({ pageSize: 5 }))
const { data: notesRes } = await useAsyncData('home-notes', () => noteApi.getList({ pageSize: 4 }))

const recentPosts = computed(() => postsRes.value?.data?.list ?? [])
const recentNotes = computed(() => notesRes.value?.data?.list ?? [])
const totalPosts = computed(() => postsRes.value?.data?.total ?? recentPosts.value.length)
const totalNotes = computed(() => notesRes.value?.data?.total ?? recentNotes.value.length)

useHead({
  title: computed(() => store.site.name || '3qrain'),
  meta: [
    { name: 'description', content: computed(() => store.site.bio || '写作、记录与一点点生活现场。') }
  ]
})
</script>

<template>
  <div class="home page-shell">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">三秋雨 · Personal journal</span>
        <h1>{{ store.site.name || '3qrain' }}</h1>
        <p>{{ store.site.bio || '在这里记录代码、生活，以及那些还没有名字的念头。' }}</p>
      </div>

      <div class="hero-foot">
        <div class="counts" aria-label="内容统计">
          <span><strong>{{ totalPosts }}</strong> 篇文章</span>
          <span><strong>{{ totalNotes }}</strong> 条说说</span>
        </div>
        <NuxtLink to="/posts" class="read-link">
          开始阅读
          <ArrowRight :size="17" :stroke-width="1.7" />
        </NuxtLink>
      </div>
    </section>

    <section class="journal-grid">
      <div class="writing">
        <header class="section-head">
          <div>
            <span class="eyebrow">Writing</span>
            <h2>最近文章</h2>
          </div>
          <NuxtLink to="/posts">全部文章</NuxtLink>
        </header>

        <div v-if="recentPosts.length" class="post-list">
          <NuxtLink
            v-for="(post, index) in recentPosts"
            :key="post.id"
            :to="`/posts/${post.slug}`"
            class="post-row"
          >
            <span class="post-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="post-copy">
              <div class="post-title-line">
                <h3>{{ post.title }}</h3>
                <span v-if="post.isPinned" class="pinned">置顶</span>
              </div>
              <p>{{ post.summary || '暂时没有摘要，正文里见。' }}</p>
              <div class="post-meta">
                <span v-if="post.category">{{ post.category.name }}</span>
                <time>{{ formatDateOnly(post.createdAt) }}</time>
              </div>
            </div>
            <ArrowRight class="row-arrow" :size="18" :stroke-width="1.5" />
          </NuxtLink>
        </div>
        <p v-else class="empty">文章正在酝酿中。</p>
      </div>

      <aside class="moments">
        <header class="section-head">
          <div>
            <span class="eyebrow">Moments</span>
            <h2>近况</h2>
          </div>
          <NuxtLink to="/notes">全部说说</NuxtLink>
        </header>

        <div v-if="recentNotes.length" class="note-list">
          <NuxtLink v-for="note in recentNotes" :key="note.id" to="/notes" class="note-row">
            <p>{{ note.content }}</p>
            <time>{{ formatDateOnly(note.createdAt) }}</time>
          </NuxtLink>
        </div>
        <p v-else class="empty">最近很安静。</p>
      </aside>
    </section>
  </div>
</template>

<style scoped lang="less">
.home {
  padding: 2.5rem 0 3rem;
}

.hero {
  min-height: 25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 0 2.5rem;
}

.hero-copy {
  max-width: 48rem;

  h1 {
    margin-top: 1.25rem;
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: clamp(3.5rem, 9vw, 6.5rem);
    font-weight: 700;
    line-height: 0.95;
    letter-spacing: 0;
  }

  p {
    max-width: 37rem;
    margin-top: 1.5rem;
    color: var(--color-muted);
    font-size: 1.0625rem;
    line-height: 1.9;
  }
}

.hero-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-top: 3rem;
}

.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  color: var(--color-subtle);
  font-size: 0.8125rem;

  strong {
    color: var(--color-base-content);
    font-size: 1rem;
  }
}

.read-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 700;

  svg {
    transition: transform 0.18s ease;
  }

  &:hover svg {
    transform: translateX(0.25rem);
  }
}

.journal-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(17rem, 0.7fr);
  gap: clamp(3rem, 7vw, 6rem);
  padding-top: 3rem;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  h2 {
    margin-top: 0.35rem;
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: 1.65rem;
    line-height: 1.2;
  }

  > a {
    padding-bottom: 0.15rem;
    color: var(--color-subtle);
    font-size: 0.75rem;
    font-weight: 700;

    &:hover {
      color: var(--color-primary);
    }
  }
}

.post-list,
.note-list {
  border-top: 1px solid var(--color-border);
}

.post-row {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr) 1.25rem;
  gap: 1rem;
  align-items: start;
  padding: 1.35rem 0;
  border-bottom: 1px solid var(--color-border);
}

.post-index {
  padding-top: 0.3rem;
  color: var(--color-subtle);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}

.post-title-line {
  display: flex;
  align-items: center;
  gap: 0.625rem;

  h3 {
    font-size: 1.125rem;
    line-height: 1.45;
    transition: color 0.16s ease;
  }
}

.pinned {
  color: var(--color-primary);
  font-size: 0.6875rem;
  font-weight: 700;
  white-space: nowrap;
}

.post-copy > p {
  display: -webkit-box;
  margin-top: 0.35rem;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.875rem;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.post-meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.65rem;
  color: var(--color-subtle);
  font-size: 0.6875rem;
}

.row-arrow {
  margin-top: 0.25rem;
  color: var(--color-subtle);
  opacity: 0;
  transform: translateX(-0.25rem);
  transition: opacity 0.16s ease, transform 0.16s ease, color 0.16s ease;
}

.post-row:hover {
  h3 {
    color: var(--color-primary);
  }

  .row-arrow {
    color: var(--color-primary);
    opacity: 1;
    transform: translateX(0);
  }
}

.note-row {
  display: block;
  padding: 1.15rem 0;
  border-bottom: 1px solid var(--color-border);

  p {
    display: -webkit-box;
    overflow: hidden;
    font-size: 0.875rem;
    line-height: 1.75;
    white-space: pre-wrap;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    transition: color 0.16s ease;
  }

  time {
    display: block;
    margin-top: 0.55rem;
    color: var(--color-subtle);
    font-size: 0.6875rem;
  }

  &:hover p {
    color: var(--color-primary);
  }
}

.empty {
  padding: 2rem 0;
  color: var(--color-subtle);
  font-size: 0.875rem;
}

@media (max-width: 820px) {
  .journal-grid {
    grid-template-columns: 1fr;
  }

  .moments {
    max-width: 38rem;
  }
}

@media (max-width: 560px) {
  .home {
    padding-top: 1.5rem;
  }

  .hero {
    min-height: 22rem;
    padding-top: 2rem;
  }

  .hero-copy h1 {
    font-size: 3.4rem;
  }

  .hero-foot {
    align-items: flex-start;
    flex-direction: column;
    margin-top: 2.25rem;
  }

  .journal-grid {
    gap: 3.5rem;
  }

  .post-row {
    grid-template-columns: 1.5rem minmax(0, 1fr);
    gap: 0.625rem;
  }

  .row-arrow {
    display: none;
  }
}
</style>
