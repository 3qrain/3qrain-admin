<script setup lang="ts">
import { computed } from 'vue'
import { Settings, Send, Archive, Loader, Check, Pencil } from '@lucide/vue'
import Button from '~/components/base/Button.vue'
import Badge from '~/components/base/Badge.vue'

const props = defineProps<{
  settingsOpen: boolean
  saving?: boolean
  isDirty?: boolean
  isNew?: boolean
  isDraft?: boolean
  isPublished?: boolean
  isArchived?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleSettings'): void
  (e: 'publish'): void
  (e: 'archive'): void
}>()

const saveStatus = computed(() => {
  if (props.saving) return 'saving'
  if (props.isNew || props.isDirty) return 'unsaved'
  return 'saved'
})

const badgeVariant = computed(() => {
  if (saveStatus.value === 'saving') return 'neutral'
  if (saveStatus.value === 'unsaved') return 'warning'
  return 'success'
})

const badgeText = computed(() => {
  if (saveStatus.value === 'saving') return '保存中'
  if (saveStatus.value === 'unsaved') return '未保存'
  return '已保存'
})

const statusBadge = computed(() => {
  if (props.isArchived) return 'neutral' as const
  if (props.isPublished) return 'success' as const
  return 'warning' as const
})

const statusText = computed(() => {
  if (props.isArchived) return '已归档'
  if (props.isPublished) return '已发布'
  return '草稿'
})
</script>

<template>
  <div class="bar">
    <div class="left">
      <Badge :variant="badgeVariant">
        <Loader v-if="saveStatus === 'saving'" style="width: 0.8125rem; height: 0.8125rem" class="spin" />
        <Pencil v-else-if="saveStatus === 'unsaved'" style="width: 0.8125rem; height: 0.8125rem" />
        <Check v-else style="width: 0.8125rem; height: 0.8125rem" />
        {{ badgeText }}
      </Badge>
    </div>

    <div class="right">
      <Badge :variant="statusBadge">{{ statusText }}</Badge>

      <Button v-if="!isArchived" variant="neutral" size="sm" :loading="saving" @click="emit('archive')">
        <Archive style="width: 0.875rem; height: 0.875rem" /> 归档
      </Button>

      <Button v-if="!isPublished" variant="success" size="sm" :loading="saving" @click="emit('publish')">
        <Send style="width: 0.875rem; height: 0.875rem" /> 发布
      </Button>

      <Button variant="ghost" size="sm" icon :active="settingsOpen" @click="emit('toggleSettings')">
        <Settings style="width: 1.25rem; height: 1.25rem" />
      </Button>
    </div>
  </div>
</template>

<style scoped lang="less">
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  height: 3rem;
  flex-shrink: 0;
  border-bottom: 0.0625rem solid var(--color-border);
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (width <= 48rem) {
  .bar {
    padding: 0;
  }
}
</style>
