<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { SaveCheck } from '@lucide/vue'
import Button from '~/components/base/Button.vue'
import Skeleton from '~/components/base/Skeleton.vue'
import ToggleSwitch from '~/components/base/ToggleSwitch.vue'
import { getConfig, updateConfig } from '~/api/config'
import type { CommentsConfig, FriendLinksConfig } from '~/api/config/types'

const loading = ref(true)
const saving = ref(false)
const comments = ref<CommentsConfig>({
  enabled: true,
  reviewEnabled: false,
})
const friendLinks = ref<FriendLinksConfig>({
  applicationEnabled: true,
})
const savedComments = ref<CommentsConfig>({ ...comments.value })
const savedFriendLinks = ref<FriendLinksConfig>({ ...friendLinks.value })
const hasChanges = computed(
  () =>
    JSON.stringify(comments.value) !== JSON.stringify(savedComments.value) ||
    JSON.stringify(friendLinks.value) !== JSON.stringify(savedFriendLinks.value)
)

async function load() {
  loading.value = true
  try {
    const config = await getConfig(['comments', 'friendLinks'])
    comments.value = { ...comments.value, ...config.comments }
    friendLinks.value = { ...friendLinks.value, ...config.friendLinks }
    savedComments.value = { ...comments.value }
    savedFriendLinks.value = { ...friendLinks.value }
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!hasChanges.value) return

  const commentsPayload = { ...comments.value }
  const friendLinksPayload = { ...friendLinks.value }
  saving.value = true
  try {
    await Promise.all([
      updateConfig('comments', commentsPayload),
      updateConfig('friendLinks', friendLinksPayload),
    ])
    savedComments.value = commentsPayload
    savedFriendLinks.value = friendLinksPayload
    toast.success('已保存')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="section" :aria-busy="loading">
    <div class="section-heading">
      <h2 class="section-title">站点功能</h2>
      <Button
        variant="neutral"
        size="sm"
        :loading="saving"
        :disabled="loading || !hasChanges"
        @click="save"
      >
        <SaveCheck :size="14" />
        保存
      </Button>
    </div>
    <p class="section-desc">控制前台访客可以使用的互动功能。</p>

    <div v-if="loading" class="settings-skeleton-reveal" aria-hidden="true">
      <Skeleton class="features-skeleton">
        <div v-for="(rowCount, groupIndex) in [2, 1]" :key="groupIndex" class="skeleton-group">
          <div class="skeleton-group-head">
            <span class="skeleton-block skeleton-line group-title" />
            <span class="skeleton-block skeleton-line group-desc" />
          </div>

          <div v-for="rowIndex in rowCount" :key="rowIndex" class="skeleton-setting-row">
            <div class="skeleton-copy">
              <span class="skeleton-block skeleton-line setting-title" />
              <span class="skeleton-block skeleton-line setting-desc" />
            </div>
            <span class="skeleton-block skeleton-toggle" />
          </div>
        </div>
      </Skeleton>
    </div>

    <template v-else>
      <section class="feature-group">
        <div class="group-head">
          <h3>评论</h3>
          <p>控制文章和说说的评论提交与审核。</p>
        </div>

        <div class="setting-row">
          <div>
            <strong>允许发表评论</strong>
            <p>关闭后保留已有评论，只停止接收新评论。</p>
          </div>
          <ToggleSwitch v-model="comments.enabled" aria-label="允许发表评论" />
        </div>

        <div class="setting-row" :class="{ muted: !comments.enabled }">
          <div>
            <strong>评论审核</strong>
            <p>访客评论需要通过审核后才会公开显示。</p>
          </div>
          <ToggleSwitch
            v-model="comments.reviewEnabled"
            aria-label="开启评论审核"
            :disabled="!comments.enabled"
          />
        </div>
      </section>

      <section class="feature-group">
        <div class="group-head">
          <h3>友链</h3>
          <p>控制访客是否可以提交新的友链申请。</p>
        </div>

        <div class="setting-row">
          <div>
            <strong>允许友链申请</strong>
            <p>关闭后不影响已经公开展示的友链。</p>
          </div>
          <ToggleSwitch v-model="friendLinks.applicationEnabled" aria-label="允许友链申请" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped lang="less">
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 2rem;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.section-desc {
  margin: 0 0 1.5rem;
  font-size: 0.8125rem;
  opacity: 0.4;
}

.settings-skeleton-reveal {
  opacity: 0;
  animation: settings-skeleton-reveal 0.2s ease-out 0.08s forwards;
}

@keyframes settings-skeleton-reveal {
  to { opacity: 1; }
}

.features-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.skeleton-block {
  display: block;
  border-radius: 0.25rem;
  background: var(--color-base-200);
}

.skeleton-group,
.skeleton-copy {
  display: flex;
  flex-direction: column;
}

.skeleton-group {
  gap: 0.5rem;
}

.skeleton-group-head {
  margin-bottom: 0.5rem;
}

.skeleton-line {
  height: 0.75rem;

  &.group-title {
    width: 3rem;
  }

  &.group-desc {
    width: min(15rem, 70%);
    height: 0.625rem;
    margin-top: 0.375rem;
  }

  &.setting-title {
    width: 6.5rem;
  }

  &.setting-desc {
    width: min(20rem, 82%);
    height: 0.625rem;
    margin-top: 0.4rem;
  }
}

.skeleton-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  min-height: 4rem;
}

.skeleton-copy {
  flex: 1;
  min-width: 0;
}

.skeleton-toggle {
  width: 2.625rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 999px;
}

.feature-group {
  margin-bottom: 1.75rem;
}

.group-head {
  margin-bottom: 0.5rem;

  h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 700;
  }

  p {
    margin: 0.125rem 0 0;
    font-size: 0.75rem;
    opacity: 0.35;
  }
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  min-height: 4rem;

  &.muted > div {
    opacity: 0.45;
  }

  > div {
    min-width: 0;
    transition: opacity 0.2s;
  }

  strong {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  p {
    margin: 0.2rem 0 0;
    font-size: 0.75rem;
    line-height: 1.5;
    opacity: 0.4;
  }
}
</style>
