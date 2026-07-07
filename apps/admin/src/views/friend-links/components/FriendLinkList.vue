<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Link2, Trash2, Plus } from '@lucide/vue'
import Pagination from '~/components/table/Pagination.vue'
import FriendLinkFormModal from './FriendLinkFormModal.vue'
import { getFriendLinks, getFriendLinkCounts, deleteFriendLinks } from '~/api/friend-links'
import type { FriendLink } from '~/api/friend-links/types'
import { formatDate } from '~/utils/date'
import Popover from '~/components/base/Popover.vue'
import Button from '~/components/base/Button.vue'

const emit = defineEmits<{
  select: [item: FriendLink | null]
}>()

const list = ref<FriendLink[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const pageSize = 20
const activeStatus = ref('pending')
const selectedId = ref<number | null>(null)
const counts = ref({ pending: 0, approved: 0, rejected: 0 })
const showCreate = ref(false)
const statusFilters = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' }
]

async function loadCounts() {
  try {
    counts.value = await getFriendLinkCounts()
  } catch {
    /* ignore */
  }
}

function handleSaved() {
  page.value = 1
  totalPages.value = 1
  list.value = []
  load(true)
  loadCounts()
}

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return { label: '待审核', class: 'pending' }
    case 'approved':
      return { label: '已通过', class: 'approved' }
    case 'rejected':
      return { label: '已拒绝', class: 'rejected' }
    default:
      return { label: status, class: '' }
  }
}

async function load(append = false) {
  loading.value = true
  try {
    const res = await getFriendLinks({
      pageSize,
      status: activeStatus.value || undefined,
      offset: String(append ? list.value.length : 0)
    })
    list.value = append ? [...list.value, ...res.list] : res.list
    total.value = res.total
    totalPages.value = Math.ceil(res.total / pageSize)
  } finally {
    loading.value = false
  }
}

function goPage(p: number) {
  page.value = p
  load(true)
}

async function handleDelete(item: FriendLink) {
  await deleteFriendLinks([item.id])
  list.value = list.value.filter(n => n.id !== item.id)
  total.value--
  totalPages.value = Math.ceil(total.value / pageSize)
  if (selectedId.value === item.id) {
    selectedId.value = null
    emit('select', null)
  }
}

function handleSelect(item: FriendLink) {
  selectedId.value = item.id
  emit('select', item)
}

watch(activeStatus, () => {
  page.value = 1
  totalPages.value = 1
  list.value = []
  load(true)
})

onMounted(() => {
  load(true)
  loadCounts()
})
</script>

<template>
  <div class="list-panel">
    <div class="panel-header">
      <div class="filter-tabs">
        <button
          v-for="s in statusFilters"
          :key="s.value"
          class="tab-btn"
          :class="{ active: activeStatus === s.value }"
          @click="activeStatus = s.value"
        >
          {{ s.label }} {{ counts[s.value as keyof typeof counts] ?? 0 }}
        </button>
      </div>
      <button class="add-btn" title="添加友链" @click="showCreate = true">
        <Plus :size="16" :stroke-width="2" />
      </button>
    </div>

    <FriendLinkFormModal v-model:open="showCreate" :edit-item="null" @saved="handleSaved" />

    <div v-if="loading && list.length === 0" class="list-loading">加载中...</div>

    <div v-else-if="!loading && list.length === 0" class="list-empty">
      <Link2 :size="28" :stroke-width="1" />
      <p>暂无友链申请</p>
    </div>

    <div v-else class="list-body">
      <div
        v-for="item in list"
        :key="item.id"
        class="list-item"
        :class="{ selected: selectedId === item.id }"
        @click="handleSelect(item)"
      >
        <span class="item-dot" :class="item.status" />
        <div class="item-icon">
          <img v-if="item.avatarUrl" :src="item.avatarUrl" class="item-avatar" />
          <span v-else>{{ item.siteName.slice(0, 1) }}</span>
        </div>
        <div class="item-main">
          <div class="item-title">{{ item.siteName }}</div>
          <div class="item-description">
            {{ item.description ? item.description : '~' }}
          </div>
          <span class="item-time">{{ formatDate(item.createdAt) }}</span>
        </div>

        <Popover>
          <button class="item-trash" title="删除">
            <Trash2 :size="13" :stroke-width="1.5" />
          </button>
          <template #content="{ close }">
            <p class="confirm-text">确定删除该友链吗？</p>
            <div class="confirm-actions">
              <Button variant="ghost" size="sm" @click="close()">取消</Button>
              <Button
                size="sm"
                variant="danger"
                @click="
                  () => {
                    handleDelete(item)
                    close()
                  }
                "
                >确定</Button
              >
            </div>
          </template>
        </Popover>
      </div>
      <Pagination :current-page="page" :total-pages="totalPages" :loading="loading" :mode="'scroll'" @change="goPage" />
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
  padding: 0.75rem 1rem;
  height: 3.375rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.add-btn {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.4;
  cursor: pointer;
  border-radius: 0.375rem;
  &:hover {
    opacity: 0.8;
    background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
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

.list-body {
  flex: 1;
  overflow-y: auto;
}

.list-body {
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
  height: 4.875rem;
  cursor: pointer;
  transition:
    background 0.12s,
    padding 0.2s cubic-bezier(0.34, 1.56, 0.64, 1.5);

  &:hover {
    background: color-mix(in oklab, var(--color-base-content) 3%, transparent);
  }

  &.selected {
    background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
    padding-left: 1rem;
  }

  // &::after {
  //   content: '';
  //   left: 0;
  //   position: absolute;
  //   height: 100%;
  //   width: 100%;
  //   // background: linear-gradient(135deg, transparent, rgba(255, 0, 0, 0.05), transparent);
  // }
}

.item-dot {
  margin-right: 0.25rem;
  width: 0.1875rem;
  height: 75%;
  opacity: 0;
  transform: scaleY(0.4);
  background: var(--color-base-content);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.pending {
    background: linear-gradient(135deg, var(--color-warning), var(--color-base-100));
  }
  &.approved {
    background: linear-gradient(135deg, var(--color-base-content), var(--color-base-100));
  }
  &.rejected {
    background: linear-gradient(135deg, var(--color-error), var(--color-base-100));
  }

  .list-item.selected & {
    opacity: 1;
    transform: scaleY(1);
  }
}

.item-icon {
  width: 2.625rem;
  height: 2.625rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
  color: var(--color-base-content);
  overflow: hidden;
}

.item-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.item-title {
  font-size: 0.8125rem;
  line-height: 1.3;
  color: var(--color-base-content);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-description {
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--color-base-content);
  opacity: 0.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 0.6875rem;
  color: var(--color-base-content);
  opacity: 0.3;
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

.confirm-text {
  font-size: 0.75rem;
  margin: 0 0 0.625rem;
  white-space: nowrap;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

@media (max-width: 48rem) {
  .panel-header {
    padding-top: 0;
  }
}
</style>
