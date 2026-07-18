<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const store = useAppStore()
const commentApi = useCommentApi()
const oauth = useOAuth()

const props = defineProps<{
  targetType: string
  targetId: number
  replyTo?: { id: number; userId: number; username: string; replyToId?: number } | null
}>()

const emit = defineEmits<{ cancel: []; done: [] }>()

const content = ref('')
const submitting = ref(false)
const maxLen = 500
const remaining = computed(() => maxLen - content.value.length)

async function submit() {
  if (!content.value.trim() || remaining.value < 0) return
  submitting.value = true
  try {
    const res = await commentApi.create({
      targetType: props.targetType,
      targetId: props.targetId,
      content: content.value,
      parentId: props.replyTo?.id,
      replyToId: props.replyTo?.replyToId,
      replyToUserId: props.replyTo?.userId,
    })
    if (res.success) {
      content.value = ''
      toast.success(res.message)
      emit('done')
    } else {
      toast.error(res.message)
    }
  } catch (e: any) { toast.error(e?.message || '服务异常') }
  finally { submitting.value = false }
}
</script>

<template>
  <div class="composer" :class="{ reply: !!replyTo }">
    <div v-if="replyTo" class="to">
      回复 <strong>@{{ replyTo.username }}</strong>
      <button class="cancel" @click="emit('cancel')">×</button>
    </div>

    <!-- 未登录遮罩 -->
    <div v-if="!store.user" class="mask">
      <div class="mask-inner">
        <span class="mask-hint">登录后参与评论</span>
        <div class="mask-btns">
          <button class="mask-btn" :disabled="!!oauth.loadingProvider.value" @click="oauth.login('github')">
            <svg v-if="oauth.loadingProvider.value === 'github'" class="spin" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M22 12a10 10 0 0 0-10-10" stroke-linecap="round"/></svg>
            <svg v-else viewBox="0 0 16 16" width="22" height="22" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          </button>
          <button class="mask-btn" :disabled="!!oauth.loadingProvider.value" @click="oauth.login('google')">
            <svg v-if="oauth.loadingProvider.value === 'google'" class="spin" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M22 12a10 10 0 0 0-10-10" stroke-linecap="round"/></svg>
            <svg v-else viewBox="0 0 24 24" width="22" height="22"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 正文区域 -->
    <div class="wrap">
      <img v-if="store.user" :src="store.user.avatarUrl" alt="" class="avatar" />
      <textarea
        v-model="content"
        class="input"
        rows="3"
        :placeholder="replyTo ? `回复 @${replyTo.username}...` : '客从远方来，聊赠一枝春'"
        :maxlength="maxLen"
      />
    </div>
    <div class="foot">
      <span :class="['cnt', { over: remaining < 0 }]">{{ content.length }}/{{ maxLen }}</span>
      <button
        class="btn"
        :disabled="!store.user || !content.trim() || remaining < 0 || submitting"
        @click="submit"
      >{{ submitting ? '...' : '发布' }}</button>
    </div>
  </div>
</template>

<style scoped lang="less">
.composer {
  position: relative;
  margin-top: .625rem;
  padding: .75rem;
  border: 1px solid var(--color-border);
  border-radius: .625rem;

  &.reply { margin-left: 0; }
}

.mask {
  position: absolute; inset: 0;
  background: color-mix(in oklab, var(--color-base-100) 85%, transparent);
  backdrop-filter: blur(2px);
  border-radius: .625rem;
  display: flex; align-items: center; justify-content: center;
  z-index: 1;
}

.mask-inner {
  display: flex; flex-direction: column; align-items: center; gap: .75rem;
}

.mask-hint {
  font-size: .8125rem; opacity: .4;
}

.mask-btns { display: flex; gap: .75rem; }

.mask-btn {
  display: flex; align-items: center; justify-content: center;
  width: 2.5rem; height: 2.5rem;
  border-radius: 50%; border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-base-content); opacity: .6;
  cursor: pointer; transition: all .15s;
  &:hover { opacity: 1; background: var(--color-base-200); }
  &:disabled { opacity: .3; cursor: default; &:hover { background: transparent; } }
}

.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.to {
  display: flex; align-items: center; justify-content: space-between;
  font-size: .8125rem; opacity: .5; margin-bottom: .5rem;
}

.cancel {
  border: none; background: transparent;
  font-size: 1rem; color: var(--color-base-content);
  opacity: .35; cursor: pointer;
  &:hover { opacity: .7; }
}

.wrap { display: flex; gap: .625rem; }
.avatar { width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0; }

.input {
  flex: 1;
  padding: .4375rem .5rem; border-radius: .375rem; border: none;
  background: transparent; font-size: .875rem; line-height: 1.6;
  color: var(--color-base-content); outline: none;
  font-family: inherit; resize: none;
  &::placeholder { opacity: .3; }
}

.foot {
  display: flex; align-items: center; justify-content: flex-end;
  gap: .75rem; margin-top: .375rem;
}

.cnt { font-size: .75rem; opacity: .3; font-variant-numeric: tabular-nums; &.over { color: var(--color-error); opacity: 1; } }

.btn {
  padding: .25rem .875rem; border-radius: .375rem; border: none;
  background: var(--color-primary); color: var(--color-primary-content);
  font-size: .8125rem; font-weight: 500; cursor: pointer;
  &:hover:not(:disabled) { opacity: .9; }
  &:disabled { opacity: .3; cursor: default; }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
