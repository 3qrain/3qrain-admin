<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  Bell,
  MessageCircle,
  MessageCircleReply,
  Panda,
  Settings,
  Trash2,
  RotateCw,
  UserRoundCheck,
  UserRoundX,
  Clock3,
  LoaderCircle,
  MailCheck,
  MailX,
  CircleOff
} from '@lucide/vue'
import Pagination from '~/components/table/Pagination.vue'
import Spinner from '~/components/base/Spinner.vue'
import SearchSelect from '~/components/base/SearchSelect.vue'
import { getNotifications, markRead, deleteNotifications } from '~/api/notifications'
import type { NotificationItem } from '~/api/notifications/types'
import type { EmailStatus, NotificationType } from '@3qrain/shared'
import { formatDate } from '~/utils/date'
import { useAppStore } from '~/stores/app'

const emit = defineEmits<{
  select: [item: NotificationItem | null]
}>()

const store = useAppStore()

const listBodyId = 'app-notifications-list-body'
const list = ref<NotificationItem[]>([])
const loading = ref(false)
const total = ref(0)
const counts = ref({ all: 0, unread: 0, read: 0 })
const page = ref(1)
const totalPages = ref(1)
const pageSize = 20
const t = ref<number>(Date.now())
const activeCategory = ref('')
const activeFilter = ref<'all' | 'unread'>('unread')
const selectedId = ref<number | null>(null)
const hasNew = ref(false)

watch(
  () => store.unreadCount,
  (newCount, oldCount) => {
    if (newCount > oldCount) hasNew.value = true
  }
)

const categoryTypeMap: Record<string, string[]> = {
  comment: ['new_comment', 'new_reply'],
  friend_apply: ['friend_apply'],
  system: ['system']
}

const categories = [
  { value: '', label: '全部类型' },
  { value: 'comment', label: '评论' },
  { value: 'friend_apply', label: '友链申请' },
  // { value: 'system', label: '系统' }
]

const filters = [
  { value: 'unread', label: '未读' },
  { value: 'all', label: '全部' }
]

const emailStatusMeta: Partial<Record<EmailStatus, { icon: typeof MailCheck; label: string }>> = {
  pending: { icon: LoaderCircle, label: '邮件发送中' },
  pending_review: { icon: Clock3, label: '等待评论审核' },
  sent: { icon: MailCheck, label: '邮件已发送' },
  failed: { icon: MailX, label: '邮件发送失败' },
  not_required: { icon: CircleOff, label: '无需发送邮件' }
}

function typeIcon(type: NotificationType) {
  if (type === 'new_comment') return MessageCircle
  if (type === 'new_reply') return MessageCircleReply
  if (type === 'friend_apply') return Panda
  if (type === 'friend_approve') return UserRoundCheck
  if (type === 'friend_reject') return UserRoundX
  return Settings
}

async function load(append = false) {
  loading.value = true
  try {
    const res = await getNotifications({
      t: t.value,
      pageSize,
      types: activeCategory.value ? categoryTypeMap[activeCategory.value]?.join(',') : undefined,
      isRead: activeFilter.value === 'unread' ? '0' : undefined,
      offset: String(append ? list.value.length : 0)
    })
    list.value = append ? [...list.value, ...res.list] : res.list
    total.value = res.total
    counts.value = res.counts
    totalPages.value = Math.ceil(res.total / pageSize)
  } finally {
    loading.value = false
    if (!append) hasNew.value = false
  }
}

function goPage(p: number) {
  page.value = p
  load(true)
}

async function handleMarkRead(item: NotificationItem) {
  if (item.isRead) return
  await markRead(item.id)
  item.isRead = 1
  if (store.unreadCount > 0) store.unreadCount--
  if (counts.value.unread > 0) counts.value.unread--
  counts.value.read++
}

async function handleDelete(item: NotificationItem) {
  await deleteNotifications([item.id])
  if (!item.isRead && store.unreadCount > 0) store.unreadCount--
  if (counts.value.all > 0) counts.value.all--
  if (item.isRead) {
    if (counts.value.read > 0) counts.value.read--
  } else if (counts.value.unread > 0) {
    counts.value.unread--
  }

  const index = list.value.findIndex(n => n.id === item.id)
  if (index === -1) return
  list.value.splice(index, 1)

  total.value--
  totalPages.value = Math.ceil(total.value / pageSize)

  if (selectedId.value === item.id) {
    const nextItem = list.value[index] || list.value[index - 1] || null

    handleSelect(nextItem)
  }
}

function handleSelect(item: NotificationItem) {
  if (!item) return
  selectedId.value = item.id
  emit('select', item)
  if (!item.isRead) handleMarkRead(item)
}

watch([activeCategory, activeFilter], () => {
  t.value = Date.now()
  page.value = 1
  totalPages.value = 1
  list.value = []
  load(false)
})

onMounted(() => load(false))
</script>

<template>
  <div class="list-panel">
    <div class="panel-header">
      <div class="filter-tabs">
        <button
          v-for="f in filters"
          :key="f.value"
          class="tab-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value as typeof activeFilter"
        >
          {{ f.label }} {{ f.value === 'unread' ? counts.unread : counts.all }}
        </button>
      </div>

      <div class="header-right">
        <button
          v-if="hasNew"
          class="refresh-btn"
          title="有新通知"
          :disabled="loading"
          @click="
            () => {
              t = Date.now()
              load()
            }
          "
        >
          <RotateCw class="refresh-btn-icon" :class="{ spinning: loading }" :size="14" :stroke-width="2" />
        </button>
        <SearchSelect
          v-model="activeCategory"
          :options="categories"
          variant="ghost"
          placement="bottom-end"
          :searchable="false"
          width="8rem"
        />
      </div>
    </div>

    <div v-if="loading && list.length === 0" class="list-loading">
      <Spinner />
    </div>

    <div v-else-if="!loading && list.length === 0" class="list-empty">
      <Bell :size="28" :stroke-width="1" />
      <p>暂无通知</p>
    </div>

    <div v-else :id="listBodyId" class="list-body">
      <div
        v-for="item in list"
        :key="item.id"
        class="list-item"
        :class="{ unread: !item.isRead, selected: selectedId === item.id }"
        @click="handleSelect(item)"
      >
        <span class="item-dot" />
        <div class="item-icon">
          <component :is="typeIcon(item.type)" style="width: 1rem; height: 1rem" />
        </div>
        <div class="item-main">
          <div class="item-title">{{ item.title }}</div>
          <div v-if="item.content" class="item-preview">{{ item.content }}</div>
          <div class="item-meta">
            <span class="item-time">{{ formatDate(item.createdAt) }}</span>
            <span
              v-if="emailStatusMeta[item.emailStatus]"
              class="item-email-status"
              :class="item.emailStatus"
              :title="emailStatusMeta[item.emailStatus]?.label"
              :aria-label="emailStatusMeta[item.emailStatus]?.label"
            >
              <component :is="emailStatusMeta[item.emailStatus]?.icon" />
            </span>
          </div>
        </div>
        <button class="item-trash" title="删除" @click.stop="handleDelete(item)">
          <Trash2 :size="13" :stroke-width="1.5" />
        </button>
      </div>
      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        :loading="loading"
        :mode="'scroll'"
        @change="goPage"
        :rootId="listBodyId"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 0.0625rem solid var(--color-border);
}

.panel-header {
  height: 3.375rem;
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-bottom: 0.0625rem solid var(--color-border);
}

.filter-tabs {
  display: flex;
  gap: 0.125rem;
}

.tab-btn {
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  color: var(--color-base-content);
  opacity: 0.5;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    opacity: 0.8;
    background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  }
  &.active {
    opacity: 1;
    background: color-mix(in oklab, var(--color-base-content) 10%, transparent);
    font-weight: 600;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  .refresh-btn {
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--color-base-content);
    cursor: pointer;
    border-radius: 0.375rem;
    &:disabled {
      cursor: default;
      pointer-events: none;
    }
    &:hover {
      background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
      opacity: 1;
    }
    &-icon {
      &.spinning {
        animation: spin 0.5s linear infinite;
      }
      &:not(.spinning) {
        animation: pulse-icon 1.5s infinite;
      }
    }
    @keyframes pulse-icon {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  }

}

.list-loading,
.list-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-base-content);
  opacity: 0.3;
  font-size: 0.8125rem;
  p {
    margin: 0;
  }
}

.list-loading {
  opacity: 1;
}

.list-body {
  flex: 1;
  overflow-y: auto;
  animation: list-enter 0.3s ease-in-out;
}

@keyframes list-enter {
  from {
    opacity: 0;
    // transform: translateY(-0.25rem);
  }

  to {
    opacity: 1;
    // transform: translateY(0);
  }
}

.list-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem 0.75rem 0.75rem;
  cursor: pointer;
  transition:
    background 0.12s,
    padding 0.2s cubic-bezier(0.34, 1.56, 0.64, 1.5);
  // border-bottom: 0.0625rem solid var(--color-border);

  &:hover {
    background: color-mix(in oklab, var(--color-base-content) 3%, transparent);
  }

  &.selected {
    background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
    padding-left: 1rem;

    .item-dot {
      transform: scaleY(1);
      opacity: 1;
    }
    .item-dot::after {
      opacity: 0;
    }
  }

  &.unread {
    .item-dot {
      opacity: 1;
      transform: scaleY(1);
    }
    .item-dot::after {
      opacity: 1;
    }
    .item-title {
      font-weight: 600;
    }
  }
}

.item-dot {
  position: relative;
  width: 0.1875rem;
  height: 2rem;
  background: var(--color-base-content);
  // border-radius: 2rem 2rem 0 0;
  opacity: 0;
  transform: scaleY(0.4);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}
.item-dot::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-base-100), #3b82f6, var(--color-base-100));
  // background: linear-gradient(135deg, #3b82f6, var(--color-base-100));
  // background: linear-gradient(135deg, var(--color-base-content), var(--color-base-100));
  opacity: 0;
  transition: opacity 0.6s;
}

.item-icon {
  flex-shrink: 0;
  width: 1.625rem;
  height: 1.625rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-base-content);
  opacity: 0.5;
  transition: opacity 0.15s;

  .list-item.unread & {
    opacity: 1;
  }
  .list-item.selected & {
    opacity: 0.9;
  }
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 0.8125rem;
  line-height: 1.3;
  color: var(--color-base-content);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 0.15s;

  .list-item:not(.unread) & {
    opacity: 0.6;
  }
  .list-item.selected & {
    opacity: 1;
  }
}

.item-preview {
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--color-base-content);
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 0.125rem;
}

.item-meta {
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.item-time {
  width: 6.25rem;
  flex-shrink: 0;
  font-size: 0.6875rem;
  color: var(--color-base-content);
  opacity: 0.3;
}

.item-email-status {
  width: 0.875rem;
  height: 0.875rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-base-content);
  transition: opacity 0.15s;

  svg {
    width: 0.8125rem;
    height: 0.8125rem;
    stroke-width: 1.75;
  }

  &.sent,
  &.not_required {
    opacity: 0.3;
  }

  &.pending,
  &.pending_review {
    color: var(--color-warning);
    opacity: 0.85;
  }

  &.failed {
    color: var(--color-error);
    opacity: 0.9;
  }

  &.pending svg {
    animation: email-status-spin 0.8s linear infinite;
  }
}

@keyframes email-status-spin {
  to {
    transform: rotate(360deg);
  }
}

.item-trash {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.15s;
  &:hover {
    background: color-mix(in oklab, #ef4444 15%, transparent);
    color: #ef4444;
  }
  .list-item:hover & {
    opacity: 0.2;
  }
  .list-item:hover &:hover {
    opacity: 1;
  }
}

@media (max-width: 48rem) {
  .panel-header {
    padding-top: 0;
  }
}
</style>
