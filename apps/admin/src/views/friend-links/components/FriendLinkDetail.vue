<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Check, X, Link2, Trash2, Pencil } from '@lucide/vue'
import Button from '~/components/base/Button.vue'
import Popover from '~/components/base/Popover.vue'
import Badge from '~/components/base/Badge.vue'
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

function statusBadge(status: string): { label: string; class: any } {
  switch (status) {
    case 'pending':
      return { label: '待审核', class: 'warning' }
    case 'approved':
      return { label: '已通过', class: 'success' }
    case 'rejected':
      return { label: '已拒绝', class: 'error' }
    default:
      return { label: status, class: 'neutral' }
  }
}

async function handleApprove() {
  if (!props.item) return
  approving.value = true
  try {
    await approveFriendLink(props.item.id)
    emit('update', { ...props.item, status: 'approved', approvedAt: new Date().toISOString() })
    toast.success('已通过')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  } finally {
    approving.value = false
  }
}

async function handleReject() {
  if (!props.item || !rejectReason.value) return
  rejecting.value = true
  try {
    await rejectFriendLink(props.item.id, rejectReason.value)
    emit('update', {
      ...props.item,
      status: 'rejected',
      rejectReason: rejectReason.value,
      rejectedAt: new Date().toISOString()
    })
    rejectReason.value = ''
    toast.success('已拒绝')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  } finally {
    rejecting.value = false
  }
}

async function handleDelete() {
  if (!props.item) return
  try {
    await deleteFriendLinks([props.item.id])
    emit('delete', props.item.id)
    toast.success('已删除')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '删除失败')
  }
}
</script>

<template>
  <div class="detail-panel">
    <template v-if="item">
      <div class="detail-section">
        <div class="section-head-avator">
          <img v-if="item.avatarUrl" :src="item.avatarUrl" class="avatar" />
          <span v-else>{{ item.siteName.slice(0, 1) }}</span>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>

        <dl class="info-grid">
          <dt>名称</dt>
          <dd>{{ item.siteName }}</dd>
          <dt>站点</dt>
          <dd>
            <a :href="item.siteUrl" target="_blank" class="link">{{ item.siteUrl }}</a>
          </dd>
          <dt v-if="item.avatarUrl">头像</dt>
          <dd v-if="item.avatarUrl">
            <a :href="item.avatarUrl" target="_blank" class="link">{{ item.avatarUrl }}</a>
          </dd>
          <dt v-if="item.applicantEmail">邮箱</dt>
          <dd v-if="item.applicantEmail">{{ item.applicantEmail }}</dd>
          <dt>时间</dt>
          <dd>{{ formatDate(item.createdAt) }}</dd>
          <dt>状态</dt>
          <dd>
            <Badge :variant="statusBadge(item.status).class">{{ statusBadge(item.status).label }}</Badge>
          </dd>
        </dl>

        <FriendLinkFormModal v-model:open="showEdit" :edit-item="item" @saved="v => v && emit('update', v)" />
      </div>

      <div v-if="item.description" class="detail-section">
        <h3 class="section-title">简介</h3>
        <p class="desc">{{ item.description }}</p>
      </div>

      <div v-if="item.status === 'approved' && item.approvedAt" class="detail-section">
        <h3 class="section-title">通过时间</h3>
        <p class="time">{{ formatDate(item.approvedAt) }}</p>
      </div>

      <div v-if="item.status === 'rejected' && item.approvedAt" class="detail-section">
        <h3 class="section-title">拒绝时间</h3>
        <p class="time">{{ formatDate(item.approvedAt) }}</p>
      </div>

      <div v-if="item.status === 'rejected' && item.rejectReason" class="detail-section">
        <h3 class="section-title">拒绝原因</h3>
        <p class="reject-reason">{{ item.rejectReason }}</p>
      </div>

      <div class="detail-actions">
        <Button v-if="item.status === 'pending'" variant="ghost" :loading="approving" @click="handleApprove">
          <Check :size="14" /> 通过
        </Button>
        <Popover v-if="item.status === 'pending'">
          <Button variant="ghost" class="reject-btn"><X :size="14" /> 拒绝</Button>
          <template #content="{ close }">
            <div class="reject-form">
              <textarea v-model="rejectReason" class="reject-input" placeholder="拒绝原因……" rows="4" />
              <div class="reject-actions">
                <Button variant="ghost" size="sm" @click="close()">取消</Button>
                <Button
                  size="sm"
                  :disabled="!rejectReason"
                  :loading="rejecting"
                  @click="
                    () => {
                      handleReject()
                      close()
                    }
                  "
                  >确定</Button
                >
              </div>
            </div>
          </template>
        </Popover>
        <Button v-if="item.status === 'approved'" variant="ghost" @click="showEdit = true">
          <Pencil :size="14" /> 编辑
        </Button>
        <Popover>
          <Button variant="ghost" class="delete-btn"><Trash2 :size="14" /> 删除</Button>
          <template #content="{ close }">
            <p class="confirm-text">确定删除此友链？</p>
            <div class="confirm-actions">
              <Button variant="ghost" size="sm" @click="close()">取消</Button>
              <Button
                variant="danger"
                size="sm"
                @click="
                  () => {
                    handleDelete()
                    close()
                  }
                "
                >确定</Button
              >
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
.detail-panel {
  height: 100%;
  overflow-y: auto;
  padding: 1.25rem 2rem;
  display: flex;
  flex-direction: column;
}

.detail-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-base-content);
  opacity: 0.25;
  p {
    font-size: 0.8125rem;
    margin: 0;
  }
}

.detail-section {
  margin-bottom: 1.5rem;
}

.section-head-avator {
  width: 8rem;
  height: 8rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
  color: var(--color-base-content);
  overflow: hidden;
  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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
  opacity: 0.3;
  cursor: pointer;
  border-radius: 0.25rem;
  &:hover {
    opacity: 0.7;
    background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  }
}

.section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.0625rem;
  color: var(--color-base-content);
  opacity: 0.35;
  margin-bottom: 0.5rem;
}

.info-grid {
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: 2rem 1fr;
  gap: 0.375rem 1rem;
  align-items: center;
  dt {
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--color-base-content);
    opacity: 0.4;
  }
  dd {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-base-content);
    word-break: break-all;
    a {
      text-decoration: underline;
    }
  }
}

.link {
  color: var(--color-base-content);
  opacity: 0.6;
}

.desc {
  font-size: 0.8125rem;
  color: var(--color-base-content);
  // opacity: 0.6;
  line-height: 1.5;
  margin: 0;
}

.reject-reason {
  font-size: 0.8125rem;
  color: #dc2626;
  margin: 0;
}

.time {
  font-size: 0.8125rem;
  color: var(--color-base-content);
  // opacity: 0.5;
}

.detail-actions {
  margin-top: auto;
  padding-top: 0.5rem;
  display: flex;
  gap: 0.5rem;

  .reject-btn {
    color: color-mix(in oklab, #ef4444 80%, black);
  }
  .delete-btn {
    color: color-mix(in oklab, #ef4444 80%, black);
  }
}

.reject-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reject-input {
  width: 16rem;
  padding: 0.5rem;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  background: var(--color-base-200);
  color: var(--color-base-content);
  resize: none;
  &:focus {
    outline-color: var(--color-primary);
  }
}

.reject-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
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
</style>
