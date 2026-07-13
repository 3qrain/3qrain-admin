<script setup lang="ts">
import { ExternalLink, Send } from '@lucide/vue'
import { toast } from 'vue-sonner'

const friendApi = useFriendLinkApi()
const { data: res, status, refresh } = await useAsyncData('friend-links', () => friendApi.getList())

const links = computed(() => res.value?.data ?? [])
const submitting = ref(false)
const form = reactive({
  siteName: '',
  siteUrl: '',
  avatarUrl: '',
  description: '',
  applicantEmail: '',
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
    const res = await friendApi.create({
      siteName: form.siteName.trim(),
      siteUrl: form.siteUrl.trim(),
      avatarUrl: form.avatarUrl.trim() || null,
      description: form.description.trim() || null,
      applicantEmail: form.applicantEmail.trim() || null,
    })
    if (res.success) {
      toast.success('申请已提交')
      resetForm()
      await refresh()
    } else {
      toast.error(res.message || '提交失败')
    }
  } catch (e: any) {
    toast.error(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

useHead({ title: '友链 - 3qrain' })
</script>

<template>
  <div class="friends page-shell">
    <header class="page-hero">
      <span class="eyebrow">Friends</span>
      <div class="hero-line">
        <h1>友链</h1>
        <p>把互联网上认真生活和认真写作的人，放在一个容易抵达的地方。</p>
      </div>
    </header>

    <div class="content">
      <section class="links-section">
        <div class="section-head">
          <h2>邻居们</h2>
          <span>{{ links.length }} 个站点</span>
        </div>

        <BaseLoading v-if="status === 'pending'" />

        <div v-else-if="links.length" class="link-grid">
          <a
            v-for="link in links"
            :key="link.id"
            :href="link.siteUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="friend-card soft-card"
          >
            <img v-if="link.avatarUrl" :src="link.avatarUrl" :alt="link.siteName" class="friend-avatar" />
            <div v-else class="friend-avatar fallback">{{ link.siteName.slice(0, 1) }}</div>
            <div class="friend-main">
              <div class="friend-title">
                <h3>{{ link.siteName }}</h3>
                <ExternalLink :size="15" :stroke-width="1.8" />
              </div>
              <p>{{ link.description || link.siteUrl }}</p>
            </div>
          </a>
        </div>

        <p v-else class="empty">暂时还没有公开友链。</p>
      </section>

      <aside class="apply soft-card">
        <span class="eyebrow">Apply</span>
        <h2>申请加入</h2>
        <p>如果你也在写博客，欢迎把站点留在这里。审核通过后会出现在友链列表里。</p>

        <form class="form" @submit.prevent="submit">
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
            <Send :size="16" :stroke-width="1.8" />
            <span>{{ submitting ? '提交中' : '提交申请' }}</span>
          </button>
        </form>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="less">
.friends {
  padding: 3rem 0 4rem;
}

.page-hero {
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.hero-line {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  margin-top: 0.75rem;

  h1 {
    font-size: clamp(2.5rem, 7vw, 5.5rem);
    line-height: 0.95;
    font-weight: 900;
    letter-spacing: 0;
  }

  p {
    max-width: 30rem;
    color: var(--color-muted);
    line-height: 1.85;
    text-align: right;
  }
}

.content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22rem;
  gap: 2rem;
  margin-top: 2rem;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  h2 {
    font-size: 1.25rem;
    font-weight: 900;
  }

  span {
    color: var(--color-subtle);
    font-size: 0.8125rem;
  }
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.friend-card {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr);
  gap: 0.875rem;
  padding: 1rem;
  border-radius: 0.5rem;
  color: inherit;
  transition: transform 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in oklab, var(--color-primary) 42%, var(--color-border));
  }
}

.friend-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  object-fit: cover;
  background: var(--color-base-200);
}

.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 1.25rem;
  font-weight: 900;
}

.friend-main {
  min-width: 0;
}

.friend-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  h3 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9375rem;
    font-weight: 900;
  }

  svg {
    color: var(--color-subtle);
    flex-shrink: 0;
  }
}

.friend-main p {
  margin-top: 0.375rem;
  color: var(--color-muted);
  font-size: 0.8125rem;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.apply {
  position: sticky;
  top: 6rem;
  padding: 1.25rem;
  border-radius: 0.5rem;

  h2 {
    margin-top: 0.5rem;
    font-size: 1.5rem;
    font-weight: 900;
  }

  > p {
    margin-top: 0.625rem;
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.7;
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  span {
    color: var(--color-subtle);
    font-size: 0.75rem;
    font-weight: 800;
  }
}

input,
textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--color-base-100) 88%, transparent);
  color: var(--color-base-content);
  outline: none;
  padding: 0.65rem 0.75rem;
  font-size: 0.875rem;

  &::placeholder {
    color: var(--color-subtle);
  }

  &:focus {
    border-color: var(--color-primary);
  }
}

textarea {
  resize: vertical;
  min-height: 6rem;
}

.submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  border: none;
  border-radius: 999px;
  background: var(--color-base-content);
  color: var(--color-base-100);
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}

.empty {
  padding: 4rem 0;
  color: var(--color-subtle);
  text-align: center;
}

@media (max-width: 920px) {
  .content {
    grid-template-columns: 1fr;
  }

  .apply {
    position: static;
  }
}

@media (max-width: 680px) {
  .friends {
    padding-top: 2rem;
  }

  .hero-line {
    display: block;

    p {
      margin-top: 1rem;
      text-align: left;
    }
  }

  .link-grid {
    grid-template-columns: 1fr;
  }
}
</style>
