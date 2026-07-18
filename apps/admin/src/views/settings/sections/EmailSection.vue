<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { CheckCircle, SaveCheck, XCircle } from '@lucide/vue'
import Input from '~/components/base/Input.vue'
import Button from '~/components/base/Button.vue'
import Skeleton from '~/components/base/Skeleton.vue'
import ToggleSwitch from '~/components/base/ToggleSwitch.vue'
import { getEmailConfig, saveEmailConfig, testEmailConnection, sendTestEmail, type EmailConfig } from '~/api/config'
import { useAppStore } from '~/stores/app'

const loading = ref(true)
const saving = ref(false)
const testing = ref(false)
const sending = ref(false)
const testResult = ref<'ok' | 'fail' | null>(null)
const testError = ref('')
const form = ref<EmailConfig>({
  enabled: false,
  host: '',
  port: 465,
  user: '',
  pass: ''
})
const savedForm = ref<EmailConfig>({ ...form.value })
const hasChanges = computed(() => JSON.stringify(form.value) !== JSON.stringify(savedForm.value))

async function load() {
  loading.value = true
  try {
    form.value = await getEmailConfig()
    savedForm.value = { ...form.value }
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!hasChanges.value) return

  const payload = { ...form.value }
  saving.value = true
  try {
    await saveEmailConfig(payload)
    savedForm.value = payload
    useAppStore().emailEnabled = payload.enabled
    toast.success('已保存')
    testResult.value = null
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleTest() {
  testing.value = true
  testResult.value = null
  testError.value = ''
  try {
    const res = await testEmailConnection()
    testResult.value = res.success ? 'ok' : 'fail'
    if (!res.success) testError.value = res.message
  } catch (e: any) {
    testResult.value = 'fail'
    testError.value = e?.response?.data?.message || '测试失败'
  } finally {
    testing.value = false
  }
}

async function handleSendTest() {
  sending.value = true
  testResult.value = null
  testError.value = ''
  try {
    const res = await sendTestEmail()
    testResult.value = res.success ? 'ok' : 'fail'
    if (!res.success) testError.value = res.message
  } catch (e: any) {
    testResult.value = 'fail'
    testError.value = e?.response?.data?.message || '发送失败'
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="section" :aria-busy="loading">
    <div class="section-heading">
      <h2 class="section-title">邮件服务</h2>
      <Button
        variant="neutral"
        size="sm"
        :loading="saving"
        :disabled="loading || !hasChanges"
        @click="handleSave"
      >
        <SaveCheck :size="14" />
        保存
      </Button>
    </div>
    <p class="section-desc">配置 SMTP 服务器用于发送通知邮件。</p>

    <div v-if="loading" class="settings-skeleton-reveal" aria-hidden="true">
      <Skeleton class="email-skeleton">
        <div class="skeleton-toggle-row">
          <span class="skeleton-block skeleton-toggle" />
          <span class="skeleton-block skeleton-line toggle-label" />
        </div>

        <div class="skeleton-form">
          <div v-for="index in 4" :key="index" class="skeleton-field">
            <span class="skeleton-block skeleton-label" />
            <span class="skeleton-block skeleton-input" />
          </div>
        </div>

        <div class="skeleton-actions">
          <span class="skeleton-block skeleton-button" />
          <span class="skeleton-block skeleton-button wide" />
        </div>
      </Skeleton>
    </div>

    <template v-else>
      <label class="toggle-row">
        <ToggleSwitch v-model="form.enabled" />
        <span>启用邮件发送</span>
      </label>

      <div class="form">
        <label class="field">
          <span>SMTP 服务器</span>
          <Input v-model="form.host" placeholder="smtp.example.com" :disabled="!form.enabled" />
        </label>
        <label class="field">
          <span>端口</span>
          <Input v-model.number="form.port" type="number" placeholder="465" :disabled="!form.enabled" />
        </label>
        <label class="field">
          <span>用户名</span>
          <Input v-model="form.user" placeholder="user@example.com" :disabled="!form.enabled" />
        </label>
        <label class="field">
          <span>密码</span>
          <Input v-model="form.pass" type="password" placeholder="SMTP 密码或授权码" :disabled="!form.enabled" />
        </label>
      </div>

      <div class="actions">
        <Button variant="ghost" :loading="testing" :disabled="!form.enabled" @click="handleTest">测试连通性</Button>
        <Button variant="ghost" :loading="sending" :disabled="!form.enabled" @click="handleSendTest">发送测试邮件</Button>
      </div>

      <div v-if="testResult" class="test-result" :class="testResult">
        <CheckCircle v-if="testResult === 'ok'" :size="14" />
        <XCircle v-else :size="14" />
        <span>{{ testResult === 'ok' ? '操作成功' : testError }}</span>
      </div>
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
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.section-desc {
  font-size: 0.8125rem;
  opacity: 0.4;
  margin: 0 0 1rem;
}

.settings-skeleton-reveal {
  opacity: 0;
  animation: settings-skeleton-reveal 0.2s ease-out 0.08s forwards;
}

@keyframes settings-skeleton-reveal {
  to { opacity: 1; }
}

.email-skeleton,
.skeleton-form {
  display: flex;
  flex-direction: column;
}

.email-skeleton {
  gap: 1rem;
}

.skeleton-form {
  gap: 0.875rem;
}

.skeleton-block {
  display: block;
  border-radius: 0.25rem;
  background: var(--color-base-200);
}

.skeleton-toggle-row,
.skeleton-actions {
  display: flex;
  align-items: center;
}

.skeleton-toggle-row {
  gap: 0.5rem;
}

.skeleton-toggle {
  width: 2.625rem;
  height: 1.5rem;
  border-radius: 999px;
}

.skeleton-line.toggle-label {
  width: 5.5rem;
  height: 0.75rem;
}

.skeleton-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.skeleton-label {
  width: 4rem;
  height: 0.625rem;
}

.skeleton-input {
  width: 100%;
  height: 2.25rem;
}

.skeleton-actions {
  gap: 0.5rem;
}

.skeleton-button {
  width: 5.5rem;
  height: 2rem;

  &.wide {
    width: 6.5rem;
  }
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  cursor: pointer;
  margin-bottom: 1rem;
  user-select: none;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  > span {
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0.4;
    transition: opacity 0.2s;
  }
}

.actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.test-result {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  border-color: var(--alert-border-color, var(--color-base-200));
  &.ok {
    background: color-mix(in oklab, var(--color-success, var(--color-base-content)) 8%, var(--color-base-100));
    color: var(--color-success, var(--color-base-content));
    --alert-border-color: color-mix(
      in oklab,
      var(--color-success, var(--color-base-content)) 10%,
      var(--color-base-100)
    );
  }

  &.fail {
    background: color-mix(in oklab, var(--color-error, var(--color-base-content)) 8%, var(--color-base-100));
    color: var(--color-error, var(--color-base-content));
    --alert-border-color: color-mix(
      in oklab,
      var(--color-success, var(--color-base-content)) 10%,
      var(--color-base-100)
    );
  }
}
</style>
