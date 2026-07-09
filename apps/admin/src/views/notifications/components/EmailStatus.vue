<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, ShieldCheck } from '@lucide/vue'
import type { NotificationItem } from '~/api/notifications/types'
import type { Comment } from '~/api/comments/types'
import { formatDate } from '~/utils/date'
import { renderNewCommentEmail, renderReplyEmail, renderFriendApplyEmail } from '@3qrain/shared'
import { useAppStore } from '~/stores/app'

const props = defineProps<{
  item: NotificationItem
  comment: Comment | null
  postTitle: string
  postSlug: string
  beRepliedContent: string
}>()

const showPreview = ref(false)
const previewHtml = ref('')

watch(
  () => props.item.id,
  () => {
    showPreview.value = false
    previewHtml.value = ''
  }
)

function buildPreviewHtml() {
  if (props.item.emailStatus !== 'sent') {
    previewHtml.value = ''
    return
  }

  const store = useAppStore()
  const common = {
    siteName: store.adminUser?.username || '3qrain',
    siteUrl: store.webUrl,
    adminUrl: store.adminUrl,
  }

  switch (props.item.type) {
    case 'new_comment':
      if (!props.comment) return
      previewHtml.value = renderNewCommentEmail({
        ...common,
        postTitle: props.postTitle,
        commenterName: props.comment.user.username,
        commentContent: props.comment.content,
      })
      break

    case 'new_reply':
      if (!props.comment) return
      previewHtml.value = renderReplyEmail({
        ...common,
        userName: props.comment.replyToUser?.username || '',
        replierName: props.comment.user.username,
        postTitle: props.postTitle,
        postSlug: props.postSlug,
        replyContent: props.comment.content,
        yourComment: props.beRepliedContent,
      })
      break

    case 'friend_apply':
      if (!props.item.meta) return
      const meta = JSON.parse(props.item.meta)
      previewHtml.value = renderFriendApplyEmail({
        ...common,
        applicantName: meta.siteName,
        applicantUrl: meta.siteUrl,
      })
      break

    default:
      previewHtml.value = ''
  }
}

function togglePreview() {
  showPreview.value = !showPreview.value

  if (showPreview.value) {
    buildPreviewHtml()
  }
}
</script>

<template>
  <div class="detail-section">
    <h3 class="section-title">邮件发送</h3>

    <div v-if="item.emailStatus === 'not_required'" class="email-status not_required">
      <ShieldCheck :size="16" />
      <span>无需发送邮件（管理员）</span>
    </div>

    <div v-if="item.emailStatus === 'pending'" class="email-status pending">
      <span class="email-spinner" />
      <span>邮件发送中...</span>
    </div>

    <div v-else-if="item.emailStatus === 'sent'" class="email-status ok">
      <CheckCircle :size="16" />
      <span>已发送</span>
      <span v-if="item.emailSentAt" class="email-time">{{ formatDate(item.emailSentAt) }}</span>
      <button v-if="item.emailStatus === 'sent'" class="preview-toggle" @click="togglePreview">
        {{ showPreview ? '收起' : '展开' }}邮件
        <ChevronUp v-if="showPreview" :size="12" />
        <ChevronDown v-else :size="12" />
      </button>
    </div>

    <div v-else-if="item.emailStatus === 'failed'" class="email-status fail">
      <XCircle :size="16" />
      <span>发送失败</span>
      <span v-if="item.emailError" class="email-error">{{ item.emailError }}</span>
    </div>

    <div v-if="previewHtml && item.emailStatus === 'sent' && showPreview" class="email-preview">
      <iframe :srcdoc="previewHtml" class="email-frame" sandbox="allow-popups allow-popups-to-escape-sandbox" />
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.0625rem;
  color: var(--color-base-content);
  opacity: 0.35;
  margin: 0 0 0.75rem;
}

.email-status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;

  &.not_required {
    background: color-mix(in oklab, var(--color-base-content) 4%, transparent);
    color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
  }

  &.pending {
    background: color-mix(in oklab, #f59e0b 12%, transparent);
    color: #d97706;
  }

  &.ok {
    background: color-mix(in oklab, #22c55e 12%, transparent);
    color: #16a34a;
  }

  &.fail {
    background: color-mix(in oklab, #ef4444 12%, transparent);
    color: #dc2626;
  }
}

.email-time {
  opacity: 0.6;
  font-size: 0.75rem;
  margin-left: auto;
}

.email-error {
  font-size: 0.6875rem;
  opacity: 0.8;
  word-break: break-all;
}

.email-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-toggle {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.7;
  font-size: 0.75rem;
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
}

.email-preview {
  margin-top: 0.5rem;
  border: 0.0625rem solid var(--color-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.email-frame {
  width: 100%;
  height: 20rem;
  border: none;
  background: #fff;
}
</style>
