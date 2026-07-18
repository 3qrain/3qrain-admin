<script setup lang="ts">
import { ExternalLink, Send } from '@lucide/vue'
import { toast } from 'vue-sonner'

const friendApi = useFriendLinkApi()
const store = useAppStore()
const { data: res, status, refresh } = await useAsyncData('friend-links', () => friendApi.getList())

const links = computed(() => res.value?.data ?? [])
const submitting = ref(false)
const form = reactive({
  siteName: '',
  siteUrl: '',
  avatarUrl: '',
  description: '',
  applicantEmail: ''
})

function resetForm() {
  form.siteName = ''
  form.siteUrl = ''
  form.avatarUrl = ''
  form.description = ''
  form.applicantEmail = ''
}

async function submit() {
  if (!form.siteName.trim() || !form.siteUrl.trim()) {
    toast.error('站点名称和地址必填')
    return
  }

  submitting.value = true
  try {
    const result = await friendApi.create({
      siteName: form.siteName.trim(),
      siteUrl: form.siteUrl.trim(),
      avatarUrl: form.avatarUrl.trim() || null,
      description: form.description.trim() || null,
      applicantEmail: form.applicantEmail.trim() || null
    })
    if (result.success) {
      toast.success('申请已提交')
      resetForm()
      await refresh()
    } else {
      toast.error(result.message || '提交失败')
    }
  } catch (error: any) {
    toast.error(error?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

useHead({ title: computed(() => `友链 - ${store.site.name || '3qrain'}`) })
</script>

<template>
  <div class="friends page-shell">
    <header class="page-intro">
      <span class="eyebrow">Friends</span>
      <h1>友链</h1>
      <p>把互联网上认真生活、认真写作的人，放在一个容易抵达的地方。</p>
    </header>

    <div class="content-grid">
      <section class="links-section">
        <header class="section-head">
          <h2>邻居们</h2>
          <span>{{ links.length }} 个站点</span>
        </header>

        <BaseLoading v-if="status === 'pending'" />

        <div v-else-if="links.length" class="link-list">
          <a
            v-for="linkItem in links"
            :key="linkItem.id"
            :href="linkItem.siteUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="friend-link"
          >
            <img v-if="linkItem.avatarUrl" :src="linkItem.avatarUrl" :alt="linkItem.siteName" class="avatar" />
            <span v-else class="avatar fallback">{{ linkItem.siteName.slice(0, 1) }}</span>
            <span class="friend-copy">
              <strong>{{ linkItem.siteName }}</strong>
              <small>{{ linkItem.description || linkItem.siteUrl }}</small>
            </span>
            <ExternalLink class="external" :size="15" :stroke-width="1.6" />
          </a>
        </div>

        <p v-else class="empty">暂时还没有公开友链。</p>
      </section>

      <aside class="apply">
        <span class="eyebrow">Apply</span>
        <h2>申请加入</h2>
        <p v-if="store.site.features.friendLinks.applicationEnabled">
          如果你也在写博客，可以把站点留在这里。审核通过后会出现在左侧列表。
        </p>
        <p v-else>申请通道暂时关闭，已经公开的友链仍会正常展示。</p>

        <form v-if="store.site.features.friendLinks.applicationEnabled" class="form" @submit.prevent="submit">
          <label>
            <span>站点名称</span>
            <input v-model="form.siteName" type="text" maxlength="64" placeholder="你的博客名称" />
          </label>
          <label>
            <span>站点地址</span>
            <input v-model="form.siteUrl" type="url" placeholder="https://example.com" />
          </label>
          <label>
            <span>头像地址</span>
            <input v-model="form.avatarUrl" type="url" placeholder="可选" />
          </label>
          <label>
            <span>联系邮箱</span>
            <input v-model="form.applicantEmail" type="email" placeholder="可选，用于接收结果" />
          </label>
          <label>
            <span>一句介绍</span>
            <textarea v-model="form.description" maxlength="255" rows="4" placeholder="可选" />
          </label>

          <button class="submit" :disabled="submitting" type="submit">
            <Send :size="15" :stroke-width="1.8" />
            <span>{{ submitting ? '提交中' : '提交申请' }}</span>
          </button>
        </form>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="less">
.friends {
  padding: 4rem 0;
}

.page-intro {
  max-width: 45rem;
  padding-bottom: 3.5rem;

  h1 {
    margin-top: 0.75rem;
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: clamp(2.75rem, 7vw, 4.75rem);
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    max-width: 34rem;
    margin-top: 1rem;
    color: var(--color-muted);
    font-size: 0.9rem;
    line-height: 1.8;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20rem;
  gap: clamp(3rem, 7vw, 6rem);
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  h2 {
    font-size: 1.25rem;
  }

  span {
    color: var(--color-subtle);
    font-size: 0.75rem;
  }
}

.link-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--color-border);
}

.friend-link {
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr) 1rem;
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
  padding: 1.15rem 0;
  border-bottom: 1px solid var(--color-border);

  &:nth-child(odd) {
    padding-right: 1rem;
  }

  &:nth-child(even) {
    padding-left: 1rem;
  }

  &:hover {
    strong,
    .external {
      color: var(--color-primary);
    }
  }
}

.avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.375rem;
  background: var(--color-base-200);
  object-fit: cover;
}

.fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 1rem;
  font-weight: 800;
}

.friend-copy {
  display: block;
  min-width: 0;

  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 0.9rem;
    transition: color 0.16s ease;
  }

  small {
    margin-top: 0.25rem;
    color: var(--color-muted);
    font-size: 0.75rem;
  }
}

.external {
  color: var(--color-subtle);
  transition: color 0.16s ease;
}

.apply {
  padding-left: 2rem;
  border-left: 1px solid var(--color-border);

  h2 {
    margin-top: 0.5rem;
    font-size: 1.4rem;
  }

  > p {
    margin-top: 0.6rem;
    color: var(--color-muted);
    font-size: 0.825rem;
    line-height: 1.75;
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 1.25rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  > span {
    color: var(--color-subtle);
    font-size: 0.7rem;
    font-weight: 700;
  }
}

input,
textarea {
  width: 100%;
  padding: 0.65rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 0.3125rem;
  outline: none;
  background: var(--color-surface);
  color: var(--color-base-content);
  font-size: 0.825rem;

  &::placeholder {
    color: var(--color-subtle);
  }

  &:focus {
    border-color: var(--color-primary);
  }
}

textarea {
  min-height: 6rem;
  resize: vertical;
}

.submit {
  min-height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: none;
  border-radius: 0.3125rem;
  background: var(--color-base-content);
  color: var(--color-base-100);
  font-size: 0.825rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
}

.empty {
  padding: 4rem 0;
  color: var(--color-subtle);
  text-align: center;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .apply {
    max-width: 38rem;
    padding: 2rem 0 0;
    border-top: 1px solid var(--color-border);
    border-left: none;
  }
}

@media (max-width: 768px) {
  .friends {
    padding-top: 2.5rem;
  }

  .page-intro {
    padding-bottom: 2.75rem;
  }

  .link-list {
    grid-template-columns: 1fr;
  }

  .friend-link:nth-child(n) {
    padding-right: 0;
    padding-left: 0;
  }
}
</style>
