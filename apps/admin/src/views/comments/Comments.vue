<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Check, Pin, PinOff, Trash2, RotateCcw, Search, ChevronDown, ChevronRight, Trash } from '@lucide/vue'
import ToggleGroup from '~/components/base/ToggleGroup.vue'
import Button from '~/components/base/Button.vue'
import Badge from '~/components/base/Badge.vue'
import Input from '~/components/base/Input.vue'
import Popover from '~/components/base/Popover.vue'
import Pagination from '~/components/table/Pagination.vue'
import { CONTENT_TYPE_LABELS } from '~/api/comments/types'
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
import type { Comment } from '~/api/comments/types'
import { formatDate } from '~/utils/date'
import { withMinDuration } from '~/utils/async'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

const tabOptions = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'pending' }
]

const { commentsPaginationMode: paginationMode } = storeToRefs(useAppStore())

const comments = ref<Comment[]>([])
const total = ref(0)
const loading = ref(true)
const router = useRouter()
const route = useRoute()
const page = ref(1)
const totalPages = ref(1)
const pageSize = 10
const t = +new Date()
const tab = ref('')
const keyword = ref('')
const showDeleted = ref(false)
const expanded = ref<Set<number>>(new Set())

async function toggleExpand(c: Comment) {
  if (expanded.value.has(c.id)) {
    const next = new Set(expanded.value)
    next.delete(c.id)
    expanded.value = next
    return
  }
  const arr = (c as any).replies
  if (!arr) {
    try {
      const result = await getReplies(c.id)
      ;(c as any).replies = result.list.map((r: Comment) => {
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

function typeLabel(c: Comment) {
  return CONTENT_TYPE_LABELS[c.targetType] || c.targetType
}

async function load(append = false) {
  loading.value = true
  !append && (comments.value = [])
  try {
    const params: any = {
      t,
      pageSize,
      status: showDeleted.value ? undefined : tab.value || undefined,
      keyword: keyword.value || undefined,
      deleted: showDeleted.value ? 'true' : undefined,
      parentOnly: showDeleted.value ? false : true
    }
    if (paginationMode.value === 'scroll') {
      params.offset = append ? comments.value.length : 0
    } else {
      params.page = page.value
    }
    const result = await withMinDuration(() => getComments(params))
    comments.value = append ? [...comments.value, ...result.list] : result.list
    total.value = result.total
    totalPages.value = Math.ceil(result.total / pageSize)
    expanded.value = new Set()
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function approve(c: Comment) {
  try {
    Object.assign(c, await approveComment(c.id))
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
    await deleteComment([c.id])
    c.deletedAt = new Date().toISOString()
    c.status = 'published'
    toast.success('已移入回收站')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

async function doRestore(c: Comment) {
  try {
    Object.assign(c, await restoreComment(c.id))
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
      const arr = (x as any).replies
      if (arr) (x as any).replies = arr.filter((r: Comment) => r.id !== c.id)
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
      <Input v-model="keyword" placeholder="搜索..." class="search" @keyup.enter="load()">
        <Search style="width: 0.875rem; height: 0.875rem; opacity: 0.4" />
      </Input>
    </div>

    <div v-if="!loading && !comments.length" class="empty">暂无数据</div>

    <div v-else class="list">
      <template v-for="c in comments" :key="c.id">
        <div class="card">
          <div class="card-row">
            <div class="left">
              <span v-if="!c.parentId" class="root-tag">主</span>
              <span v-else class="reply-tag">回</span>
              <img :src="c.user.avatarUrl" alt="" class="avatar" />
              <span class="name"
                >{{ c.user.username }}<span class="uid">#{{ c.userId }}</span></span
              >
              <template v-if="c.replyToUser">
                <span class="reply-arrow">→</span>
                <img :src="c.replyToUser.avatarUrl" alt="" class="avatar sm" />
                <span class="name"
                  >{{ c.replyToUser.username }}<span class="uid">#{{ c.replyToUserId }}</span></span
                >
              </template>
            </div>
            <div class="tags">
              <Badge v-if="c.deletedAt" variant="error">回收站</Badge>
              <template v-else>
                <Badge v-if="c.status === 'pending'" variant="warning">待审核</Badge>
                <Badge v-else variant="success">已发布</Badge>
              </template>
              <span v-if="c.isPinned" class="pin-tag">置顶</span>
            </div>
          </div>
          <p class="content">{{ c.content }}</p>
          <div class="card-foot">
            <span class="meta">{{ typeLabel(c) }} #{{ c.targetId }} · {{ formatDate(c.createdAt) }}</span>
            <div class="actions">
              <Button v-if="c.status === 'pending'" variant="success" size="sm" @click="approve(c)"
                ><Check style="width: 0.75rem; height: 0.75rem" /> 通过</Button
              >
              <Button v-if="!c.deletedAt && !c.parentId" variant="ghost" size="sm" icon @click="togglePin(c)">
                <PinOff v-if="c.isPinned" style="width: 0.875rem; height: 0.875rem" />
                <Pin v-else style="width: 0.875rem; height: 0.875rem" />
              </Button>
              <Popover v-if="!c.deletedAt">
                <Button variant="ghost" size="sm" icon><Trash2 style="width: 0.875rem; height: 0.875rem" /></Button>
                <template #content="{ close }">
                  <p class="confirm-text">移入回收站？</p>
                  <div class="confirm-actions">
                    <Button variant="ghost" size="sm" @click="close()">取消</Button>
                    <Button
                      variant="danger"
                      size="sm"
                      @click="
                        () => {
                          doDelete(c)
                          close()
                        }
                      "
                      >确定</Button
                    >
                  </div>
                </template>
              </Popover>
              <template v-if="c.deletedAt">
                <Button variant="ghost" size="sm" icon @click="doRestore(c)"
                  ><RotateCcw style="width: 0.875rem; height: 0.875rem"
                /></Button>
                <Popover>
                  <Button variant="ghost" size="sm" icon><Trash2 style="width: 0.875rem; height: 0.875rem" /></Button>
                  <template #content="{ close }">
                    <p class="confirm-text">永久删除？子评论也会一并删除。</p>
                    <div class="confirm-actions">
                      <Button variant="ghost" size="sm" @click="close()">取消</Button>
                      <Button
                        variant="danger"
                        size="sm"
                        @click="
                          () => {
                            doDestroy(c)
                            close()
                          }
                        "
                        >删除</Button
                      >
                    </div>
                  </template>
                </Popover>
              </template>
            </div>
          </div>
          <button v-if="c.replyCount" class="toggle-kids" @click="toggleExpand(c)">
            <ChevronRight v-if="!expanded.has(c.id)" style="width: 0.875rem; height: 0.875rem" />
            <ChevronDown v-else style="width: 0.875rem; height: 0.875rem" />
            查看 {{ c.replyCount }} 条回复
          </button>
        </div>

        <!-- 展开 -->
        <div v-if="expanded.has(c.id) && c.replyCount" class="children-panel">
          <div v-for="r in c.replies || []" :key="r.id" class="child-row">
            <div class="card-row">
              <div class="left">
                <span class="reply-tag">回</span>
                <img :src="r.user.avatarUrl" alt="" class="avatar sm" />
                <span class="name"
                  >{{ r.user.username }}<span class="uid">#{{ r.userId }}</span></span
                >
                <template v-if="r.replyToId && r.replyToUser">
                  <span class="reply-arrow">→</span>
                  <img :src="r.replyToUser.avatarUrl" alt="" class="avatar sm" />
                  <span class="name"
                    >{{ r.replyToUser.username }}<span class="uid">#{{ r.replyToUserId }}</span></span
                  >
                </template>
              </div>
              <div class="tags">
                <Badge v-if="r.deletedAt" variant="error">回收站</Badge>
                <template v-else>
                  <Badge v-if="r.status === 'pending'" variant="warning">待审核</Badge>
                  <Badge v-else variant="success">已发布</Badge>
                </template>
              </div>
            </div>
            <p class="content kid">{{ r.content }}</p>
            <div class="card-foot">
              <span class="meta">{{ formatDate(r.createdAt) }}</span>
              <div class="actions">
                <Button v-if="r.status === 'pending'" variant="success" size="sm" @click="approve(r)">通过</Button>
                <Popover v-if="!r.deletedAt">
                  <Button variant="ghost" size="sm" icon><Trash2 style="width: 0.75rem; height: 0.75rem" /></Button>
                  <template #content="{ close }">
                    <p class="confirm-text">移入回收站？</p>
                    <div class="confirm-actions">
                      <Button variant="ghost" size="sm" @click="close()">取消</Button>
                      <Button
                        variant="danger"
                        size="sm"
                        @click="
                          () => {
                            doDelete(r)
                            close()
                          }
                        "
                        >确定</Button
                      >
                    </div>
                  </template>
                </Popover>
                <template v-if="r.deletedAt">
                  <Button variant="ghost" size="sm" icon @click="doRestore(r)"
                    ><RotateCcw style="width: 0.75rem; height: 0.75rem"
                  /></Button>
                  <Popover>
                    <Button variant="ghost" size="sm" icon><Trash2 style="width: 0.75rem; height: 0.75rem" /></Button>
                    <template #content="{ close }">
                      <p class="confirm-text">永久删除？</p>
                      <div class="confirm-actions">
                        <Button variant="ghost" size="sm" @click="close()">取消</Button>
                        <Button
                          variant="danger"
                          size="sm"
                          @click="
                            () => {
                              doDestroy(r)
                              close()
                            }
                          "
                          >删除</Button
                        >
                      </div>
                    </template>
                  </Popover>
                </template>
              </div>
            </div>
          </div>
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

.card {
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
}
.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.root-tag {
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 15%, transparent);
  padding: 0 0.25rem;
  border-radius: 0.1875rem;
}
.reply-tag {
  font-size: 0.5625rem;
  font-weight: 600;
  opacity: 0.35;
  background: var(--color-base-300);
  padding: 0 0.25rem;
  border-radius: 0.1875rem;
}
.avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.avatar.sm {
  width: 1.25rem;
  height: 1.25rem;
}
.name {
  font-size: 0.8125rem;
  font-weight: 600;
}
.uid {
  font-size: 0.625rem;
  opacity: 0.35;
  font-weight: 400;
  margin-left: 0.125rem;
}
.reply-arrow {
  font-size: 0.625rem;
  opacity: 0.3;
  margin: 0 0.125rem;
}
.tags {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.pin-tag {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--color-warning);
}
.content {
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0.5rem 0;
}
.content.kid {
  font-size: 0.8125rem;
}
.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.meta {
  font-size: 0.75rem;
  opacity: 0.3;
}
.actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toggle-kids {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  border: none;
  border-top: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-base-content);
  font-size: 0.75rem;
  opacity: 0.4;
  cursor: pointer;
  padding: 0.5rem 0 0;
  margin-top: 0.5rem;
  &:hover {
    opacity: 0.7;
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
.child-row {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  background: var(--color-base-100);
}
.pagination {
  margin-top: 1.5rem;
}

.confirm-text {
  font-size: 0.8125rem;
  margin-bottom: 0.625rem;
  max-width: 14rem;
  white-space: nowrap;
}
.confirm-actions {
  display: flex;
  gap: 0.375rem;
  justify-content: flex-end;
}

@media (max-width: 48rem) {
  // .page {
  //   padding: 1.25rem 1rem;
  // }
}
</style>
