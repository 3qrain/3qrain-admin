<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Image as ImageIcon, Trash2 } from '@lucide/vue'
import { toast } from 'vue-sonner'
import Input from '~/components/base/Input.vue'
import Button from '~/components/base/Button.vue'
import Loading from '~/components/base/Loading.vue'
import MediaPickerModal from '~/components/media/MediaPickerModal.vue'
import { getProfile, updateProfile } from '~/api/account'
import { getConfig, updateConfig } from '~/api/config'
import type { SiteInfo } from '~/api/config/types'
import type { MediaItem } from '~/api/media'
import { withMinDuration } from '~/utils/async'
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()

const loading = ref(true)
const saving = ref(false)
const showAvatarPicker = ref(false)
const profile = ref({ username: '', email: '', avatarUrl: '' })
const siteInfo = ref<SiteInfo>({
  bio: '',
  motto: '四时轮转，且惜流年',
  copyright: '© 2026 · 3qrain',
  filingNumber: 'ICP备2026000000号-1',
  filingUrl: 'https://beian.miit.gov.cn/'
})

async function load() {
  loading.value = true
  try {
    const [p, config] = await withMinDuration(() => Promise.all([getProfile(), getConfig(['siteInfo'])]))
    profile.value = { username: p.username, email: p.email, avatarUrl: p.avatarUrl }
    siteInfo.value = { ...siteInfo.value, ...config.siteInfo }
  } catch {
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await withMinDuration(() => Promise.all([
      updateProfile(profile.value),
      updateConfig('siteInfo', siteInfo.value),
    ]))
    appStore.adminUser = { ...appStore.adminUser, ...profile.value }
    toast.success('已保存')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function selectAvatar(item: MediaItem) {
  profile.value.avatarUrl = item.thumbnailUrl || item.previewUrl || item.url
}

function clearAvatar() {
  profile.value.avatarUrl = ''
}

onMounted(load)
</script>

<template>
  <div class="section">
    <h2 class="section-title">个人信息</h2>
    <p class="section-desc">管理你的资料和站点信息。</p>

    <Loading v-if="loading" />
    <div v-else class="form">
      <div class="avatar-row">
        <img
          v-if="profile.avatarUrl"
          :src="profile.avatarUrl"
          alt="avatar"
          class="avatar-preview"
        />
        <div v-else class="avatar-placeholder">{{ profile.username?.[0] || '?' }}</div>
        <div class="avatar-field">
          <strong>站点头像</strong>
          <p>用于前台站点信息和管理员资料。</p>
          <div class="avatar-actions">
            <Button size="sm" variant="secondary" @click="showAvatarPicker = true">
              <ImageIcon :size="14" />
              选择图片
            </Button>
            <Button v-if="profile.avatarUrl" size="sm" variant="ghost" icon title="移除头像" @click="clearAvatar">
              <Trash2 :size="14" />
            </Button>
          </div>
        </div>
      </div>

      <label class="field">
        <span>昵称</span>
        <Input v-model="profile.username" placeholder="你的名字" />
      </label>

      <label class="field">
        <span>邮箱</span>
        <Input v-model="profile.email" type="email" placeholder="email@example.com" />
      </label>

      <label class="field">
        <span>简介</span>
        <textarea
          v-model="siteInfo.bio"
          class="textarea"
          rows="3"
          placeholder="一句话介绍自己"
        />
      </label>

      <div class="form-group">
        <div class="group-head">
          <h3>页脚信息</h3>
          <p>用于前台页脚的签名、版权和备案信息。</p>
        </div>

        <label class="field">
          <span>简短签名</span>
          <Input v-model="siteInfo.motto" placeholder="四时轮转，且惜流年" />
        </label>

        <label class="field">
          <span>版权信息</span>
          <Input v-model="siteInfo.copyright" placeholder="© 2026 · 3qrain" />
        </label>

        <div class="filing-fields">
          <label class="field">
            <span>备案号</span>
            <Input v-model="siteInfo.filingNumber" placeholder="ICP备2026000000号-1" />
          </label>

          <label class="field">
            <span>备案链接</span>
            <Input v-model="siteInfo.filingUrl" type="url" placeholder="https://beian.miit.gov.cn/" />
          </label>
        </div>
      </div>

      <div class="actions">
        <Button :loading="saving" @click="save">保存</Button>
      </div>
    </div>

    <MediaPickerModal
      v-model:open="showAvatarPicker"
      type="image"
      title="选择头像"
      description="从媒体库选择一张图片作为站点头像。"
      @select="selectAvatar"
    />
  </div>
</template>

<style scoped lang="less">
.section {
  max-width: 36rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.section-desc {
  font-size: 0.8125rem;
  opacity: 0.4;
  margin: 0 0 1.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-preview {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 0.0625rem solid var(--color-border);
}

.avatar-placeholder {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-base-200);
  font-size: 1.25rem;
  font-weight: 600;
  opacity: 0.5;
}

.avatar-field {
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 0.8125rem;
  }

  p {
    margin-top: 0.2rem;
    color: var(--color-base-content);
    font-size: 0.75rem;
    opacity: 0.42;
  }
}

.avatar-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.65rem;
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

.textarea {
  padding: 0.4375rem 0.625rem;
  border-radius: 0.5rem;
  border: 0.0625rem solid var(--color-border);
  background: var(--color-base-100);
  font-size: 0.8125rem;
  color: var(--color-base-content);
  font-family: inherit;
  outline: none;
  resize: vertical;

  &:focus {
    border-color: var(--color-primary);
  }
}

.actions {
  padding-top: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 0.0625rem solid var(--color-border);
}

.group-head {
  h3 {
    font-size: 0.875rem;
    font-weight: 700;
  }

  p {
    margin-top: 0.2rem;
    font-size: 0.75rem;
    opacity: 0.4;
  }
}

.filing-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  gap: 0.75rem;
}

.dim {
  font-size: 0.875rem;
  opacity: 0.35;
  padding: 2rem 0;
}

@media (max-width: 48rem) {
  .section {
    max-width: 100%;
  }

  .avatar-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .avatar-field {
    width: 100%;
  }

  .filing-fields {
    grid-template-columns: 1fr;
  }
}
</style>
