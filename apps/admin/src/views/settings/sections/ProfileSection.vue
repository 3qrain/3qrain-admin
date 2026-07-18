<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Image as ImageIcon, Trash2 } from '@lucide/vue'
import { toast } from 'vue-sonner'
import Input from '~/components/base/Input.vue'
import Textarea from '~/components/base/Textarea.vue'
import Button from '~/components/base/Button.vue'
import Skeleton from '~/components/base/Skeleton.vue'
import MediaPickerModal from '~/components/media/MediaPickerModal.vue'
import { getProfile, updateProfile } from '~/api/account'
import { getConfig, updateConfig } from '~/api/config'
import type { SiteInfo } from '~/api/config/types'
import type { MediaItem } from '~/api/media'
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
  filingNumber: '',
  filingUrl: ''
})

async function load() {
  loading.value = true
  try {
    const [p, config] = await Promise.all([getProfile(), getConfig(['siteInfo'])])
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
    await Promise.all([
      updateProfile(profile.value),
      updateConfig('siteInfo', siteInfo.value),
    ])
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
  <div class="section" :aria-busy="loading">
    <h2 class="section-title">个人信息</h2>
    <p class="section-desc">管理你的资料和站点信息。</p>

    <div v-if="loading" class="profile-skeleton-reveal" aria-hidden="true">
      <Skeleton class="form profile-skeleton">
        <div class="avatar-row">
          <span class="skeleton-block skeleton-avatar" />
          <div class="skeleton-avatar-copy">
            <span class="skeleton-block skeleton-line title" />
            <span class="skeleton-block skeleton-line avatar-desc" />
            <span class="skeleton-block skeleton-button secondary" />
          </div>
        </div>

        <div v-for="index in 2" :key="index" class="skeleton-field">
          <span class="skeleton-block skeleton-label" />
          <span class="skeleton-block skeleton-input" />
        </div>

        <div class="skeleton-field">
          <span class="skeleton-block skeleton-label" />
          <span class="skeleton-block skeleton-textarea" />
        </div>

        <div class="form-group">
          <div class="skeleton-group-head">
            <span class="skeleton-block skeleton-line group-title" />
            <span class="skeleton-block skeleton-line group-desc" />
          </div>

          <div v-for="index in 2" :key="`footer-${index}`" class="skeleton-field">
            <span class="skeleton-block skeleton-label" />
            <span class="skeleton-block skeleton-input" />
          </div>

          <div class="filing-fields">
            <div v-for="index in 2" :key="`filing-${index}`" class="skeleton-field">
              <span class="skeleton-block skeleton-label" />
              <span class="skeleton-block skeleton-input" />
            </div>
          </div>
        </div>

        <span class="skeleton-block skeleton-button save" />
      </Skeleton>
    </div>
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
        <Textarea
          v-model="siteInfo.bio"
          :rows="3"
          placeholder="一句话介绍自己"
        />
      </label>

      <div class="form-group">
        <div class="group-head">
          <h2>页脚信息</h2>
          <p>用于前台页脚的箴言、版权和备案信息。</p>
        </div>

        <label class="field">
          <span>箴言</span>
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

.profile-skeleton-reveal {
  opacity: 0;
  animation: profile-skeleton-reveal 0.2s ease-out 0.08s forwards;
}

@keyframes profile-skeleton-reveal {
  to { opacity: 1; }
}

.skeleton-block {
  display: block;
  border-radius: 0.25rem;
  background: var(--color-base-200);
}

.skeleton-avatar {
  width: 4rem;
  height: 4rem;
  flex: 0 0 4rem;
  border-radius: 50%;
}

.skeleton-avatar-copy {
  flex: 1;
  min-width: 0;
}

.skeleton-line {
  height: 0.75rem;

  &.title {
    width: 4.5rem;
  }

  &.avatar-desc {
    width: min(15rem, 80%);
    height: 0.625rem;
    margin-top: 0.45rem;
  }

  &.group-title {
    width: 4rem;
  }

  &.group-desc {
    width: min(18rem, 72%);
    height: 0.625rem;
    margin-top: 0.45rem;
  }
}

.skeleton-button {
  width: 5.25rem;
  height: 1.75rem;

  &.secondary {
    margin-top: 0.7rem;
  }

  &.save {
    width: 4.25rem;
    height: 2rem;
    margin-top: 0.5rem;
  }
}

.skeleton-field {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  min-width: 0;
}

.skeleton-label {
  width: 2.5rem;
  height: 0.625rem;
}

.skeleton-input {
  width: 100%;
  height: 2rem;
}

.skeleton-textarea {
  width: 100%;
  height: 4.75rem;
}

.skeleton-group-head {
  padding-bottom: 0.05rem;
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
  h2 {
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

  .skeleton-avatar-copy {
    width: 100%;
  }

  .filing-fields {
    grid-template-columns: 1fr;
  }
}
</style>
