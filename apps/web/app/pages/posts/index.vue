<script setup lang="ts">
import { ArrowRight, X } from '@lucide/vue'
import { formatDateOnly } from '~/utils/date'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

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

useHead({ title: computed(() => `文章 - ${store.site.name || '3qrain'}`) })
</script>

<template>
  <div class="posts page-shell">
    <header class="page-intro">
      <span class="eyebrow">Writing</span>
      <div class="intro-line">
        <h1>文章</h1>
        <p>长一点的思考与记录，共 {{ total }} 篇。</p>
      </div>
      <button v-if="activeFilter" type="button" class="filter-chip" @click="clearFilter">
        <span>{{ category ? `分类：${category}` : `标签：${tag}` }}</span>
        <X :size="14" :stroke-width="1.8" />
      </button>
    </header>

    <BaseLoading v-if="status === 'pending'" />

    <template v-else-if="posts.length">
      <div class="post-list">
        <NuxtLink v-for="post in posts" :key="post.id" :to="`/posts/${post.slug}`" class="post-item">
          <div class="date-block">
            <time>{{ formatDateOnly(post.createdAt) }}</time>
            <span v-if="post.isPinned">置顶</span>
          </div>

          <div class="item-main">
            <h2>{{ post.title }}</h2>
            <p>{{ post.summary || '暂时没有摘要，正文里见。' }}</p>
            <div class="meta">
              <span v-if="post.category" class="category">{{ post.category.name }}</span>
              <span v-for="tagItem in post.tags" :key="tagItem.id">#{{ tagItem.name }}</span>
              <span>{{ post.viewCount }} 阅读</span>
            </div>
          </div>

          <ArrowRight class="item-arrow" :size="19" :stroke-width="1.5" />
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
  max-width: 60rem;
  padding: 4rem 0;
}

.page-intro {
  padding-bottom: 3rem;
}

.intro-line {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-top: 0.75rem;

  h1 {
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: clamp(2.75rem, 7vw, 4.75rem);
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    max-width: 20rem;
    padding-bottom: 0.25rem;
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.75;
    text-align: right;
  }
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 0.45rem 0.625rem;
  border: none;
  border-radius: 0.3125rem;
  background: var(--color-accent-soft);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.post-list {
  border-top: 1px solid var(--color-border);
}

.post-item {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr) 1.5rem;
  gap: 1.5rem;
  align-items: start;
  padding: 1.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.date-block {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 0.45rem;
  padding-top: 0.3rem;
  color: var(--color-subtle);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;

  span {
    color: var(--color-primary);
    font-size: 0.6875rem;
    font-weight: 700;
  }
}

.item-main {
  min-width: 0;

  h2 {
    font-size: clamp(1.25rem, 2.4vw, 1.65rem);
    line-height: 1.35;
    letter-spacing: 0;
    transition: color 0.16s ease;
  }

  > p {
    display: -webkit-box;
    max-width: 43rem;
    margin-top: 0.55rem;
    overflow: hidden;
    color: var(--color-muted);
    font-size: 0.9rem;
    line-height: 1.75;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.8rem;
  color: var(--color-subtle);
  font-size: 0.7rem;

  .category {
    color: var(--color-primary);
    font-weight: 700;
  }
}

.item-arrow {
  margin-top: 0.35rem;
  color: var(--color-subtle);
  opacity: 0;
  transform: translateX(-0.25rem);
  transition: opacity 0.16s ease, transform 0.16s ease, color 0.16s ease;
}

.post-item:hover {
  h2 {
    color: var(--color-primary);
  }

  .item-arrow {
    color: var(--color-primary);
    opacity: 1;
    transform: translateX(0);
  }
}

.pagination {
  margin-top: 2.5rem;
}

.empty {
  padding: 5rem 0;
  text-align: center;
  color: var(--color-subtle);
}

@media (max-width: 680px) {
  .posts {
    padding-top: 2.5rem;
  }

  .intro-line {
    display: block;

    p {
      margin-top: 1rem;
      padding: 0;
      text-align: left;
    }
  }

  .page-intro {
    padding-bottom: 2.25rem;
  }

  .post-item {
    grid-template-columns: minmax(0, 1fr) 1.25rem;
    gap: 0.75rem;
    padding: 1.4rem 0;
  }

  .date-block {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    padding: 0;
  }

  .item-arrow {
    opacity: 0.45;
    transform: none;
  }
}
</style>
