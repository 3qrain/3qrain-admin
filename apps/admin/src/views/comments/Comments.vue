<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { RotateCw, Search, Trash } from '@lucide/vue'
import ToggleGroup from '~/components/base/ToggleGroup.vue'
import Button from '~/components/base/Button.vue'
import Input from '~/components/base/Input.vue'
import Pagination from '~/components/table/Pagination.vue'
import CommentItem from './components/CommentItem.vue'
import {
  getComments,
  getReplies,
  approveComment,
  pinComment,
  deleteComment,
  restoreComment,
  destroyComment,
  emptyTrashComments
} from '~/api/comments'
import type { CommentQuery } from '~/api/comments'
import type { Comment } from '~/api/comments/types'
import { withMinDuration } from '~/utils/async'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

const tabOptions = [
  { label: '待审核', value: 'pending' },
  { label: '全部', value: '' }
]

const appStore = useAppStore()
const { commentsPaginationMode: paginationMode } = storeToRefs(appStore)

const comments = ref<Comment[]>([])
const total = ref(0)
const loading = ref(true)
const router = useRouter()
const route = useRoute()
const page = ref(1)
const totalPages = ref(1)
const pageSize = 10
const t = ref(Date.now())
const tab = ref('pending')
const keyword = ref('')
const activeKeyword = ref('')
const showDeleted = ref(false)
const expanded = ref<Set<number>>(new Set())
const hasNew = ref(false)
// 待审核和搜索需要直接展示命中的回复，不按主评论分组。
const flatResultView = computed(() => !showDeleted.value && (tab.value === 'pending' || !!activeKeyword.value))

watch(
  () => appStore.pendingCommentCount,
  (newCount, oldCount) => {
    if (newCount > oldCount) hasNew.value = true
  }
)

async function toggleExpand(c: Comment) {
  if (expanded.value.has(c.id)) {
    const next = new Set(expanded.value)
    next.delete(c.id)
    expanded.value = next
    return
  }
  const arr = c.replies
  if (!arr) {
    try {
      const result = await getReplies(c.id)
      c.replies = result.list.map((r: Comment) => {
        // 如果当前评论列表已经有这个子评论A，那么展开区这个子评论用A这个引用
        // 方便同步子评论的恢复、删除状态
        const existing = comments.value.find(x => x.id === r.id)
        return existing ? Object.assign(existing, r) : r
      })
    } catch {
      /* ignore */
    }
  }
  const next = new Set(expanded.value)
  next.add(c.id)
  expanded.value = next
}

async function load(append = false) {
  loading.value = true
  !append && (comments.value = [])
  try {
    const params: CommentQuery = {
      t: t.value,
      pageSize,
      status: showDeleted.value ? undefined : tab.value || undefined,
      keyword: activeKeyword.value || undefined,
      deleted: showDeleted.value ? 'true' : undefined,
      // 普通列表只查主评论；待审核、搜索和回收站查询全部评论。
      parentOnly: showDeleted.value ? false : !flatResultView.value
    }
    if (paginationMode.value === 'scroll') {
      params.offset = append ? comments.value.length : 0
    } else {
      params.page = page.value
    }
    const result = await withMinDuration(() => getComments(params), 0)
    comments.value = append ? [...comments.value, ...result.list] : result.list
    total.value = result.total
    totalPages.value = Math.ceil(result.total / pageSize)
    if (!append) expanded.value = new Set()
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
    if (!append) hasNew.value = false
  }
}

function refresh() {
  t.value = Date.now()
  page.value = 1
  if (paginationMode.value === 'button') {
    router.replace({ query: { ...route.query, page: '1' } })
  }
  load()
}

async function approve(c: Comment) {
  try {
    const wasPending = c.status === 'pending'
    Object.assign(c, await approveComment(c.id))
    if (wasPending) {
      appStore.pendingCommentCount = Math.max(0, appStore.pendingCommentCount - 1)
    }
    toast.success('已通过')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

async function togglePin(c: Comment) {
  try {
    await pinComment(c.id, !c.isPinned)
    c.isPinned = !c.isPinned
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

async function doDelete(c: Comment) {
  try {
    const wasPending = c.status === 'pending' && !c.deletedAt
    await deleteComment([c.id])
    c.deletedAt = new Date().toISOString()
    c.status = 'published'
    if (wasPending) {
      appStore.pendingCommentCount = Math.max(0, appStore.pendingCommentCount - 1)
    }
    toast.success('已移入回收站')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

async function doRestore(c: Comment) {
  try {
    Object.assign(c, await restoreComment(c.id))
    if (c.status === 'pending') appStore.pendingCommentCount++
    toast.success('已恢复')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

async function doDestroy(c: Comment) {
  try {
    await destroyComment([c.id])
    const removed = comments.value.filter(x => x.id === c.id || x.parentId === c.id).length
    comments.value = comments.value.filter(x => x.id !== c.id && x.parentId !== c.id)
    for (const x of comments.value) {
      // 清理 replies 引用 + 更新 replyCount
      if (x.id === c.parentId && x.replyCount) x.replyCount--
      if (x.replies) x.replies = x.replies.filter(r => r.id !== c.id)
    }
    total.value -= removed
    toast.success('已删除')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

async function emptyTrash() {
  if (!confirm('确定清空回收站？所有已删除评论将被永久删除。')) return
  try {
    await emptyTrashComments()
    await load()
    toast.success('回收站已清空')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

function search() {
  activeKeyword.value = keyword.value.trim()
  page.value = 1
  if (paginationMode.value === 'button') {
    router.replace({ query: { ...route.query, page: '1' } })
  }
  load()
}

function goPage(p: number) {
  page.value = p
  if (paginationMode.value === 'button') {
    router.replace({ query: { ...route.query, page: String(p) } })
  }
  load(paginationMode.value === 'scroll')
}

watch([tab, showDeleted], () => {
  page.value = 1
  comments.value = []
  load()
})
watch(paginationMode, val => {
  page.value = 1
  if (val === 'scroll') router.replace({ query: {} })
  load()
})
onMounted(() => {
  if (paginationMode.value === 'button') {
    const urlPage = Number(route.query.page)
    if (urlPage > 0) page.value = urlPage
  }
  load(paginationMode.value === 'scroll')
})
</script>

<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>{{ showDeleted ? '评论-回收站' : '评论管理' }}</h1>
        <span class="sub">共 {{ total }} 条</span>
      </div>
      <div class="head-right">
        <button
          v-if="hasNew"
          class="refresh-btn"
          title="有新评论"
          :disabled="loading"
          @click="refresh"
        >
          <RotateCw class="refresh-btn-icon" :class="{ spinning: loading }" :size="14" :stroke-width="2" />
        </button>
        <Button v-if="showDeleted" variant="danger" size="sm" @click="emptyTrash">清空回收站</Button>
        <button
          :class="['trash-toggle', showDeleted && 'active']"
          :title="showDeleted ? '返回评论' : '回收站'"
          @click="
            () => {
              if (loading) return
              showDeleted = !showDeleted
              page = 1
            }
          "
        >
          <Trash style="width: 1rem; height: 1rem" />
        </button>
        <ToggleGroup
          v-model="paginationMode"
          :options="[
            { label: '滚动', value: 'scroll' },
            { label: '分页', value: 'button' }
          ]"
          size="sm"
        />
      </div>
    </div>

    <div v-if="!showDeleted" class="toolbar">
      <ToggleGroup size="sm" v-model="tab" :options="tabOptions" />
      <Input v-model="keyword" placeholder="搜索..." class="search" @keyup.enter="search">
        <Search style="width: 0.875rem; height: 0.875rem; opacity: 0.4" />
      </Input>
    </div>

    <div v-if="!loading && !comments.length" class="empty">暂无数据</div>

    <div v-else-if="comments.length" class="list list-body">
      <template v-for="c in comments" :key="c.id">
        <CommentItem
          :comment="c"
          :expanded="expanded.has(c.id)"
          :show-replies="!c.parentId"
          @approve="approve"
          @pin="togglePin"
          @remove="doDelete"
          @restore="doRestore"
          @destroy="doDestroy"
          @toggle-replies="toggleExpand"
        />

        <div v-if="expanded.has(c.id) && c.replyCount" class="children-panel">
          <CommentItem
            v-for="r in c.replies || []"
            :key="r.id"
            :comment="r"
            compact
            :show-target="false"
            @approve="approve"
            @remove="doDelete"
            @restore="doRestore"
            @destroy="doDestroy"
          />
        </div>
      </template>
    </div>

    <div class="pagination">
      <Pagination
        :mode="paginationMode"
        :current-page="page"
        :total-pages="totalPages"
        :loading="loading"
        @change="goPage"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.page {
  // padding: 1.75rem 2rem;
  max-width: 48rem;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.head h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}
.head-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sub {
  font-size: 0.8125rem;
  opacity: 0.4;
}
.refresh-btn {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-base-content);
  cursor: pointer;

  &:hover {
    background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  }

  &:disabled {
    pointer-events: none;
  }
}
.refresh-btn-icon {
  animation: pulse-icon 1.5s infinite;

  &.spinning {
    animation: spin 0.5s linear infinite;
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
.trash-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.4;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover {
    opacity: 0.7;
  }
  &.active {
    opacity: 1;
    color: var(--color-error);
  }
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.search {
  width: 12rem;
}
.empty {
  padding: 4rem 0;
  text-align: center;
  font-size: 0.9375rem;
  opacity: 0.35;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.list-body {
  animation: list-enter 0.3s ease-in-out;
}

@keyframes list-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.children-panel {
  margin: -0.125rem 0 0.25rem 1.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: var(--color-base-200);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.pagination {
  margin-top: 1.5rem;
}

@media (max-width: 48rem) {
  // .page {
  //   padding: 1.25rem 1rem;
  // }
}
</style>
