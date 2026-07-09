<script setup lang="ts">
import { ref, watch } from 'vue'
import { Mail, Panda } from '@lucide/vue'
import Skeleton from '~/components/base/Skeleton.vue'
import EmailStatus from './EmailStatus.vue'
import type { NotificationItem } from '~/api/notifications/types'
import { getComments } from '~/api/comments'
import type { Comment } from '~/api/comments/types'
import { getPost } from '~/api/posts'
import { formatDate } from '~/utils/date'
import router from '~/router/index.ts'
const props = defineProps<{
  item: NotificationItem | null
}>()

const comment = ref<Comment | null>(null)
const postTitle = ref('')
const postSlug = ref('')
const beRepliedContent = ref('')
const commentLoading = ref(false)

watch(
  () => props.item,
  async item => {
    comment.value = null
    postTitle.value = ''
    beRepliedContent.value = ''
    if (!item) return

    const isComment = item.type === 'new_comment' || item.type === 'new_reply'
    if (!isComment) return

    try {
      commentLoading.value = true
      const meta = item.meta ? JSON.parse(item.meta) : null
      const commentId = meta?.commentId
      if (!commentId) return

      const tasks = {
        comment: getComments({ id: commentId }),
        post: Promise.resolve(null) as Promise<any>,
        replied: Promise.resolve(null) as Promise<any>
      }

      if (meta?.targetType === 'post' && meta?.targetId) {
        tasks.post = getPost(meta.targetId, { fields: 'title,slug' }).catch(() => null)
      }

      if (item.type === 'new_reply') {
        const repliedId = meta?.replyToId || meta?.parentId
        if (repliedId) {
          tasks.replied = getComments({ id: repliedId }).catch(() => null)
        }
      }

      const [res, post, replied] = await Promise.all([tasks.comment, tasks.post, tasks.replied])
      comment.value = res.list[0] || undefined
      postTitle.value = (post as any)?.title || ''
      postSlug.value = (post as any)?.slug || ''
      beRepliedContent.value = replied?.list?.[0]?.content || ''
    } catch {
      /* ignore */
    } finally {
      commentLoading.value = false
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="detail-panel">
    <template v-if="item">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">通知简介</h3>
        <dl class="info-grid">
          <dt>标题</dt>
          <dd>{{ item.title }}</dd>
          <dt>类型</dt>
          <dd>{{ item.type }}</dd>
          <dt>时间</dt>
          <dd>{{ formatDate(item.createdAt) }}</dd>
        </dl>
      </div>

      <!-- Meta -->
      <div v-if="item.meta" class="detail-section">
        <h3 class="section-title">元数据</h3>
        <pre class="content-meta">{{ item.meta }}</pre>
      </div>

      <!-- 通知内容 -->
      <div class="detail-section">
        <h3 class="section-title">通知内容</h3>
        <template v-if="item.type === 'new_comment' || item.type === 'new_reply'">
          <div v-if="comment" class="comment-card">
            <div class="comment-author">
              <img v-if="comment.user.avatarUrl" :src="comment.user.avatarUrl" class="comment-avatar" />
              <span class="comment-username">{{ comment.user.username }}</span>
              <template v-if="comment.replyToUser">
                <span style="opacity: 0.5; font-size: 0.875rem">@</span>
                <img :src="comment.replyToUser?.avatarUrl" class="comment-avatar" />
                <span class="comment-username">{{ comment.replyToUser?.username }}</span>
              </template>
            </div>
            <div v-if="beRepliedContent" class="comment-beRepliedContent">> {{ beRepliedContent }}</div>
            <div class="comment-content">{{ comment.content }}</div>
            <div class="comment-meta">
              <span>{{ (comment.targetType === 'post' ? '文章' : '说说') + '#' + comment.targetId }}</span>
              <span>{{ formatDate(comment.createdAt) }}</span>
              <!-- <span v-if="comment.replyToUser">回复 {{ comment.replyToUser.username }}</span> -->
            </div>
          </div>
          <Skeleton v-else class="comment-card comment-card-skeleton">
            {{ comment === undefined ? '评论不存在或已被删除' : '' }}
          </Skeleton>
        </template>

        <div
          v-else-if="item.type === 'friend_apply' || item.type === 'friend_approve' || item.type === 'friend_reject'"
          class="comment-card friend-apply-card"
          @click="router.push('friend-links')"
        >
          <Panda
            class="friend-icon"
            :class="{ friend_approve: item.type === 'friend_approve', friend_reject: item.type === 'friend_reject' }"
            style="width: 2rem; height: 2rem"
          />
        </div>
      </div>

      <EmailStatus
        v-show="!commentLoading"
        :item="item"
        :comment="comment"
        :post-title="postTitle"
        :post-slug="postSlug"
        :be-replied-content="beRepliedContent"
      />
    </template>

    <div v-else class="detail-empty">
      <Mail :size="32" :stroke-width="1" />
      <p>选择左侧通知查看详情</p>
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-panel {
  height: 100%;
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

.section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.0625rem;
  color: var(--color-base-content);
  opacity: 0.35;
  margin: 0 0 0.75rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: 0.25rem 1rem;
  dt {
    font-size: 0.75rem;
    color: var(--color-base-content);
    opacity: 0.4;
  }
  dd {
    font-size: 0.8125rem;
    color: var(--color-base-content);
    margin: 0;
  }
}

.content-meta {
  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--color-base-content);
  opacity: 0.4;
  background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
  padding: 0.5rem;
  border-radius: 0.25rem;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.comment-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.75rem;
  min-height: 6.25rem;
  background: color-mix(in oklab, var(--color-base-content) 4%, transparent);
  border-radius: 0.5rem;
  animation: fadeIn 0.3s;
}
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.comment-target-title {
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
  font-weight: bold;
}

.comment-author {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1rem;
}

.comment-avatar {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
}

.comment-username {
  font-size: 0.8125rem;
  font-weight: 600;
}

.comment-beRepliedContent {
  position: relative;
  // margin-bottom: .25rem;
  font-size: 0.75rem;
  opacity: 0.4;
}

.comment-content {
  font-size: 0.8125rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 0.5rem;
}

.comment-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.6875rem;
  color: var(--color-base-content);
  opacity: 0.4;
}

.comment-card-skeleton {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
}

.friend-apply-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;

  .friend-icon {
    opacity: 0.75;
    transition: opacity 0.3s;
  }

  &:hover {
    .friend-icon {
      opacity: 1;
      animation: shake 0.5s ease-in-out;
    }
  }

  .friend_approve {
    color: var(--color-success);
  }
  .friend_reject {
    color: var(--color-error);
  }
}

@keyframes shake {
  0% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(-12deg);
  }
  40% {
    transform: rotate(10deg);
  }
  60% {
    transform: rotate(-8deg);
  }
  80% {
    transform: rotate(6deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
</style>
