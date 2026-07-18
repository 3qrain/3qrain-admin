<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
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

async function load() {
  loading.value = true
  try {
    const config = await getConfig(['comments', 'friendLinks'])
    comments.value = { ...comments.value, ...config.comments }
    friendLinks.value = { ...friendLinks.value, ...config.friendLinks }
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await Promise.all([
      updateConfig('comments', comments.value),
      updateConfig('friendLinks', friendLinks.value),
    ])
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
  <div class="section">
    <h2 class="section-title">站点功能</h2>
    <p class="section-desc">控制前台访客可以使用的互动功能。</p>

    <div v-if="loading" class="skeletons">
      <Skeleton v-for="i in 3" :key="i" class="skeleton-row" />
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

      <Button :loading="saving" @click="save">保存</Button>
    </template>
  </div>
</template>

<style scoped lang="less">
.section {
  max-width: 32rem;
}

.section-title {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 700;
}

.section-desc {
  margin: 0 0 1.5rem;
  font-size: 0.8125rem;
  opacity: 0.4;
}

.skeletons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-row {
  height: 4rem;
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
