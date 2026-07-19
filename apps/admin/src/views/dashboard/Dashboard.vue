<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Bell, Eye, FileText, Link2, MessageCircle, MessagesSquare, PenLine, RefreshCw } from '@lucide/vue'
import Button from '~/components/base/Button.vue'
import Skeleton from '~/components/base/Skeleton.vue'
import { getDashboard } from '~/api/dashboard'
import { useAppStore } from '~/stores/app'
import type { DashboardData, DashboardRecentComment } from '~/api/dashboard/types'

const router = useRouter()
const appStore = useAppStore()

const loading = ref(true)
const error = ref(false)
const dashboard = ref<DashboardData | null>(null)

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

const overview = computed(() => dashboard.value?.overview)

const pendingTotal = computed(() => {
  if (!overview.value) return 0
  return overview.value.comments.pending + overview.value.friendLinks.pending + overview.value.unreadNotifications
})

const headerSummary = computed(() => {
  if (loading.value) return '正在整理站点状态'
  if (error.value) return '仪表盘数据暂时不可用'
  if (pendingTotal.value > 0) return `有 ${pendingTotal.value} 项内容等待处理`
  return `站点运行正常，当前 ${overview.value?.onlineVisitors || 0} 人在线`
})

const keyMetrics = computed(() => [
  {
    label: '当前在线',
    value: overview.value?.onlineVisitors || 0,
    suffix: '人',
    live: true,
    tone: 'success'
  },
  {
    label: '内容',
    value: (overview.value?.posts.total || 0) + (overview.value?.notes.total || 0),
    suffix: '条',
    tone: 'primary'
  },
  {
    label: '评论',
    value: overview.value?.comments.total || 0,
    suffix: '条',
    tone: 'secondary'
  }
])

const focusItems = computed(() => [
  {
    label: '待审核评论',
    count: overview.value?.comments.pending || 0,
    icon: MessageCircle,
    route: '/comments'
  },
  {
    label: '友链申请',
    count: overview.value?.friendLinks.pending || 0,
    icon: Link2,
    route: '/friend-links'
  },
  {
    label: '未读通知',
    count: overview.value?.unreadNotifications || 0,
    icon: Bell,
    route: '/notifications'
  },
  {
    label: '文章草稿',
    count: overview.value?.posts.draft || 0,
    icon: FileText,
    route: '/posts'
  }
])

const contentSummary = computed(() => [
  { label: '已发布文章', value: overview.value?.posts.published || 0 },
  { label: '说说', value: overview.value?.notes.total || 0 },
  { label: '媒体', value: overview.value?.media || 0 },
  { label: '访客账号', value: overview.value?.visitors || 0 }
])

const demoTrend = computed(() => {
  const values = [46, 64, 38, 72, 57, 88, 76]
  return values.map((value, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return {
      value,
      label: new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(date)
    }
  })
})

function commentAction(comment: DashboardRecentComment) {
  return comment.parentId ? '回复了评论' : '发表了评论'
}

function commentTarget(comment: DashboardRecentComment) {
  if (comment.targetType === 'post') return '文章'
  if (comment.targetType === 'note') return '说说'
  return comment.targetType
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  const diff = Date.now() - timestamp
  if (!Number.isFinite(timestamp)) return ''
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} 天前`
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(timestamp))
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function openWeb() {
  if (appStore.webUrl) window.open(appStore.webUrl, '_blank', 'noopener,noreferrer')
}

async function load() {
  loading.value = true
  error.value = false
  try {
    dashboard.value = await getDashboard()
    appStore.unreadCount = dashboard.value.overview.unreadNotifications
    appStore.pendingFriendLinkCount = dashboard.value.overview.friendLinks.pending
    appStore.pendingCommentCount = dashboard.value.overview.comments.pending
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="dashboard-page">
    <header class="dashboard-head">
      <div class="welcome">
        <span class="date">{{ today }}</span>
        <h1>{{ greeting }}，{{ adminName }}</h1>
        <p>{{ headerSummary }}</p>
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

    <div v-if="error" class="error-state">
      <div>
        <strong>仪表盘暂时没有加载出来</strong>
        <span>其他管理功能不受影响</span>
      </div>
      <Button variant="secondary" size="sm" @click="load">
        <RefreshCw class="button-icon" />
        重试
      </Button>
    </div>

    <template v-else>
      <div class="insight-grid">
        <section class="signal-panel reveal reveal-1">
          <div class="signal-primary">
            <span class="signal-label"><Eye /> 累计文章阅读</span>
            <Skeleton v-if="loading" class="metric-skeleton large" />
            <strong v-else>{{ formatNumber(overview?.totalViews || 0) }}</strong>
            <small>{{ overview?.posts.published || 0 }} 篇文章正在前台展示</small>
          </div>

          <div class="signal-metrics">
            <div
              v-for="metric in keyMetrics"
              :key="metric.label"
              class="signal-metric"
              :class="`metric-${metric.tone}`"
            >
              <span>
                <i v-if="metric.live" class="live-dot" />
                {{ metric.label }}
              </span>
              <Skeleton v-if="loading" class="metric-skeleton" />
              <strong v-else
                >{{ metric.value }}<small>{{ metric.suffix }}</small></strong
              >
            </div>
          </div>
        </section>

        <section class="trend-panel reveal reveal-2">
          <div class="section-head">
            <div>
              <h2>近 7 天访问</h2>
              <span>统计模块接入后显示真实数据</span>
            </div>
            <span class="demo-badge">示意</span>
          </div>

          <div class="trend-chart" aria-label="近七天访问趋势示意图">
            <div v-for="(item, index) in demoTrend" :key="item.label" class="trend-column">
              <span class="trend-track">
                <i
                  :class="{ current: index === demoTrend.length - 1 }"
                  :style="{ '--bar-height': `${item.value}%`, '--bar-delay': `${index * 45}ms` }"
                />
              </span>
              <small>{{ item.label }}</small>
            </div>
          </div>
        </section>
      </div>

      <div class="workspace-grid">
        <section class="comments-panel panel reveal reveal-3">
          <div class="section-head bordered">
            <div>
              <h2>最新评论</h2>
              <span>包含评论和回复</span>
            </div>
            <button type="button" class="section-action" @click="router.push('/comments')">
              全部评论
              <ArrowRight />
            </button>
          </div>

          <div v-if="loading" class="comment-list">
            <Skeleton v-for="index in 5" :key="index" class="comment-skeleton">
              <span class="skeleton-avatar" />
              <span class="skeleton-line wide" />
              <span class="skeleton-line short" />
            </Skeleton>
          </div>
          <div v-else-if="dashboard?.recentComments.length" class="comment-list">
            <button
              v-for="comment in dashboard.recentComments"
              :key="comment.id"
              type="button"
              class="comment-row"
              @click="router.push('/comments')"
            >
              <span class="comment-avatar">
                <img v-if="comment.user.avatarUrl" :src="comment.user.avatarUrl" :alt="comment.user.username" />
                <span v-else>{{ comment.user.username.slice(0, 1) || '?' }}</span>
              </span>
              <span class="comment-copy">
                <span class="comment-title">
                  <strong>{{ comment.user.username || '访客' }}</strong>
                  <span>{{ commentAction(comment) }}</span>
                  <em v-if="comment.status === 'pending'">待审核</em>
                </span>
                <span class="comment-content">{{ comment.content }}</span>
                <span class="comment-meta">来自{{ commentTarget(comment) }}</span>
              </span>
              <time>{{ relativeTime(comment.createdAt) }}</time>
            </button>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon"><MessageCircle /></span>
            <span>还没有评论</span>
          </div>
        </section>

        <aside class="side-column">
          <section class="focus-panel panel reveal reveal-4">
            <div class="section-head bordered">
              <div>
                <h2>需要关注</h2>
                <span>{{ pendingTotal ? `${pendingTotal} 项等待处理` : '目前没有待处理事项' }}</span>
              </div>
            </div>

            <div class="focus-list">
              <template v-if="loading">
                <Skeleton v-for="index in 4" :key="index" class="focus-skeleton">
                  <span class="skeleton-square" />
                  <span class="skeleton-line wide" />
                </Skeleton>
              </template>
              <button
                v-for="item in focusItems"
                v-else
                :key="item.label"
                type="button"
                class="focus-row"
                :class="{ 'has-count': item.count > 0 }"
                @click="router.push(item.route)"
              >
                <span class="focus-icon"><component :is="item.icon" /></span>
                <span>{{ item.label }}</span>
                <strong :class="{ muted: item.count === 0 }">{{ item.count }}</strong>
              </button>
            </div>

            <div class="content-summary">
              <div v-for="item in contentSummary" :key="item.label">
                <strong>{{ item.value }}</strong>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </section>

          <section class="top-posts panel reveal reveal-5">
            <div class="section-head bordered">
              <div>
                <h2>阅读较多</h2>
                <span>按累计阅读排序</span>
              </div>
              <button type="button" class="icon-button" title="查看全部文章" @click="router.push('/posts')">
                <ArrowRight />
              </button>
            </div>

            <div v-if="loading" class="top-list">
              <Skeleton v-for="index in 4" :key="index" class="top-skeleton">
                <span class="skeleton-line wide" />
                <span class="skeleton-line short" />
              </Skeleton>
            </div>
            <div v-else-if="dashboard?.topPosts.length" class="top-list">
              <button
                v-for="(post, index) in dashboard.topPosts"
                :key="post.id"
                type="button"
                class="top-row"
                :class="{ leading: index < 3 }"
                @click="router.push(`/posts/${post.id}`)"
              >
                <span class="rank">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="top-title">{{ post.title || '新文章' }}</span>
                <span class="view-count"><Eye /> {{ formatNumber(post.viewCount) }}</span>
              </button>
            </div>
            <div v-else class="empty-state compact">
              <span>暂无已发布文章</span>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
.dashboard-page {
  width: 100%;
  max-width: 88rem;
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
    font-size: 0.8125rem;
    opacity: 0.44;
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

.error-state {
  min-height: 18rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-base-100);

  div {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  strong {
    font-size: 0.875rem;
  }

  span {
    font-size: 0.75rem;
    opacity: 0.4;
  }
}

.insight-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(22rem, 0.85fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.signal-panel,
.trend-panel {
  min-width: 0;
  height: 13.5rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.signal-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(13rem, 1.1fr) minmax(0, 1fr);
  background: var(--color-neutral);
  color: var(--color-neutral-content);

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 0.1875rem;
    background: var(--color-primary);
  }
}

.signal-primary {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 1.5rem;
  border-right: 0.0625rem solid color-mix(in oklab, var(--color-neutral-content) 14%, transparent);

  > strong {
    margin-top: 0.75rem;
    font-size: 2.75rem;
    line-height: 1;
    font-weight: 720;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
  }

  > small {
    margin-top: 0.75rem;
    font-size: 0.6875rem;
    opacity: 0.46;
  }
}

.signal-label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  opacity: 0.58;

  svg {
    width: 0.8125rem;
    height: 0.8125rem;
  }
}

.signal-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.signal-metric {
  --metric-color: var(--color-neutral-content);
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.875rem;
  border-right: 0.0625rem solid color-mix(in oklab, var(--color-neutral-content) 10%, transparent);

  &:last-child {
    border-right: none;
  }

  > span {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.6875rem;
    white-space: nowrap;
    opacity: 0.44;
  }

  > strong {
    margin-top: 0.65rem;
    font-size: 1.375rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: color-mix(in oklab, var(--metric-color) 84%, var(--color-neutral-content));

    small {
      margin-left: 0.2rem;
      font-size: 0.625rem;
      font-weight: 500;
      opacity: 0.4;
    }
  }
}

.metric-success {
  --metric-color: var(--color-success);
}
.metric-primary {
  --metric-color: var(--color-primary);
}
.metric-secondary {
  --metric-color: var(--color-secondary);
}

.live-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-success) 45%, transparent);
  animation: live-pulse 2.4s ease-out infinite;
}

.trend-panel,
.panel {
  border: 0.0625rem solid var(--color-border);
  background: var(--color-base-100);
}

.trend-panel {
  padding: 1rem 1.125rem 0.75rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  &.bordered {
    min-height: 4rem;
    padding: 0.875rem 1rem;
    border-bottom: 0.0625rem solid var(--color-border);
  }

  h2 {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.3;
    font-weight: 700;
  }

  div > span {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.6875rem;
    opacity: 0.34;
  }
}

.demo-badge {
  padding: 0.125rem 0.375rem;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.25rem;
  font-size: 0.625rem;
  opacity: 0.42;
}

.trend-chart {
  height: 9.5rem;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.625rem;
  align-items: end;
  padding-top: 1.25rem;
}

.trend-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  small {
    font-size: 0.5625rem;
    opacity: 0.3;
  }
}

.trend-track {
  position: relative;
  width: 100%;
  max-width: 2.125rem;
  height: 6.75rem;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 0.1875rem;
  background: var(--color-base-200);

  i {
    width: 100%;
    height: var(--bar-height);
    border-radius: inherit;
    background: color-mix(in oklab, var(--color-primary) 32%, var(--color-base-300));
    transform-origin: bottom;
    animation: bar-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--bar-delay);

    &.current {
      background: var(--color-primary);
      box-shadow: 0 -0.125rem 0.75rem color-mix(in oklab, var(--color-primary) 22%, transparent);
    }
  }
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(19rem, 0.55fr);
  gap: 0.75rem;
  align-items: start;
}

.panel {
  min-width: 0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.side-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comment-list,
.focus-list,
.top-list {
  display: flex;
  flex-direction: column;
}

.comment-row {
  width: 100%;
  min-height: 4.25rem;
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border: none;
  border-bottom: 0.0625rem solid var(--color-border);
  background: transparent;
  color: var(--color-base-content);
  text-align: left;
  cursor: pointer;
  transition: background 0.14s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-base-200);
  }

  > time {
    font-size: 0.625rem;
    white-space: nowrap;
    opacity: 0.28;
  }
}

.comment-avatar {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  background: color-mix(in oklab, var(--color-primary) 14%, var(--color-base-200));
  color: var(--color-primary);
  font-size: 0.6875rem;
  font-weight: 700;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.comment-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
}

.comment-title {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;

  strong {
    min-width: 0;
    overflow: hidden;
    font-size: 0.75rem;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > span {
    flex-shrink: 0;
    font-size: 0.625rem;
    opacity: 0.34;
  }

  em {
    flex-shrink: 0;
    padding: 0.0625rem 0.3rem;
    border-radius: 0.1875rem;
    background: color-mix(in oklab, var(--color-warning) 16%, transparent);
    color: color-mix(in oklab, var(--color-warning) 72%, var(--color-base-content));
    font-size: 0.5625rem;
    font-style: normal;
  }
}

.comment-content {
  overflow: hidden;
  font-size: 0.75rem;
  opacity: 0.58;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comment-meta {
  font-size: 0.5625rem;
  opacity: 0.26;
}

.section-action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.6875rem;
  cursor: pointer;
  opacity: 0.68;
  transition: opacity 0.14s ease;

  &:hover {
    opacity: 1;
  }

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
}

.focus-row {
  width: 100%;
  height: 3rem;
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.625rem;
  padding: 0 1rem;
  border: none;
  background: transparent;
  color: var(--color-base-content);
  font-size: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.14s ease;

  &:hover {
    background: var(--color-base-200);
  }

  &.has-count {
    > strong {
      color: color-mix(in oklab, var(--color-warning) 72%, var(--color-base-content));
    }

    .focus-icon {
      background: color-mix(in oklab, var(--color-warning) 14%, transparent);
      color: color-mix(in oklab, var(--color-warning) 76%, var(--color-base-content));
      opacity: 1;
    }
  }

  > strong {
    min-width: 1.5rem;
    font-size: 0.75rem;
    text-align: right;
    font-variant-numeric: tabular-nums;

    &.muted {
      opacity: 0.2;
    }
  }
}

.focus-icon {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.3125rem;
  background: var(--color-base-200);
  opacity: 0.65;

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
}

.content-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0.75rem;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-base-200);

  > div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.75rem;

    &:nth-child(odd) {
      border-right: 0.0625rem solid var(--color-border);
    }

    &:nth-child(-n + 2) {
      border-bottom: 0.0625rem solid var(--color-border);
    }
  }

  strong {
    font-size: 1rem;
    font-variant-numeric: tabular-nums;
  }

  span {
    overflow: hidden;
    font-size: 0.625rem;
    opacity: 0.36;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.top-row {
  width: 100%;
  height: 2.875rem;
  display: grid;
  grid-template-columns: 1.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  border: none;
  border-bottom: 0.0625rem solid var(--color-border);
  background: transparent;
  color: var(--color-base-content);
  text-align: left;
  cursor: pointer;
  transition: background 0.14s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-base-200);
  }

  &.leading .rank {
    color: var(--color-primary);
    font-weight: 700;
    opacity: 0.78;
  }
}

.rank {
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.24;
}

.top-title {
  min-width: 0;
  overflow: hidden;
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-count {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.625rem;
  opacity: 0.35;

  svg {
    width: 0.625rem;
    height: 0.625rem;
  }
}

.icon-button {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-base-content);
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.14s ease;

  &:hover {
    opacity: 0.7;
  }

  svg {
    width: 0.8125rem;
    height: 0.8125rem;
  }
}

.empty-state {
  min-height: 13rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  font-size: 0.75rem;
  opacity: 0.36;

  &.compact {
    min-height: 8rem;
  }
}

.empty-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: var(--color-base-200);

  svg {
    width: 1rem;
    height: 1rem;
  }
}

.metric-skeleton,
.skeleton-line,
.skeleton-avatar,
.skeleton-square {
  display: block;
  background: currentColor;
  opacity: 0.12;
}

.metric-skeleton {
  width: 3rem;
  height: 1.375rem;
  margin-top: 0.65rem;
  border-radius: 0.1875rem;

  &.large {
    width: 8rem;
    height: 2.75rem;
    margin-top: 0.75rem;
  }
}

.comment-skeleton,
.focus-skeleton,
.top-skeleton {
  position: relative;
  border-bottom: 0.0625rem solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.comment-skeleton {
  min-height: 4.25rem;
  padding: 0.8rem 1rem 0.8rem 3.75rem;
}

.focus-skeleton {
  min-height: 3rem;
  padding: 0.85rem 1rem 0.85rem 3.375rem;
}

.top-skeleton {
  min-height: 2.875rem;
  padding: 0.7rem 1rem;
}

.skeleton-avatar,
.skeleton-square {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.skeleton-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
}

.skeleton-square {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.3125rem;
}

.skeleton-line {
  width: 45%;
  height: 0.5rem;
  border-radius: 0.125rem;

  &.wide {
    width: 70%;
  }

  &.short {
    width: 28%;
    margin-top: 0.5rem;
  }
}

.reveal {
  animation: reveal-up 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.reveal-2 {
  animation-delay: 40ms;
}
.reveal-3 {
  animation-delay: 80ms;
}
.reveal-4 {
  animation-delay: 120ms;
}
.reveal-5 {
  animation-delay: 160ms;
}

@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(0.375rem);
  }
}

@keyframes bar-rise {
  from {
    opacity: 0;
    transform: scaleY(0);
  }
}

@keyframes live-pulse {
  60% {
    box-shadow: 0 0 0 0.25rem transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

@media (width <= 78rem) {
  .insight-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .signal-panel {
    grid-template-columns: minmax(13rem, 0.8fr) minmax(24rem, 1.2fr);
  }
}

@media (width <= 68rem) {
  .signal-panel {
    grid-template-columns: minmax(10rem, 0.8fr) minmax(0, 1.2fr);
  }

  .signal-primary {
    padding: 1.25rem;

    > strong {
      font-size: 2.25rem;
    }
  }
}

@media (width <= 58rem) {
  .workspace-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .side-column {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 48rem) {
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

  .signal-panel {
    height: auto;
    min-height: 12.5rem;
    grid-template-columns: minmax(0, 1fr);
  }

  .signal-primary {
    padding: 1.25rem;
    border-right: none;
    border-bottom: 0.0625rem solid color-mix(in oklab, var(--color-neutral-content) 14%, transparent);
  }

  .signal-primary > strong {
    font-size: 2rem;
  }

  .signal-metric {
    padding: 1rem 0.875rem;
  }

  .trend-panel {
    height: 12.5rem;
  }

  .trend-chart {
    height: 8.5rem;
  }

  .trend-track {
    height: 5.75rem;
  }

  .side-column {
    display: flex;
  }

  .comment-row {
    grid-template-columns: 2rem minmax(0, 1fr);

    > time {
      display: none;
    }
  }
}

@media (width <= 25rem) {
  .signal-metric > span {
    font-size: 0.625rem;
  }

  .signal-metric > strong {
    font-size: 1.125rem;
  }

  .trend-chart {
    gap: 0.375rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .trend-track i,
  .live-dot {
    animation: none;
  }
}
</style>
