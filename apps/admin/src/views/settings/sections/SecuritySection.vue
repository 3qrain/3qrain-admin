<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { LogOut, X, Globe } from '@lucide/vue'
import Input from '~/components/base/Input.vue'
import Button from '~/components/base/Button.vue'
import Skeleton from '~/components/base/Skeleton.vue'
import Popover from '~/components/base/Popover.vue'
import { useAppStore } from '~/stores/app'
import { changePassword, getSessions, kickSession, kickAllSessions, logout } from '~/api/account'
import type { AdminSession } from '~/api/account/types'
import { withMinDuration } from '~/utils/async'

const router = useRouter()
const saving = ref(false)
const form = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const sessions = ref<AdminSession[]>([])
const loadingSessions = ref(true)

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const d = Math.floor(hr / 24)
  return `${d} 天前`
}

async function loadSessions() {
  loadingSessions.value = true
  try { sessions.value = await getSessions() }
  catch { toast.error('加载会话失败') }
  finally { loadingSessions.value = false }
}

async function handleKick(token: string) {
  try {
    await kickSession(token)
    sessions.value = sessions.value.filter(s => s.token !== token)
    toast.success('已踢出')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

async function handleKickAll() {
  try {
    await kickAllSessions()
    sessions.value = sessions.value.filter(s => s.isCurrent)
    toast.success('已踢出全部其他设备')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  } 
}

async function handleLogout() {
  try {
    await logout()
    useAppStore().adminUser = null
    router.push('/login')
  } catch {
    toast.error('注销失败，请重试')
  }
}

async function handleChangePassword() {
  const { oldPassword, newPassword, confirmPassword } = form.value
  if (!oldPassword || !newPassword) { toast.error('请填写完整'); return }
  if (newPassword !== confirmPassword) { toast.error('两次密码不一致'); return }

  saving.value = true
  try {
    await withMinDuration(() => changePassword({ oldPassword, newPassword }))
    toast.success('密码已修改，即将重新登录')
    useAppStore().adminUser = null
    setTimeout(() => router.push('/login'), 1500)
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '修改失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadSessions)
</script>

<template>
  <div class="section">
    <!-- 修改密码 -->
    <h2 class="section-title">修改密码</h2>
    <p class="section-desc">修改密码后所有设备会被强制下线。</p>

    <div class="form">
      <label class="field">
        <span>当前密码</span>
        <Input v-model="form.oldPassword" type="password" placeholder="输入当前密码" />
      </label>
      <label class="field">
        <span>新密码</span>
        <Input v-model="form.newPassword" type="password" placeholder="输入新密码" />
      </label>
      <label class="field">
        <span>确认新密码</span>
        <Input v-model="form.confirmPassword" type="password" placeholder="再次输入新密码" />
      </label>
      <div class="actions">
        <Button variant="danger" :loading="saving" @click="handleChangePassword">修改密码</Button>
      </div>
    </div>

    <!-- 登录设备 -->
    <div class="divider" />
    <div class="sessions-section-head">
      <h2 class="section-title">登录设备</h2>
      <div class="sessions-section-meta">
        <p class="section-desc">管理你的登录会话，保护账户安全。</p>
        <Popover v-if="sessions.length > 1">
          <Button variant="ghost" size="sm">踢掉全部其他设备</Button>
          <template #content="{ close }">
            <p class="confirm-text">确定踢掉全部其他设备？</p>
            <div class="confirm-actions">
              <Button variant="ghost" size="sm" @click="close()">取消</Button>
              <Button variant="danger" size="sm" @click="handleKickAll(); close()">确定</Button>
            </div>
          </template>
        </Popover>
      </div>
    </div>

    <div v-if="loadingSessions" class="sessions-skeleton-reveal" aria-hidden="true">
      <Skeleton class="sessions-skeleton">
        <span v-for="index in 2" :key="index" class="skeleton-session" />
      </Skeleton>
    </div>
    <div v-else-if="sessions.length > 0" class="sessions">
      <div v-for="s in sessions" :key="s.token" :class="['session', s.isCurrent && 'current']">
        <div class="session-info">
          <span class="session-label">{{ s.isCurrent ? '当前设备' : '其他设备' }}</span>
          <span class="session-ua">{{ s.userAgent }}</span>
          <span class="session-ip">
            <Globe style="width: 0.625rem; height: 0.625rem;" />
            {{ s.loginIp }}
          </span>
          <div class="session-times">
            <span>活跃: {{ relativeTime(s.lastActiveAt) }}</span>
            <span>登录: {{ relativeTime(s.createdAt) }}</span>
          </div>
        </div>
        <Popover v-if="s.isCurrent">
          <button class="session-action logout">
            <LogOut style="width: 0.75rem; height: 0.75rem;" /> 注销
          </button>
          <template #content="{ close }">
            <p class="confirm-text">确定注销当前设备？</p>
            <div class="confirm-actions">
              <Button variant="ghost" size="sm" @click="close()">取消</Button>
              <Button size="sm" @click="handleLogout()">确定</Button>
            </div>
          </template>
        </Popover>
        <Popover v-else>
          <button class="session-action kick">
            <X style="width: 0.75rem; height: 0.75rem;" /> 踢出
          </button>
          <template #content="{ close }">
            <p class="confirm-text">确定踢出此设备？</p>
            <div class="confirm-actions">
              <Button variant="ghost" size="sm" @click="close()">取消</Button>
              <Button variant="danger" size="sm" @click="handleKick(s.token); close()">确定</Button>
            </div>
          </template>
        </Popover>
      </div>
    </div>

  </div>
</template>

<style scoped lang="less">
.section {
  max-width: 32rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.section-desc {
  font-size: 0.8125rem;
  opacity: 0.4;
  margin: 0 0 1rem;
}

.divider {
  height: 0.0625rem;
  background: var(--color-border);
  margin: 1.5rem 0;
}

/* ---- Sessions ---- */
.sessions-section-head {
  .section-desc {
    margin: 0;
  }
}

.sessions-section-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 1.75rem;
  margin-bottom: 1rem;
}

.sessions-skeleton-reveal {
  opacity: 0;
  animation: sessions-skeleton-reveal 0.2s ease-out 0.08s forwards;
}

@keyframes sessions-skeleton-reveal {
  to { opacity: 1; }
}

.sessions-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-session {
  display: block;
  width: 100%;
  min-height: 5.25rem;
  border-radius: 0.5rem;
  background: var(--color-base-200);
}

.session {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 0.0625rem solid var(--color-border);
  margin-bottom: 0.5rem;

  &.current {
    border-color: var(--color-primary);
    background: color-mix(in oklab, var(--color-primary) 5%, transparent);
  }
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.session-label {
  font-size: 0.75rem;
  font-weight: 600;
}

.session-ua {
  font-size: 0.6875rem;
  opacity: 0.4;
  word-break: break-all;
  line-height: 1.3;
}

.session-ip {
  font-size: 0.6875rem;
  opacity: 0.5;
  font-family: monospace;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.session-times {
  display: flex;
  font-size: 0.6875rem;
  opacity: 0.35;
  margin-top: 0.125rem;

  > span {
    width: 7rem;
  }
}

.session-action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  border: none;
  font-size: 0.6875rem;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.12s;

  &.kick {
    background: transparent;
    color: var(--color-error);
    opacity: 0.6;

    &:hover { opacity: 1; }
  }

  &.logout {
    background: transparent;
    color: var(--color-base-content);
    opacity: 0.4;

    &:hover { opacity: 0.7; }
  }
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

/* ---- Form ---- */
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;

  > span {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.025rem;
    opacity: 0.4;
  }
}

.actions {
  padding-top: 0.5rem;
}

.dim {
  font-size: 0.875rem;
  opacity: 0.35;
  padding: 1rem 0;
}

@media (max-width: 48rem) {
  .section {
    max-width: 100%;
  }
}
</style>
