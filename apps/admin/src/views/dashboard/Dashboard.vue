<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Bell,
  BookOpen,
  Eye,
  FileText,
  Image,
  Link2,
  MessageCircle,
  MessagesSquare,
  PenLine,
  RefreshCw,
  Users
} from '@lucide/vue'
import Button from '~/components/base/Button.vue'
import Badge from '~/components/base/Badge.vue'
import Skeleton from '~/components/base/Skeleton.vue'
import { getPosts } from '~/api/posts'
import { getNotes } from '~/api/notes'
import { getComments, type CommentQuery } from '~/api/comments'
import { getMedia } from '~/api/media'
import { getVisitors } from '~/api/visitors'
import { getFriendLinkCounts } from '~/api/friend-links'
import { getUnreadCount } from '~/api/notifications'
import { useAppStore } from '~/stores/app'
import type { Post } from '~/api/posts/types'
import type { Note } from '~/api/notes/types'
import type { Comment } from '~/api/comments/types'

const router = useRouter()
const appStore = useAppStore()

const loading = ref(true)
const partialError = ref(false)
const recentPosts = ref<Post[]>([])
const recentNotes = ref<Note[]>([])
const recentComments = ref<Comment[]>([])

const totals = reactive({
  posts: 0,
  publishedPosts: 0,
  draftPosts: 0,
  notes: 0,
  comments: 0,
  pendingComments: 0,
  media: 0,
  visitors: 0,
  approvedLinks: 0,
  pendingLinks: 0,
  unreadNotifications: 0
})

const adminName = computed(() => appStore.adminUser?.username || '站长')

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const today = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(new Date())
)

const archivedPosts = computed(() =>
  Math.max(0, totals.posts - totals.publishedPosts - totals.draftPosts)
)

const stats = computed(() => [
  {
    label: '文章',
    value: totals.posts,
    detail: `${totals.publishedPosts} 已发布 · ${totals.draftPosts} 草稿`,
    icon: BookOpen,
    tone: 'primary',
    path: '/posts'
  },
  {
    label: '说说',
    value: totals.notes,
    detail: '随手记录的短内容',
    icon: MessagesSquare,
    tone: 'secondary',
    path: '/notes'
  },
  {
    label: '评论',
    value: totals.comments,
    detail: totals.pendingComments > 0 ? `${totals.pendingComments} 条待审核` : '暂无待审核',
    icon: MessageCircle,
    tone: totals.pendingComments > 0 ? 'warning' : 'success',
    path: '/comments'
  },
  {
    label: '媒体',
    value: totals.media,
    detail: '已入库的文件',
    icon: Image,
    tone: 'info',
    path: '/media'
  },
  {
    label: '访客账号',
    value: totals.visitors,
    detail: '已登录访客，非 UV',
    icon: Users,
    tone: 'success',
    path: '/visitors'
  },
  {
    label: '友链',
    value: totals.approvedLinks,
    detail: totals.pendingLinks > 0 ? `${totals.pendingLinks} 个申请待处理` : '暂无待处理申请',
    icon: Link2,
    tone: totals.pendingLinks > 0 ? 'warning' : 'accent',
    path: '/friend-links'
  }
])

const attentionItems = computed(() => [
  {
    label: '待审核评论',
    count: totals.pendingComments,
    icon: MessageCircle,
    path: '/comments'
  },
  {
    label: '友链申请',
    count: totals.pendingLinks,
    icon: Link2,
    path: '/friend-links'
  },
  {
    label: '未读通知',
    count: totals.unreadNotifications,
    icon: Bell,
    path: '/notifications'
  },
  {
    label: '文章草稿',
    count: totals.draftPosts,
    icon: FileText,
    path: '/posts'
  }
])

function resultValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null
}

async function loadDashboard() {
  loading.value = true
  partialError.value = false

  const commentQuery: CommentQuery = { page: 1, pageSize: 4, parentOnly: true }
  const results = await Promise.allSettled([
    getPosts({ page: 1, pageSize: 5 }),
    getPosts({ page: 1, pageSize: 1, status: 'published' }),
    getPosts({ page: 1, pageSize: 1, status: 'draft' }),
    getNotes({ page: 1, pageSize: 4 }),
    getComments(commentQuery),
    getComments({ page: 1, pageSize: 1, parentOnly: true, status: 'pending' }),
    getMedia({ page: 1, pageSize: 1 }),
    getVisitors(),
    getFriendLinkCounts(),
    getUnreadCount()
  ])

  const posts = resultValue(results[0])
  const publishedPosts = resultValue(results[1])
  const draftPosts = resultValue(results[2])
  const notes = resultValue(results[3])
  const comments = resultValue(results[4])
  const pendingComments = resultValue(results[5])
  const media = resultValue(results[6])
  const visitors = resultValue(results[7])
  const friendLinks = resultValue(results[8])
  const unreadCount = resultValue(results[9])

  if (posts) {
    recentPosts.value = posts.list
    totals.posts = posts.total
  }
  if (publishedPosts) totals.publishedPosts = publishedPosts.total
  if (draftPosts) totals.draftPosts = draftPosts.total
  if (notes) {
    recentNotes.value = notes.list
    totals.notes = notes.total
  }
  if (comments) {
    recentComments.value = comments.list
    totals.comments = comments.total
  }
  if (pendingComments) totals.pendingComments = pendingComments.total
  if (media) totals.media = media.total
  if (visitors) totals.visitors = visitors.filter(visitor => visitor.role === 'visitor').length
  if (friendLinks) {
    totals.approvedLinks = friendLinks.approved
    totals.pendingLinks = friendLinks.pending
    appStore.pendingFriendLinkCount = friendLinks.pending
  }
  if (unreadCount !== null) {
    totals.unreadNotifications = unreadCount
    appStore.unreadCount = unreadCount
  }

  partialError.value = results.some(result => result.status === 'rejected')
  loading.value = false
}

function relativeTime(value: string | number) {
  const timestamp = new Date(value).getTime()
  const diff = Date.now() - timestamp
  if (!Number.isFinite(timestamp)) return ''
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} 天前`
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(timestamp))
}

function postStatus(post: Post) {
  if (post.status === 'published') return { label: '已发布', variant: 'success' as const }
  if (post.status === 'archived') return { label: '已归档', variant: 'neutral' as const }
  return { label: '草稿', variant: 'warning' as const }
}

function commentTarget(comment: Comment) {
  return comment.targetType === 'post' ? '文章' : comment.targetType === 'note' ? '说说' : comment.targetType
}

function openWeb() {
  if (appStore.webUrl) window.open(appStore.webUrl, '_blank', 'noopener,noreferrer')
}

onMounted(loadDashboard)
</script>

<template>
  <div class="dashboard-page">
    <header class="dashboard-head">
      <div class="welcome">
        <span class="date">{{ today }}</span>
        <h1>{{ greeting }}，{{ adminName }}</h1>
        <p>今天也继续记录。</p>
      </div>
      <div class="head-actions">
        <Button v-if="appStore.webUrl" variant="ghost" @click="openWeb">
          <Eye class="button-icon" />
          查看前台
        </Button>
        <Button variant="secondary" @click="router.push('/notes')">
          <MessagesSquare class="button-icon" />
          发说说
        </Button>
        <Button @click="router.push('/posts/new')">
          <PenLine class="button-icon" />
          写文章
        </Button>
      </div>
    </header>

    <div v-if="partialError" class="load-notice">
      <span>部分数据暂时没有加载出来</span>
      <button type="button" @click="loadDashboard">
        <RefreshCw />
        重新加载
      </button>
    </div>

    <section class="stats-grid" aria-label="内容概览">
      <template v-if="loading">
        <Skeleton v-for="index in 6" :key="index" class="stat-card stat-skeleton">
          <span class="skeleton-icon" />
          <span class="skeleton-line short" />
          <span class="skeleton-line" />
        </Skeleton>
      </template>
      <button
        v-for="stat in stats"
        v-else
        :key="stat.label"
        type="button"
        class="stat-card"
        :class="`tone-${stat.tone}`"
        @click="router.push(stat.path)"
      >
        <span class="stat-icon"><component :is="stat.icon" /></span>
        <span class="stat-content">
          <span class="stat-label">{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
          <small>{{ stat.detail }}</small>
        </span>
        <ArrowRight class="stat-arrow" />
      </button>
    </section>

    <div class="dashboard-grid">
      <div class="main-column">
        <section class="panel recent-posts">
          <div class="panel-head">
            <div>
              <h2>最近文章</h2>
              <span v-if="!loading">{{ totals.publishedPosts }} 篇正在前台展示<span v-if="archivedPosts">，{{ archivedPosts }} 篇已归档</span></span>
            </div>
            <button class="text-action" type="button" @click="router.push('/posts')">
              全部文章
              <ArrowRight />
            </button>
          </div>

          <div v-if="loading" class="post-list loading-list">
            <Skeleton v-for="index in 4" :key="index" class="loading-row">
              <span class="skeleton-line row-title" />
              <span class="skeleton-line row-meta" />
            </Skeleton>
          </div>
          <div v-else-if="recentPosts.length" class="post-list">
            <button
              v-for="post in recentPosts"
              :key="post.id"
              type="button"
              class="post-row"
              @click="router.push(`/posts/${post.id}`)"
            >
              <div class="post-main">
                <div class="post-title-line">
                  <h3>{{ post.title || '新文章' }}</h3>
                  <Badge :variant="postStatus(post).variant">{{ postStatus(post).label }}</Badge>
                </div>
                <p v-if="post.summary">{{ post.summary }}</p>
                <div class="post-meta">
                  <span v-if="post.category">{{ post.category.name }}</span>
                  <span><Eye />{{ post.viewCount }}</span>
                  <span>{{ relativeTime(post.updatedAt || post.createdAt) }}</span>
                </div>
              </div>
              <ArrowRight class="row-arrow" />
            </button>
          </div>
          <div v-else class="empty-state">
            <BookOpen />
            <span>还没有文章</span>
            <Button size="sm" @click="router.push('/posts/new')">写第一篇</Button>
          </div>
        </section>

        <section class="panel recent-comments">
          <div class="panel-head">
            <div>
              <h2>最近评论</h2>
              <span>来自文章和说说的留言</span>
            </div>
            <button class="text-action" type="button" @click="router.push('/comments')">
              评论管理
              <ArrowRight />
            </button>
          </div>

          <div v-if="loading" class="comment-list loading-list">
            <Skeleton v-for="index in 3" :key="index" class="loading-row comment-loading">
              <span class="skeleton-avatar" />
              <span class="skeleton-line row-title" />
              <span class="skeleton-line row-meta" />
            </Skeleton>
          </div>
          <div v-else-if="recentComments.length" class="comment-list">
            <button
              v-for="comment in recentComments"
              :key="comment.id"
              type="button"
              class="comment-row"
              @click="router.push('/comments')"
            >
              <span class="avatar">
                <img v-if="comment.user.avatarUrl" :src="comment.user.avatarUrl" :alt="comment.user.username" />
                <span v-else>{{ comment.user.username?.slice(0, 1) || '?' }}</span>
              </span>
              <span class="comment-body">
                <span class="comment-line">
                  <strong>{{ comment.user.username || '访客' }}</strong>
                  <Badge v-if="comment.status === 'pending'" variant="warning">待审核</Badge>
                  <small>{{ relativeTime(comment.createdAt) }}</small>
                </span>
                <span class="comment-content">{{ comment.content }}</span>
                <small>评论于{{ commentTarget(comment) }}</small>
              </span>
            </button>
          </div>
          <div v-else class="empty-state compact">
            <MessageCircle />
            <span>最近还没有评论</span>
          </div>
        </section>
      </div>

      <aside class="side-column">
        <section class="panel attention-panel">
          <div class="panel-head">
            <div>
              <h2>待处理</h2>
              <span>需要你看一眼的内容</span>
            </div>
          </div>
          <div class="attention-list">
            <template v-if="loading">
              <Skeleton v-for="index in 4" :key="index" class="attention-row loading-attention">
                <span class="skeleton-icon small" />
                <span class="skeleton-line" />
              </Skeleton>
            </template>
            <button
              v-for="item in attentionItems"
              v-else
              :key="item.label"
              type="button"
              class="attention-row"
              @click="router.push(item.path)"
            >
              <span class="attention-icon"><component :is="item.icon" /></span>
              <span>{{ item.label }}</span>
              <strong :class="{ clear: item.count === 0 }">{{ item.count || '—' }}</strong>
              <ArrowRight />
            </button>
          </div>
        </section>

        <section class="panel notes-panel">
          <div class="panel-head">
            <div>
              <h2>最近说说</h2>
              <span>{{ totals.notes }} 条记录</span>
            </div>
            <button class="icon-action" type="button" title="前往说说" @click="router.push('/notes')">
              <ArrowRight />
            </button>
          </div>

          <div v-if="loading" class="note-list loading-list">
            <Skeleton v-for="index in 3" :key="index" class="loading-row">
              <span class="skeleton-line row-title" />
              <span class="skeleton-line row-meta" />
            </Skeleton>
          </div>
          <div v-else-if="recentNotes.length" class="note-list">
            <button
              v-for="note in recentNotes"
              :key="note.id"
              type="button"
              class="note-row"
              @click="router.push('/notes')"
            >
              <span class="note-copy">{{ note.content }}</span>
              <span class="note-meta">
                <span>{{ relativeTime(note.createdAt) }}</span>
                <span v-if="note.media.length">{{ note.media.length }} 张图片</span>
                <Badge v-if="!note.isPublished" variant="neutral">隐藏</Badge>
              </span>
            </button>
          </div>
          <div v-else class="empty-state compact">
            <MessagesSquare />
            <span>还没有说说</span>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="less">
.dashboard-page {
  width: 100%;
  max-width: 90rem;
  margin: 0 auto;
  color: var(--color-base-content);
}

button {
  font: inherit;
}

.dashboard-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.welcome {
  min-width: 0;

  .date {
    display: block;
    margin-bottom: 0.375rem;
    font-size: 0.75rem;
    opacity: 0.42;
  }

  h1 {
    margin: 0;
    font-size: 1.625rem;
    line-height: 1.25;
    font-weight: 720;
    letter-spacing: 0;
  }

  p {
    margin: 0.375rem 0 0;
    font-size: 0.875rem;
    opacity: 0.48;
  }
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.button-icon {
  width: 0.9375rem;
  height: 0.9375rem;
}

.load-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 0.0625rem solid color-mix(in oklab, var(--color-warning) 30%, transparent);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--color-warning) 8%, transparent);
  font-size: 0.75rem;

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: 0.65;

    &:hover {
      opacity: 1;
    }

    svg {
      width: 0.75rem;
      height: 0.75rem;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.stat-card {
  position: relative;
  min-width: 0;
  min-height: 7.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  overflow: hidden;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-base-100);
  color: var(--color-base-content);
  text-align: left;
}

button.stat-card {
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;

  &:hover {
    border-color: color-mix(in oklab, var(--stat-color) 35%, var(--color-border));
    background: color-mix(in oklab, var(--stat-color) 3%, var(--color-base-100));
    transform: translateY(-0.0625rem);

    .stat-arrow {
      opacity: 0.55;
      transform: translateX(0.125rem);
    }
  }
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--stat-color) 12%, transparent);
  color: var(--stat-color);

  svg {
    width: 1rem;
    height: 1rem;
  }
}

.stat-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.stat-label {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.52;
}

.stat-content strong {
  margin-top: 0.3rem;
  font-size: 1.625rem;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

.stat-content small {
  margin-top: 0.4rem;
  overflow: hidden;
  color: var(--color-base-content);
  font-size: 0.6875rem;
  line-height: 1.35;
  opacity: 0.38;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-arrow {
  position: absolute;
  top: 1rem;
  right: 0.75rem;
  width: 0.8125rem;
  height: 0.8125rem;
  opacity: 0;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.tone-primary { --stat-color: var(--color-primary); }
.tone-secondary { --stat-color: var(--color-secondary); }
.tone-warning { --stat-color: var(--color-warning); }
.tone-success { --stat-color: var(--color-success); }
.tone-info { --stat-color: var(--color-info); }
.tone-accent { --stat-color: var(--color-accent); }

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(17rem, 0.75fr);
  gap: 0.75rem;
  align-items: start;
}

.main-column,
.side-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel {
  min-width: 0;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-base-100);
  overflow: hidden;
}

.panel-head {
  min-height: 4.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-bottom: 0.0625rem solid var(--color-border);

  h2 {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.3;
    font-weight: 700;
  }

  span {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.6875rem;
    opacity: 0.36;
  }
}

.text-action,
.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-base-content);
  cursor: pointer;
  opacity: 0.42;
  transition: opacity 0.14s ease;

  &:hover {
    opacity: 0.8;
  }

  svg {
    width: 0.8125rem;
    height: 0.8125rem;
  }
}

.text-action {
  gap: 0.25rem;
  padding: 0.25rem 0;
  font-size: 0.6875rem;
}

.icon-action {
  width: 1.75rem;
  height: 1.75rem;
}

.post-list,
.comment-list,
.note-list,
.attention-list {
  display: flex;
  flex-direction: column;
}

.post-row,
.comment-row,
.note-row,
.attention-row {
  width: 100%;
  border: none;
  border-bottom: 0.0625rem solid var(--color-border);
  background: transparent;
  color: var(--color-base-content);
  text-align: left;

  &:last-child {
    border-bottom: none;
  }
}

button.post-row,
button.comment-row,
button.note-row,
button.attention-row {
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: var(--color-base-200);
  }
}

.post-row {
  min-height: 5.375rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
}

.post-main {
  min-width: 0;
  flex: 1;
}

.post-title-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  h3 {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 0.875rem;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.post-main > p {
  margin: 0.35rem 0 0;
  overflow: hidden;
  font-size: 0.75rem;
  line-height: 1.4;
  opacity: 0.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.6875rem;
  opacity: 0.34;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  svg {
    width: 0.6875rem;
    height: 0.6875rem;
  }
}

.row-arrow {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  opacity: 0.14;
}

.comment-row {
  min-height: 5.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
}

.avatar,
.skeleton-avatar {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-base-300);
  font-size: 0.75rem;
  font-weight: 650;
  opacity: 0.85;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.comment-body {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.25rem;

  > small {
    font-size: 0.625rem;
    opacity: 0.3;
  }
}

.comment-line {
  display: flex;
  align-items: center;
  gap: 0.375rem;

  strong {
    min-width: 0;
    overflow: hidden;
    font-size: 0.75rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    margin-left: auto;
    flex-shrink: 0;
    font-size: 0.625rem;
    opacity: 0.3;
  }
}

.comment-content {
  overflow: hidden;
  font-size: 0.8125rem;
  line-height: 1.45;
  opacity: 0.7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attention-row {
  height: 3.25rem;
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr) auto 0.75rem;
  align-items: center;
  gap: 0.625rem;
  padding: 0 1rem;
  font-size: 0.75rem;

  > strong {
    min-width: 1.5rem;
    padding: 0.125rem 0.35rem;
    border-radius: 0.25rem;
    background: color-mix(in oklab, var(--color-warning) 14%, transparent);
    color: color-mix(in oklab, var(--color-warning) 78%, var(--color-base-content));
    font-size: 0.6875rem;
    text-align: center;
    font-variant-numeric: tabular-nums;

    &.clear {
      background: var(--color-base-200);
      color: var(--color-base-content);
      opacity: 0.38;
    }
  }

  > svg {
    width: 0.75rem;
    height: 0.75rem;
    opacity: 0.18;
  }
}

.attention-icon {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.3125rem;
  background: var(--color-base-200);
  opacity: 0.7;

  svg {
    width: 0.8125rem;
    height: 0.8125rem;
  }
}

.note-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
}

.note-copy {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.8125rem;
  line-height: 1.55;
  opacity: 0.72;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.625rem;
  opacity: 0.34;

  :deep(.badge) {
    padding-block: 0.0625rem;
    font-size: 0.625rem;
  }
}

.empty-state {
  min-height: 15rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  font-size: 0.75rem;
  opacity: 0.42;

  &.compact {
    min-height: 8rem;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  :deep(.btn) {
    margin-top: 0.25rem;
  }
}

.loading-row {
  position: relative;
  min-height: 5.375rem;
  padding: 1rem;
  border-bottom: 0.0625rem solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.comment-loading {
  padding-left: 3.75rem;

  .skeleton-avatar {
    position: absolute;
    top: 1rem;
    left: 1rem;
  }
}

.skeleton-line,
.skeleton-icon,
.skeleton-avatar {
  display: block;
  background: var(--color-base-300);
}

.skeleton-line {
  width: 100%;
  height: 0.625rem;
  border-radius: 0.1875rem;

  &.short {
    width: 45%;
  }
}

.loading-row .row-title {
  width: 62%;
}

.loading-row .row-meta {
  width: 34%;
  margin-top: 0.875rem;
  opacity: 0.65;
}

.stat-skeleton {
  flex-direction: column;
}

.skeleton-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;

  &.small {
    width: 1.75rem;
    height: 1.75rem;
  }
}

.stat-skeleton .skeleton-line {
  max-width: 6rem;
}

.loading-attention {
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr);
}

@media (width <= 75rem) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .stat-card {
    min-height: 6.75rem;
  }
}

@media (width <= 56rem) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .side-column {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 48rem) {
  .dashboard-page {
    max-width: 42rem;
  }

  .dashboard-head {
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }

  .welcome h1 {
    font-size: 1.375rem;
  }

  .head-actions {
    padding-top: 0.125rem;

    :deep(.btn.ghost),
    :deep(.btn.secondary) {
      display: none;
    }
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat-card {
    min-height: 7rem;
    padding: 0.875rem;
  }

  .stat-content small {
    max-width: 8rem;
  }

  .side-column {
    display: flex;
  }
}

@media (width <= 23rem) {
  .stats-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .stat-card {
    min-height: 5.75rem;
    align-items: center;
  }

  .stat-label {
    margin-top: 0;
  }

  .stat-content strong {
    position: absolute;
    top: 1rem;
    right: 1rem;
    margin: 0;
    font-size: 1.375rem;
  }

  .stat-content small {
    margin-top: 0.25rem;
  }

  .post-row,
  .comment-row {
    padding-inline: 0.875rem;
  }

  .post-title-line :deep(.badge) {
    display: none;
  }
}
</style>
