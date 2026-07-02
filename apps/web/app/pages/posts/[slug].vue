<script setup lang="ts">
import { onMounted } from 'vue'
import { formatDate } from '~/utils/date'

const route = useRoute()
const slug = route.params.slug as string

const postApi = usePostApi()
const viewApi = useViewApi()
const appStore = useAppStore()

const { data: res, error } = await useAsyncData(`post-${slug}`, () => postApi.getDetail(slug))

if (error.value || !res.value?.success) {
  throw createError({
    statusCode: 404,
    statusMessage: '文章不存在'
  })
}

const post = ref(res.value!.data)

useHead({
  title: computed(() => `${post.value.title} - 3qrain`)
})

onMounted(async () => {
  try {
    const { data } = await viewApi.record(post.value.id, 'post', appStore.genVisitorId())
    post.value.viewCount = data.viewCount
  } catch {
    // ignore
  }
})
</script>

<template>
  <article class="page">
    <NuxtLink to="/posts" class="back">← 返回文章</NuxtLink>

    <header class="article-header">
      <h1 class="article-title">{{ post.title }}</h1>
      <div class="article-meta">
        <time>{{ formatDate(post.createdAt) }}</time>
        <span v-if="post.category" class="category">{{ post.category.name }}</span>
        <span class="views">{{ post.viewCount }} 次阅读</span>
      </div>
      <div v-if="post.tags.length" class="article-tags">
        <span v-for="tag in post.tags" :key="tag.id" class="tag"># {{ tag.name }}</span>
      </div>
    </header>

    <div v-if="post.cover" class="article-cover">
      <img :src="post.cover" :alt="post.title" />
    </div>

    <div v-if="post.contentHtml" class="prose" v-html="post.contentHtml" />

    <div v-else class="empty">暂无内容。</div>

    <CommentSection target-type="post" :target-id="post.id" />
  </article>
</template>

<style scoped lang="less">
.page {
  max-width: 48rem;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

.back {
  display: inline-block;
  margin: 1.5rem 0 2rem;
  font-size: 0.8125rem;
  opacity: 0.35;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
}

.article-header {
  margin-bottom: 2rem;
}

.article-title {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  opacity: 0.4;
}

.category {
  color: var(--color-primary);
  opacity: 1;
  font-weight: 500;
}

.article-tags {
  display: flex;
  gap: 0.625rem;
  margin-top: 0.625rem;
}

.tag {
  font-size: 0.8125rem;
  opacity: 0.35;
}

.article-cover {
  margin-bottom: 2rem;
  border-radius: 0.75rem;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
  }
}

.empty {
  padding: 3rem 0;
  text-align: center;
  opacity: 0.35;
}

.prose {
  font-size: 1rem;
  line-height: 1.8;
  word-break: break-word;

  :deep(h1) {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 2.5rem 0 1rem;
  }
  :deep(h2) {
    font-size: 1.375rem;
    font-weight: 600;
    margin: 2rem 0 0.75rem;
  }
  :deep(h3) {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 1.5rem 0 0.625rem;
  }
  :deep(h4) {
    font-size: 1rem;
    font-weight: 600;
    margin: 1.25rem 0 0.5rem;
  }

  :deep(p) {
    margin: 0.75rem 0;
  }

  :deep(a) {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  :deep(strong) {
    font-weight: 600;
  }

  :deep(blockquote) {
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    border-left: 3px solid var(--color-border);
    opacity: 0.7;
  }

  :deep(pre) {
    margin: 1rem 0;
    padding: 1rem 1.25rem;
    border-radius: 0.5rem;
    background: var(--color-base-200);
    overflow-x: auto;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  :deep(code) {
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.875em;
  }

  :deep(:not(pre) > code) {
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    background: var(--color-base-200);
  }

  :deep(ul),
  :deep(ol) {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  :deep(li) {
    margin: 0.25rem 0;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 2rem 0;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 0.5rem;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.875rem;
  }

  :deep(th),
  :deep(td) {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    text-align: left;
  }

  :deep(th) {
    font-weight: 600;
    background: var(--color-base-200);
  }
}

@media (max-width: 640px) {
  .page {
    padding: 0 1.25rem 3rem;
  }
  .article-title {
    font-size: 1.5rem;
  }
  .views {
    display: none;
  }
}
</style>
