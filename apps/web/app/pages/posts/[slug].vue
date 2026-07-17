<script setup lang="ts">
import { ArrowLeft, Clock3, Eye } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import type { TiptapNode } from '@3qrain/shared'
import { formatDateOnly } from '~/utils/date'

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

function getTextLength(node: TiptapNode): number {
  if (node.type === 'text') return node.text?.length || 0
  return node.content?.reduce((total, child) => total + getTextLength(child), 0) || 0
}

const readingMinutes = computed(() => {
  const length = getTextLength(post.value.content)
  return Math.max(1, Math.ceil(length / 500))
})

const wasUpdated = computed(() => {
  return new Date(post.value.updatedAt).getTime() - new Date(post.value.createdAt).getTime() > 60_000
})

useSeoMeta({
  title: () => `${post.value.title} - ${appStore.site.name || '3qrain'}`,
  description: () => post.value.summary || post.value.title,
  ogTitle: () => post.value.title,
  ogDescription: () => post.value.summary || post.value.title,
  ogType: 'article',
  ogImage: () => post.value.cover || undefined,
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
    <header :class="['article-header', { 'has-cover': post.cover }]">
      <div v-if="post.cover" class="cover-layer" aria-hidden="true">
        <img :src="post.cover" alt="">
      </div>

      <div class="article-head-inner">
        <NuxtLink to="/posts" class="back-link">
          <ArrowLeft :size="15" :stroke-width="1.8" />
          <span>返回文章</span>
        </NuxtLink>

        <div class="article-kicker">
          <NuxtLink
            v-if="post.category"
            :to="`/posts?category=${post.category.slug}`"
            class="eyebrow"
          >
            {{ post.category.name }}
          </NuxtLink>
          <span v-else class="eyebrow">Article</span>
          <span v-if="post.isPinned" class="pinned">置顶</span>
        </div>

        <h1>{{ post.title }}</h1>
        <p v-if="post.summary" class="summary">{{ post.summary }}</p>

        <div class="article-meta">
          <time :datetime="post.createdAt">{{ formatDateOnly(post.createdAt) }}</time>
          <span><Clock3 :size="13" />{{ readingMinutes }} 分钟</span>
          <span><Eye :size="13" />{{ post.viewCount }} 阅读</span>
        </div>

        <div v-if="post.tags.length" class="article-tags">
          <NuxtLink
            v-for="tagItem in post.tags"
            :key="tagItem.id"
            :to="`/posts?tag=${tagItem.slug}`"
          >
            #{{ tagItem.name }}
          </NuxtLink>
        </div>
      </div>
    </header>

    <div class="reader">
      <PostContent
        v-if="post.content.content.length"
        :content="post.content"
      />
      <p v-else class="empty">暂无内容。</p>

      <footer class="article-end">
        <span class="end-line" />
        <p v-if="wasUpdated">
          最后更新于
          <time :datetime="post.updatedAt">{{ formatDateOnly(post.updatedAt) }}</time>
        </p>
      </footer>

      <section class="discussion" aria-labelledby="discussion-title">
        <header class="discussion-head">
          <span class="eyebrow">Discussion</span>
          <h2 id="discussion-title">留言</h2>
        </header>
        <CommentSection target-type="post" :target-id="post.id" />
      </section>
    </div>
  </article>
</template>

<style scoped lang="less">
.article {
  padding-bottom: 4rem;
}

.article-header {
  position: relative;
  overflow: hidden;
  background: color-mix(in oklab, var(--color-base-200) 38%, transparent);
}

.cover-layer {
  position: absolute;
  inset: 0 0 0 48%;
  opacity: 0.28;
  mask-image: linear-gradient(to right, transparent 0%, black 30%, black 78%, transparent 100%);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 62%, var(--color-base-100));
    opacity: 0.45;
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
}

.article-head-inner {
  position: relative;
  width: min(var(--reader-max), 100%);
  margin: 0 auto;
  padding: 2.25rem var(--reader-padding) 3.75rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-subtle);
  font-size: 0.75rem;
  font-weight: 650;
  transition: color 0.16s ease, transform 0.16s ease;

  &:hover {
    color: var(--color-primary);
    transform: translateX(-0.1875rem);
  }
}

.article-kicker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 3rem;
}

.pinned {
  color: var(--color-primary);
  font-size: 0.6875rem;
  font-weight: 700;
}

h1 {
  max-width: 42rem;
  margin-top: 0.75rem;
  font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: 0;
  text-wrap: balance;
}

.summary {
  max-width: 38rem;
  margin-top: 1.125rem;
  color: var(--color-muted);
  font-size: 0.9375rem;
  line-height: 1.8;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.875rem;
  margin-top: 1.25rem;
  color: var(--color-subtle);
  font-size: 0.72rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;

  a {
    color: var(--color-primary);
    font-size: 0.7rem;
    font-weight: 650;
    opacity: 0.72;
    transition: opacity 0.15s ease;

    &:hover { opacity: 1; }
  }
}

.reader {
  width: min(var(--reader-max), 100%);
  margin: 0 auto;
  padding: 3.25rem var(--reader-padding) 0;
}

.empty {
  padding: 4rem 0;
  color: var(--color-subtle);
  text-align: center;
}

.article-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 4rem;
  color: var(--color-subtle);
  font-size: 0.6875rem;
}

.end-line {
  width: 2.5rem;
  height: 0.0625rem;
  background: var(--color-border);
}

.discussion {
  margin-top: 4rem;
}

.discussion-head {
  h2 {
    margin-top: 0.4rem;
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: 1.625rem;
    line-height: 1.2;
    letter-spacing: 0;
  }
}

.discussion :deep(.section) {
  margin-top: 1.5rem;
  padding-top: 0;
}

@media (max-width: 768px) {
  .cover-layer {
    inset: 24% 0 0;
    opacity: 0.2;
    mask-image: linear-gradient(to bottom, transparent, black 32%, transparent 94%);
  }

  .article-head-inner {
    padding-top: 1.5rem;
    padding-bottom: 3rem;
  }

  .article-kicker {
    margin-top: 2.5rem;
  }

  h1 {
    font-size: 2.25rem;
    line-height: 1.16;
  }

  .summary {
    font-size: 0.875rem;
  }

  .reader {
    padding-top: 2.5rem;
  }

  .discussion {
    margin-top: 3.5rem;
  }
}
</style>
