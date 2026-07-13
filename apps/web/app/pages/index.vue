<script setup lang="ts">
import { formatDate, formatRelativeTime } from '~/utils/date'

const postApi = usePostApi()
const noteApi = useNoteApi()
const store = useAppStore()

const { data: postsRes } = await useAsyncData('home-posts', () => postApi.getList({ pageSize: 6 }))
const { data: notesRes } = await useAsyncData('home-notes', () => noteApi.getList({ pageSize: 4 }))

const recentPosts = computed(() => postsRes.value?.data?.list ?? [])
const recentNotes = computed(() => notesRes.value?.data?.list ?? [])
const featuredPost = computed(() => recentPosts.value.find(post => post.isPinned) ?? recentPosts.value[0])
const secondaryPosts = computed(() => recentPosts.value.filter(post => post.id !== featuredPost.value?.id).slice(0, 4))
const totalPosts = computed(() => postsRes.value?.data?.total ?? recentPosts.value.length)
const totalNotes = computed(() => notesRes.value?.data?.total ?? recentNotes.value.length)

useHead({
  title: computed(() => `${store.site.name || '3qrain'} - Blog`),
})
</script>

<template>
  <div class="home page-shell">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Personal Blog</span>
        <h1>{{ store.site.name || '3qrain' }}</h1>
        <p>{{ store.site.bio || '在这里记录代码、生活、灵感和一些正在成形的想法。' }}</p>
        <div class="hero-actions">
          <NuxtLink to="/posts" class="primary-link">阅读文章</NuxtLink>
          <NuxtLink to="/notes" class="ghost-link">看看说说</NuxtLink>
        </div>
      </div>

      <aside class="profile soft-card">
        <img v-if="store.site.avatar" :src="store.site.avatar" alt="" class="profile-avatar" />
        <div v-else class="profile-avatar fallback">3</div>
        <div>
          <p class="profile-name">{{ store.site.name || '3qrain' }}</p>
          <p class="profile-bio">{{ store.site.bio || '保持输出，偶尔发呆。' }}</p>
        </div>
        <dl class="stats">
          <div>
            <dt>{{ totalPosts }}</dt>
            <dd>文章</dd>
          </div>
          <div>
            <dt>{{ totalNotes }}</dt>
            <dd>说说</dd>
          </div>
        </dl>
      </aside>
    </section>

    <section v-if="featuredPost" class="featured">
      <NuxtLink :to="`/posts/${featuredPost.slug}`" class="feature-card soft-card">
        <div class="feature-media">
          <img v-if="featuredPost.cover" :src="featuredPost.cover" :alt="featuredPost.title" />
          <div v-else class="feature-blank">
            <span>{{ featuredPost.category?.name || 'Post' }}</span>
          </div>
        </div>
        <div class="feature-body">
          <span class="eyebrow">{{ featuredPost.isPinned ? 'Pinned' : 'Latest' }}</span>
          <h2>{{ featuredPost.title }}</h2>
          <p>{{ featuredPost.summary || '这篇文章暂时没有摘要，点进去读读正文吧。' }}</p>
          <div class="meta">
            <time>{{ formatDate(featuredPost.createdAt) }}</time>
            <span>{{ featuredPost.viewCount }} 阅读</span>
          </div>
        </div>
      </NuxtLink>
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="section-head">
          <div>
            <span class="eyebrow">Writing</span>
            <h2>最近文章</h2>
          </div>
          <NuxtLink to="/posts" class="more">全部文章</NuxtLink>
        </div>

        <div v-if="secondaryPosts.length" class="post-list">
          <NuxtLink v-for="post in secondaryPosts" :key="post.id" :to="`/posts/${post.slug}`" class="post-row">
            <div>
              <h3>{{ post.title }}</h3>
              <p v-if="post.summary">{{ post.summary }}</p>
              <p v-else>{{ post.category?.name || '未分类' }}</p>
            </div>
            <time>{{ formatRelativeTime(post.createdAt) }}</time>
          </NuxtLink>
        </div>
        <p v-else class="empty">还没有更多文章。</p>
      </div>

      <div class="panel notes-panel">
        <div class="section-head">
          <div>
            <span class="eyebrow">Moments</span>
            <h2>近况</h2>
          </div>
          <NuxtLink to="/notes" class="more">全部说说</NuxtLink>
        </div>

        <div v-if="recentNotes.length" class="note-list">
          <NuxtLink v-for="note in recentNotes" :key="note.id" to="/notes" class="note-row">
            <p>{{ note.content }}</p>
            <time>{{ formatRelativeTime(note.createdAt) }}</time>
          </NuxtLink>
        </div>
        <p v-else class="empty">还没有说说。</p>
      </div>
    </section>
  </div>
</template>

<style scoped lang="less">
.home {
  padding: 3rem 0 4rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20rem;
  gap: 3rem;
  align-items: center;
  min-height: 26rem;
}

.hero-copy {
  max-width: 44rem;

  h1 {
    margin-top: 1rem;
    font-size: clamp(3rem, 8vw, 6.8rem);
    line-height: 0.9;
    font-weight: 900;
    letter-spacing: 0;
  }

  p {
    margin-top: 1.25rem;
    max-width: 34rem;
    font-size: 1.0625rem;
    line-height: 1.9;
    color: var(--color-muted);
  }
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.primary-link,
.ghost-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0 1.1rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 800;
}

.primary-link {
  background: var(--color-base-content);
  color: var(--color-base-100);
}

.ghost-link {
  border: 1px solid var(--color-border);
  color: var(--color-muted);
}

.profile {
  padding: 1rem;
  border-radius: 0.5rem;
}

.profile-avatar {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  object-fit: cover;
  background: var(--color-surface-strong);
}

.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  font-weight: 900;
  color: var(--color-primary);
}

.profile-name {
  margin-top: 1rem;
  font-size: 1.125rem;
  font-weight: 900;
}

.profile-bio {
  margin-top: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--color-muted);
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;

  div {
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: var(--color-base-200);
  }

  dt {
    font-size: 1.25rem;
    font-weight: 900;
  }

  dd {
    margin-top: 0.125rem;
    font-size: 0.75rem;
    color: var(--color-subtle);
  }
}

.featured {
  margin-top: 1rem;
}

.feature-card {
  display: grid;
  grid-template-columns: 22rem minmax(0, 1fr);
  gap: 1.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  color: inherit;
  transition: transform 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in oklab, var(--color-primary) 40%, var(--color-border));
  }
}

.feature-media {
  min-height: 15rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--color-base-200);

  img,
  .feature-blank {
    width: 100%;
    height: 100%;
  }

  img {
    object-fit: cover;
  }
}

.feature-blank {
  display: flex;
  align-items: flex-end;
  padding: 1rem;
  background:
    linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 26%, transparent), transparent),
    var(--color-base-200);

  span {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--color-primary);
  }
}

.feature-body {
  align-self: center;
  padding: 0.5rem 1rem 0.5rem 0;

  h2 {
    margin-top: 0.75rem;
    font-size: clamp(1.75rem, 3vw, 3rem);
    line-height: 1.12;
    font-weight: 900;
    letter-spacing: 0;
  }

  p {
    margin-top: 1rem;
    max-width: 36rem;
    color: var(--color-muted);
    line-height: 1.8;
  }
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
  font-size: 0.8125rem;
  color: var(--color-subtle);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(18rem, 0.85fr);
  gap: 2.5rem;
  margin-top: 4rem;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;

  h2 {
    margin-top: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.2;
    font-weight: 900;
  }
}

.more {
  font-size: 0.8125rem;
  font-weight: 800;
  color: var(--color-muted);

  &:hover {
    color: var(--color-base-content);
  }
}

.post-list,
.note-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
}

.post-row,
.note-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);

  h3 {
    font-size: 1rem;
    line-height: 1.45;
    font-weight: 850;
  }

  p {
    margin-top: 0.25rem;
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.7;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  time {
    color: var(--color-subtle);
    font-size: 0.75rem;
    white-space: nowrap;
  }

  &:hover h3,
  &:hover p {
    color: var(--color-primary);
  }
}

.note-row {
  display: block;

  time {
    display: inline-block;
    margin-top: 0.5rem;
  }
}

.empty {
  padding: 2rem 0;
  color: var(--color-subtle);
}

@media (max-width: 900px) {
  .hero,
  .feature-card,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .profile {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 1rem;
    align-items: center;
  }

  .stats {
    grid-column: 1 / -1;
  }

  .feature-media {
    min-height: 13rem;
  }

  .feature-body {
    padding: 0;
  }
}

@media (max-width: 640px) {
  .home {
    padding-top: 2rem;
  }

  .hero {
    min-height: auto;
    gap: 2rem;
  }

  .hero-copy h1 {
    font-size: 3.25rem;
  }

  .profile {
    grid-template-columns: 4.5rem 1fr;
  }

  .post-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style>
