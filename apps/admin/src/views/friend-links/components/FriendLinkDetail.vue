<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Check, X, Link2, Trash2, Pencil } from '@lucide/vue'
import Button from '~/components/base/Button.vue'
import Popover from '~/components/base/Popover.vue'
import FriendLinkFormModal from './FriendLinkFormModal.vue'
import { approveFriendLink, rejectFriendLink, deleteFriendLinks } from '~/api/friend-links'
import type { FriendLink } from '~/api/friend-links/types'
import { formatDate } from '~/utils/date'

const props = defineProps<{
  item: FriendLink | null
}>()

const emit = defineEmits<{
  update: [item: FriendLink]
  delete: [id: number]
}>()

const rejectReason = ref('')
const rejecting = ref(false)
const approving = ref(false)
const showEdit = ref(false)

async function handleApprove() {
  if (!props.item) return
  approving.value = true
  try {
    await approveFriendLink(props.item.id)
    emit('update', { ...props.item, status: 'approved', approvedAt: new Date().toISOString() })
    toast.success('已通过')
  } catch (e: any) { toast.error(e?.response?.data?.message || '操作失败') }
  finally { approving.value = false }
}

async function handleReject() {
  if (!props.item || !rejectReason.value) return
  rejecting.value = true
  try {
    await rejectFriendLink(props.item.id, rejectReason.value)
    emit('update', { ...props.item, status: 'rejected', rejectReason: rejectReason.value, rejectedAt: new Date().toISOString() })
    rejectReason.value = ''
    toast.success('已拒绝')
  } catch (e: any) { toast.error(e?.response?.data?.message || '操作失败') }
  finally { rejecting.value = false }
}

async function handleDelete() {
  if (!props.item) return
  await deleteFriendLinks([props.item.id])
  emit('delete', props.item.id)
  toast.success('已删除')
}
</script>

<template>
  <div class="detail-panel">
    <template v-if="item">
      <div class="detail-section">
        <div class="section-head">
          <h3 class="section-title">基本信息</h3>
          <button class="edit-btn" title="编辑" @click="showEdit = true">
            <Pencil :size="13" :stroke-width="1.5" />
          </button>
        </div>

        <dl class="info-grid">
          <dt>名称</dt>
          <dd>{{ item.siteName }}</dd>
          <dt>URL</dt>
          <dd><a :href="item.siteUrl" target="_blank" class="link">{{ item.siteUrl }}</a></dd>
          <dt v-if="item.avatarUrl">头像</dt>
          <dd v-if="item.avatarUrl"><a :href="item.avatarUrl" target="_blank" class="link">{{ item.avatarUrl }}</a></dd>
          <dt v-if="item.applicantEmail">邮箱</dt>
          <dd v-if="item.applicantEmail">{{ item.applicantEmail }}</dd>
          <dt>状态</dt>
          <dd><span class="badge" :class="item.status">{{ item.status }}</span></dd>
          <dt>时间</dt>
          <dd>{{ formatDate(item.createdAt) }}</dd>
        </dl>

        <FriendLinkFormModal v-model:open="showEdit" :edit-item="item" @saved="(v) => v && emit('update', v)" />
      </div>

      <div v-if="item.description" class="detail-section">
        <h3 class="section-title">简介</h3>
        <p class="desc">{{ item.description }}</p>
      </div>

      <div v-if="item.status === 'rejected' && item.rejectReason" class="detail-section">
        <h3 class="section-title">拒绝原因</h3>
        <p class="reject-reason">{{ item.rejectReason }}</p>
      </div>

      <div v-if="item.status === 'approved' && item.approvedAt" class="detail-section">
        <h3 class="section-title">通过时间</h3>
        <p class="time">{{ formatDate(item.approvedAt) }}</p>
      </div>

      <div v-if="item.status === 'pending'" class="detail-actions">
        <Button variant="ghost" :loading="approving" @click="handleApprove">
          <Check :size="14" /> 通过
        </Button>
        <Popover>
          <Button variant="ghost" class="reject-btn"><X :size="14" /> 拒绝</Button>
          <template #content="{ close }">
            <div class="reject-form">
              <textarea v-model="rejectReason" class="reject-input" placeholder="拒绝原因..." rows="3" />
              <div class="reject-actions">
                <Button variant="ghost" size="sm" @click="close()">取消</Button>
                <Button size="sm" :disabled="!rejectReason" :loading="rejecting" @click="handleReject(); close()">确定</Button>
              </div>
            </div>
          </template>
        </Popover>
        <Popover>
          <Button variant="ghost" class="delete-btn"><Trash2 :size="14" /> 删除</Button>
          <template #content="{ close }">
            <p class="confirm-text">确定删除此申请？</p>
            <div class="confirm-actions">
              <Button variant="ghost" size="sm" @click="close()">取消</Button>
              <Button size="sm" @click="handleDelete(); close()">确定</Button>
            </div>
          </template>
        </Popover>
      </div>
    </template>

    <div v-else class="detail-empty">
      <Link2 :size="32" :stroke-width="1" />
      <p>选择左侧友链查看详情</p>
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-panel { height: 100%; overflow-y: auto; padding: 1.25rem 2rem; }

.detail-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  color: var(--color-base-content);
  opacity: .25;
  p { font-size: .8125rem; margin: 0; }
}

.detail-section { margin-bottom: 1.5rem; }

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .75rem;
}

.edit-btn {
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-base-content);
  opacity: .3;
  cursor: pointer;
  border-radius: .25rem;
  &:hover { opacity: .7; background: color-mix(in oklab, var(--color-base-content) 6%, transparent); }
}

.section-title {
  font-size: .6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .0625rem;
  color: var(--color-base-content);
  opacity: .35;
  margin: 0 0 .75rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: .25rem 1rem;
  dt { font-size: .75rem; color: var(--color-base-content); opacity: .4; }
  dd { font-size: .8125rem; color: var(--color-base-content); margin: 0; }
}

.link { color: var(--color-base-content); opacity: .6; }

.badge {
  font-size: .6875rem;
  padding: .0625rem .375rem;
  border-radius: .25rem;
  &.pending { background: color-mix(in oklab, #f59e0b 12%, transparent); color: #d97706; }
  &.approved { background: color-mix(in oklab, #22c55e 12%, transparent); color: #16a34a; }
  &.rejected { background: color-mix(in oklab, #ef4444 12%, transparent); color: #dc2626; }
}

.desc { font-size: .8125rem; color: var(--color-base-content); opacity: .6; line-height: 1.6; margin: 0; }

.reject-reason { font-size: .8125rem; color: #dc2626; margin: 0; }

.time { font-size: .8125rem; color: var(--color-base-content); opacity: .5; margin: 0; }

.detail-actions {
  display: flex;
  gap: .5rem;
  padding-top: .5rem;

  .reject-btn { color: color-mix(in oklab, #ef4444 80%, black); }
  .delete-btn { color: color-mix(in oklab, #ef4444 80%, black); }
}

.reject-form { display: flex; flex-direction: column; gap: .5rem; }
.reject-input {
  width: 16rem;
  padding: .5rem;
  border: .0625rem solid var(--color-border);
  border-radius: .375rem;
  font-size: .75rem;
  background: var(--color-base-100);
  color: var(--color-base-content);
  resize: none;
}
.reject-actions { display: flex; justify-content: flex-end; gap: .25rem; }

.confirm-text { font-size: .75rem; margin: 0 0 .625rem; white-space: nowrap; }
.confirm-actions { display: flex; justify-content: flex-end; gap: .25rem; }
</style>
