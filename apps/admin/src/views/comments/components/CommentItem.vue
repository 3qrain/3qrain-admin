<script setup lang="ts">
import { Check, Pin, PinOff, RotateCcw, Trash2, ChevronDown, ChevronRight } from '@lucide/vue'
import Badge from '~/components/base/Badge.vue'
import Button from '~/components/base/Button.vue'
import Popover from '~/components/base/Popover.vue'
import { CONTENT_TYPE_LABELS } from '~/api/comments/types'
import type { Comment } from '~/api/comments/types'
import { formatDate } from '~/utils/date'

const props = withDefaults(defineProps<{
  comment: Comment
  compact?: boolean
  expanded?: boolean
  showReplies?: boolean
  showTarget?: boolean
}>(), {
  compact: false,
  expanded: false,
  showReplies: false,
  showTarget: true,
})

const emit = defineEmits<{
  approve: [comment: Comment]
  pin: [comment: Comment]
  remove: [comment: Comment]
  restore: [comment: Comment]
  destroy: [comment: Comment]
  toggleReplies: [comment: Comment]
}>()

function targetLabel() {
  return CONTENT_TYPE_LABELS[props.comment.targetType] || props.comment.targetType
}
</script>

<template>
  <div :class="['comment-item', { compact }]">
    <div class="comment-head">
      <div class="author">
        <span v-if="!comment.parentId" class="root-tag">主</span>
        <span v-else class="reply-tag">回</span>
        <img :src="comment.user.avatarUrl" alt="" :class="['avatar', { sm: compact }]" />
        <span class="name">{{ comment.user.username }}<span class="uid">#{{ comment.userId }}</span></span>
        <template v-if="comment.replyToUser">
          <span class="reply-arrow">→</span>
          <img :src="comment.replyToUser.avatarUrl" alt="" class="avatar sm" />
          <span class="name">
            {{ comment.replyToUser.username }}<span class="uid">#{{ comment.replyToUserId }}</span>
          </span>
        </template>
      </div>

      <div class="tags">
        <Badge v-if="comment.deletedAt" variant="error">回收站</Badge>
        <template v-else>
          <Badge v-if="comment.status === 'pending'" variant="warning">待审核</Badge>
          <Badge v-else variant="success">已发布</Badge>
        </template>
        <span v-if="comment.isPinned" class="pin-tag">置顶</span>
      </div>
    </div>

    <p class="content">{{ comment.content }}</p>

    <div class="comment-foot">
      <span class="meta">
        <template v-if="showTarget">{{ targetLabel() }} #{{ comment.targetId }} · </template>
        {{ formatDate(comment.createdAt) }}
      </span>

      <div class="actions">
        <Button
          v-if="comment.status === 'pending'"
          variant="neutral"
          size="sm"
          @click="emit('approve', comment)"
        >
          <Check v-if="!compact" class="action-icon" />
          通过
        </Button>

        <Button
          v-if="!comment.deletedAt && !comment.parentId"
          variant="ghost"
          size="sm"
          icon
          @click="emit('pin', comment)"
        >
          <PinOff v-if="comment.isPinned" class="action-icon" />
          <Pin v-else class="action-icon" />
        </Button>

        <Popover v-if="!comment.deletedAt">
          <Button variant="ghost" size="sm" icon>
            <Trash2 class="action-icon" />
          </Button>
          <template #content="{ close }">
            <p class="confirm-text">移入回收站？</p>
            <div class="confirm-actions">
              <Button variant="ghost" size="sm" @click="close()">取消</Button>
              <Button
                variant="danger"
                size="sm"
                @click="emit('remove', comment); close()"
              >
                确定
              </Button>
            </div>
          </template>
        </Popover>

        <template v-else>
          <Button variant="ghost" size="sm" icon @click="emit('restore', comment)">
            <RotateCcw class="action-icon" />
          </Button>
          <Popover>
            <Button variant="ghost" size="sm" icon>
              <Trash2 class="action-icon" />
            </Button>
            <template #content="{ close }">
              <p class="confirm-text">
                {{ comment.parentId ? '永久删除？' : '永久删除？子评论也会一并删除。' }}
              </p>
              <div class="confirm-actions">
                <Button variant="ghost" size="sm" @click="close()">取消</Button>
                <Button
                  variant="danger"
                  size="sm"
                  @click="emit('destroy', comment); close()"
                >
                  删除
                </Button>
              </div>
            </template>
          </Popover>
        </template>
      </div>
    </div>

    <button
      v-if="showReplies && comment.replyCount"
      class="toggle-replies"
      @click="emit('toggleReplies', comment)"
    >
      <ChevronDown v-if="expanded" class="reply-icon" />
      <ChevronRight v-else class="reply-icon" />
      查看 {{ comment.replyCount }} 条回复
    </button>
  </div>
</template>

<style scoped lang="less">
.comment-item {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;

  &.compact {
    padding: 0.5rem 0.75rem;
    border: 0;
    border-radius: 0.375rem;
    background: var(--color-base-100);

    .content {
      font-size: 0.8125rem;
    }
  }
}

.comment-head,
.comment-foot,
.author,
.tags,
.actions,
.toggle-replies {
  display: flex;
  align-items: center;
}

.comment-head,
.comment-foot {
  justify-content: space-between;
}

.author {
  min-width: 0;
  gap: 0.5rem;
}

.root-tag,
.reply-tag {
  padding: 0 0.25rem;
  border-radius: 0.1875rem;
  font-size: 0.5625rem;
  font-weight: 700;
}

.root-tag {
  color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 15%, transparent);
}

.reply-tag {
  color: var(--color-base-content);
  background: var(--color-base-300);
  opacity: 0.35;
}

.avatar {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;

  &.sm {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.name {
  font-size: 0.8125rem;
  font-weight: 600;
}

.uid {
  margin-left: 0.125rem;
  font-size: 0.625rem;
  font-weight: 400;
  opacity: 0.35;
}

.reply-arrow {
  margin: 0 0.125rem;
  font-size: 0.625rem;
  opacity: 0.3;
}

.tags {
  flex-shrink: 0;
  gap: 0.375rem;
}

.pin-tag {
  color: var(--color-warning);
  font-size: 0.625rem;
  font-weight: 600;
}

.content {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.meta {
  font-size: 0.75rem;
  opacity: 0.3;
}

.actions {
  gap: 0.25rem;
}

.action-icon,
.reply-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.toggle-replies {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem 0 0;
  gap: 0.25rem;
  border: 0;
  border-top: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-base-content);
  font-size: 0.75rem;
  opacity: 0.4;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.7;
  }
}

.confirm-text {
  max-width: 14rem;
  margin-bottom: 0.625rem;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.375rem;
}
</style>
