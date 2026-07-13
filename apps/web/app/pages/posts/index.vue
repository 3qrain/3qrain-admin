<script setup lang="ts">
import { formatDate } from '~/utils/date'

const route = useRoute()
const router = useRouter()

const page = computed(() => Number(route.query.page) || 1)
const pageSize = 8
const category = computed(() => typeof route.query.category === 'string' ? route.query.category : undefined)
const tag = computed(() => typeof route.query.tag === 'string' ? route.query.tag : undefined)

const postApi = usePostApi()
const { data: res, status } = await useAsyncData(
  'posts-list',
  () => postApi.getList({ page: page.value, pageSize, category: category.value, tag: tag.value }),
  { watch: [page, category, tag] }
)

const posts = computed(() => res.value?.data?.list ?? [])
const total = computed(() => res.value?.data?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / pageSize))
const activeFilter = computed(() => category.value || tag.value || '')

function clearFilter() {
  router.push({ query: { page: undefined } })
}

useHead({ title: '文章 - 3qrain' })
</script>

<template>
  <div class="posts page-shell">
    <header class="page-hero">
      <span class="eyebrow">Writing</span>
      <div class="hero-line">
        <h1>文章</h1>
        <p>{{ total }} 篇公开文章，按时间慢慢阅读。</p>
      </div>
      <button v-if="activeFilter" class="filter-chip" @click="clearFilter">
        {{ category ? `分类: ${category}` : `标签: ${tag}` }} / 清除
      </button>
    </header>

    <BaseLoading v-if="status === 'pending'" />

    <template v-else-if="posts.length">
      <div class="list">
        <NuxtLink v-for="post in posts" :key="post.id" :to="`/posts/${post.slug}`" class="item">
          <div class="date-block">
            <time>{{ formatDate(post.createdAt).slice(0, 10) }}</time>
            <span v-if="post.isPinned">Pinned</span>
          </div>

          <div class="item-main">
            <div class="title-row">
              <h2>{{ post.title }}</h2>
              <span>{{ post.viewCount }} 阅读</span>
            </div>
            <p>{{ post.summary || '这篇文章还没有摘要，正文里应该藏着重点。' }}</p>

            <div class="meta">
              <span v-if="post.category" class="category">{{ post.category.name }}</span>
              <span v-for="tagItem in post.tags" :key="tagItem.id" class="tag">#{{ tagItem.name }}</span>
            </div>
          </div>

          <div class="cover">
            <img v-if="post.cover" :src="post.cover" :alt="post.title" />
            <span v-else>{{ post.category?.name || 'Post' }}</span>
          </div>
        </NuxtLink>
      </div>

      <BasePagination
        class="pagination"
        :current-page="page"
        :total-pages="totalPages"
        @change="p => router.push({ query: { ...route.query, page: p > 1 ? p : undefined } })"
      />
    </template>

    <p v-else class="empty">这里暂时没有文章。</p>
  </div>
</template>

<style scoped lang="less">
.posts {
  padding: 3rem 0 4rem;
}

.page-hero {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.hero-line {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;

  h1 {
    font-size: clamp(2.5rem, 7vw, 5.5rem);
    line-height: 0.95;
    font-weight: 900;
    letter-spacing: 0;
  }

  p {
    max-width: 18rem;
    color: var(--color-muted);
    line-height: 1.8;
    text-align: right;
  }
}

.filter-chip {
  align-self: flex-start;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-base-100);
  color: var(--color-muted);
  cursor: pointer;
}

.list {
  display: flex;
  flex-direction: column;
}

.item {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr) 9rem;
  gap: 1.5rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
  color: inherit;
}

.date-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--color-subtle);
  font-size: 0.8125rem;

  span {
    width: fit-content;
    padding: 0.18rem 0.45rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-primary) 13%, transparent);
    color: var(--color-primary);
    font-size: 0.6875rem;
    font-weight: 800;
  }
}

.item-main {
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;

  h2 {
    font-size: clamp(1.25rem, 2vw, 1.75rem);
    line-height: 1.3;
    font-weight: 900;
    letter-spacing: 0;
  }

  span {
    margin-top: 0.25rem;
    color: var(--color-subtle);
    font-size: 0.75rem;
    white-space: nowrap;
  }
}

.item-main p {
  margin-top: 0.625rem;
  max-width: 42rem;
  color: var(--color-muted);
  line-height: 1.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.875rem;
  font-size: 0.75rem;
  font-weight: 750;
  color: var(--color-subtle);
}

.category {
  color: var(--color-primary);
}

.cover {
  aspect-ratio: 1.2;
  border-radius: 0.5rem;
  overflow: hidden;
  background:
    linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent),
    var(--color-base-200);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.24s ease;
  }

  span {
    height: 100%;
    display: flex;
    align-items: end;
    padding: 0.75rem;
    font-size: 0.75rem;
    font-weight: 900;
    color: var(--color-primary);
  }
}

.item:hover {
  .title-row h2 {
    color: var(--color-primary);
  }

  .cover img {
    transform: scale(1.04);
  }
}

.pagination {
  margin-top: 2rem;
}

.empty {
  padding: 6rem 0;
  text-align: center;
  color: var(--color-subtle);
}

@media (max-width: 820px) {
  .hero-line {
    display: block;

    p {
      margin-top: 1rem;
      text-align: left;
    }
  }

  .item {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .date-block {
    flex-direction: row;
    align-items: center;
  }

  .cover {
    aspect-ratio: 2.6;
    order: -1;
  }
}

@media (max-width: 560px) {
  .posts {
    padding-top: 2rem;
  }

  .title-row {
    display: block;

    span {
      display: inline-block;
      margin-top: 0.5rem;
    }
  }
}
</style>
