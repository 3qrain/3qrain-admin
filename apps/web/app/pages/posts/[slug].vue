<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
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
  title: computed(() => `${post.value.title} - ${appStore.site.name || '3qrain'}`),
  meta: [
    { name: 'description', content: post.value.summary || post.value.title }
  ]
})

onMounted(async () => {
  try {
    const { data } = await viewApi.record(post.value.id, 'post', appStore.genVisitorId())
    post.value.viewCount = data.viewCount
  } catch {
    // 阅读记录失败不影响正文展示。
  }
})
</script>

<template>
  <article class="article">
    <header :class="['article-intro', { 'has-cover': post.cover }]">
      <div v-if="post.cover" class="cover-layer" aria-hidden="true">
        <img :src="post.cover" alt="" />
      </div>

      <div class="intro-inner">
        <NuxtLink to="/posts" class="back">
          <ArrowLeft :size="16" :stroke-width="1.7" />
          <span>文章</span>
        </NuxtLink>

        <div class="intro-content">
          <span class="eyebrow">{{ post.category?.name || 'Article' }}</span>
          <h1>{{ post.title }}</h1>
          <p v-if="post.summary" class="summary">{{ post.summary }}</p>

          <div class="article-meta">
            <time>{{ formatDate(post.createdAt) }}</time>
            <span>{{ post.viewCount }} 阅读</span>
            <span v-if="post.isPinned" class="pinned">置顶</span>
          </div>

          <div v-if="post.tags.length" class="tags">
            <NuxtLink v-for="tagItem in post.tags" :key="tagItem.id" :to="`/posts?tag=${tagItem.slug}`">
              #{{ tagItem.name }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <div class="reader">
      <div v-if="post.contentHtml" class="prose" v-html="post.contentHtml" />
      <div v-else class="empty">暂无内容。</div>

      <CommentSection target-type="post" :target-id="post.id" />
    </div>
  </article>
</template>

<style scoped lang="less">
.article {
  padding-bottom: 4rem;
}

.article-intro {
  position: relative;
  min-height: 27rem;
  overflow: hidden;
}

.cover-layer {
  position: absolute;
  inset: 0 0 0 42%;
  opacity: 0.34;
  mask-image: linear-gradient(to right, transparent, black 34%, black 78%, transparent);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.intro-inner {
  position: relative;
  width: min(var(--reader-max), 100%);
  margin: 0 auto;
  display: flex;
  min-height: 27rem;
  flex-direction: column;
  justify-content: center;
  padding: 3rem var(--reader-padding) 3.5rem;
}

.back {
  position: absolute;
  top: 2rem;
  left: var(--reader-padding);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-subtle);
  font-size: 0.78rem;
  font-weight: 700;
  transition: color 0.16s ease, transform 0.16s ease;

  &:hover {
    color: var(--color-primary);
    transform: translateX(-0.2rem);
  }
}

.intro-content {
  position: relative;
  max-width: 49rem;

  h1 {
    margin-top: 0.9rem;
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: clamp(2.5rem, 6vw, 5rem);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: 0;
    text-wrap: balance;
  }
}

.summary {
  max-width: 39rem;
  margin-top: 1.25rem;
  color: var(--color-muted);
  font-size: 1rem;
  line-height: 1.85;
}

.article-meta,
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.article-meta {
  margin-top: 1.25rem;
  color: var(--color-subtle);
  font-size: 0.75rem;
}

.pinned {
  color: var(--color-primary);
  font-weight: 700;
}

.tags {
  margin-top: 0.8rem;

  a {
    color: var(--color-primary);
    font-size: 0.72rem;
    font-weight: 700;
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }
}

.reader {
  width: min(var(--reader-max), 100%);
  margin: 2.5rem auto 0;
  padding: 0 var(--reader-padding);
}

.empty {
  padding: 4rem 0;
  text-align: center;
  color: var(--color-subtle);
}

.prose {
  font-size: 1.03125rem;
  line-height: 1.95;
  word-break: break-word;

  :deep(*) {
    max-width: 100%;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    line-height: 1.4;
    letter-spacing: 0;
  }

  :deep(h1) {
    margin: 3rem 0 1rem;
    font-size: 2rem;
    font-weight: 800;
  }

  :deep(h2) {
    margin: 2.75rem 0 0.875rem;
    font-size: 1.625rem;
    font-weight: 800;
  }

  :deep(h3) {
    margin: 2rem 0 0.75rem;
    font-size: 1.25rem;
    font-weight: 800;
  }

  :deep(h4) {
    margin: 1.5rem 0 0.625rem;
    font-size: 1.0625rem;
    font-weight: 800;
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
    border-left: 0.2rem solid var(--color-primary);
    background: var(--color-accent-soft);
    color: var(--color-muted);
  }

  :deep(pre) {
    margin: 1.5rem 0;
    padding: 1rem;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    background: var(--color-base-200);
    font-size: 0.875rem;
    line-height: 1.7;
  }

  :deep(code) {
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
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

  :deep(ul) {
    list-style: disc;
  }

  :deep(ol) {
    list-style: decimal;
  }

  :deep(li) {
    margin: 0.35rem 0;
  }

  :deep(hr) {
    margin: 2.5rem 0;
    border: none;
    border-top: 1px solid var(--color-border);
  }

  :deep(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 1.5rem auto;
    border-radius: 0.375rem;
  }

  :deep(figure) {
    margin: 1.75rem 0;
  }

  :deep(figcaption) {
    margin-top: 0.625rem;
    color: var(--color-subtle);
    font-size: 0.78rem;
    line-height: 1.6;
    text-align: center;
  }

  :deep(table) {
    width: 100%;
    margin: 1.5rem 0;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  :deep(th),
  :deep(td) {
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    text-align: left;
  }

  :deep(th) {
    background: var(--color-base-200);
    font-weight: 800;
  }
}

@media (max-width: 768px) {
  .article-intro,
  .intro-inner {
    min-height: 24rem;
  }

  .cover-layer {
    inset: 35% 0 0;
    opacity: 0.25;
    mask-image: linear-gradient(to bottom, transparent, black 38%, transparent);
  }

  .intro-content h1 {
    font-size: 2.5rem;
  }

  .reader {
    margin-top: 1.75rem;
  }
}
</style>
