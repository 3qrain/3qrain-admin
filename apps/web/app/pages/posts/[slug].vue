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
  title: computed(() => `${post.value.title} - 3qrain`),
  meta: [
    { name: 'description', content: post.value.summary || post.value.title },
  ],
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
  <article class="article">
    <div class="page-shell">
      <NuxtLink to="/posts" class="back">返回文章列表</NuxtLink>

      <header class="article-header">
        <div class="header-main">
          <span class="eyebrow">{{ post.category?.name || 'Article' }}</span>
          <h1>{{ post.title }}</h1>
          <p v-if="post.summary">{{ post.summary }}</p>

          <div class="article-meta">
            <time>{{ formatDate(post.createdAt) }}</time>
            <span>{{ post.viewCount }} 次阅读</span>
            <span v-if="post.isPinned">置顶</span>
          </div>
        </div>

        <aside v-if="post.tags.length" class="tag-box soft-card">
          <span>Tags</span>
          <NuxtLink v-for="tag in post.tags" :key="tag.id" :to="`/posts?tag=${tag.slug}`">
            #{{ tag.name }}
          </NuxtLink>
        </aside>
      </header>

      <div v-if="post.cover" class="article-cover">
        <img :src="post.cover" :alt="post.title" />
      </div>
    </div>

    <div class="reader">
      <div v-if="post.contentHtml" class="prose" v-html="post.contentHtml" />
      <div v-else class="empty">暂无内容。</div>

      <CommentSection target-type="post" :target-id="post.id" />
    </div>
  </article>
</template>

<style scoped lang="less">
.article {
  padding: 2rem 0 4rem;
}

.back {
  display: inline-flex;
  align-items: center;
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-muted);
  font-size: 0.8125rem;
  font-weight: 800;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--color-base-content);
    border-color: color-mix(in oklab, var(--color-primary) 45%, var(--color-border));
  }
}

.article-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 14rem;
  gap: 2rem;
  align-items: end;
  margin-top: 2.25rem;
}

.header-main {
  max-width: 54rem;

  h1 {
    margin-top: 0.875rem;
    font-size: clamp(2.25rem, 6vw, 5.2rem);
    line-height: 1.02;
    font-weight: 900;
    letter-spacing: 0;
  }

  p {
    margin-top: 1.25rem;
    max-width: 42rem;
    color: var(--color-muted);
    font-size: 1.0625rem;
    line-height: 1.9;
  }
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
  color: var(--color-subtle);
  font-size: 0.8125rem;
}

.tag-box {
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  span {
    color: var(--color-subtle);
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  a {
    font-size: 0.875rem;
    font-weight: 800;
    color: var(--color-muted);

    &:hover {
      color: var(--color-primary);
    }
  }
}

.article-cover {
  margin-top: 2.5rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--color-base-200);

  img {
    display: block;
    width: 100%;
    max-height: 36rem;
    object-fit: cover;
  }
}

.reader {
  width: min(46rem, calc(100vw - 2rem));
  margin: 3rem auto 0;
}

.empty {
  padding: 4rem 0;
  text-align: center;
  color: var(--color-subtle);
}

.prose {
  font-size: 1.03125rem;
  line-height: 1.9;
  word-break: break-word;

  :deep(*) {
    max-width: 100%;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    line-height: 1.35;
    letter-spacing: 0;
  }

  :deep(h1) {
    font-size: 2rem;
    font-weight: 900;
    margin: 3rem 0 1rem;
  }

  :deep(h2) {
    font-size: 1.625rem;
    font-weight: 900;
    margin: 2.75rem 0 0.875rem;
  }

  :deep(h3) {
    font-size: 1.25rem;
    font-weight: 850;
    margin: 2rem 0 0.75rem;
  }

  :deep(h4) {
    font-size: 1.0625rem;
    font-weight: 850;
    margin: 1.5rem 0 0.625rem;
  }

  :deep(p) {
    margin: 1rem 0;
  }

  :deep(a) {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  :deep(strong) {
    font-weight: 800;
  }

  :deep(blockquote) {
    margin: 1.5rem 0;
    padding: 0.75rem 1rem;
    border-left: 0.25rem solid var(--color-primary);
    background: color-mix(in oklab, var(--color-primary) 7%, transparent);
    color: var(--color-muted);
  }

  :deep(pre) {
    margin: 1.5rem 0;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-base-200);
    overflow-x: auto;
    font-size: 0.875rem;
    line-height: 1.7;
  }

  :deep(code) {
    font-family: "SF Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace;
    font-size: 0.9em;
  }

  :deep(:not(pre) > code) {
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    background: var(--color-base-200);
  }

  :deep(ul),
  :deep(ol) {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  :deep(li) {
    margin: 0.35rem 0;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 2.5rem 0;
  }

  :deep(img) {
    display: block;
    max-width: 100%;
    border-radius: 0.5rem;
    margin: 1.5rem auto;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.875rem;
  }

  :deep(th),
  :deep(td) {
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    text-align: left;
  }

  :deep(th) {
    font-weight: 800;
    background: var(--color-base-200);
  }
}

@media (max-width: 780px) {
  .article-header {
    grid-template-columns: 1fr;
  }

  .tag-box {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
}

@media (max-width: 560px) {
  .article {
    padding-top: 1.5rem;
  }

  .header-main h1 {
    font-size: 2.35rem;
  }

  .reader {
    margin-top: 2rem;
  }
}
</style>
