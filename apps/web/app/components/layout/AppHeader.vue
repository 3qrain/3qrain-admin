<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { CloudRain, Menu, User as UserIcon, X } from '@lucide/vue'

const store = useAppStore()
const userApi = useUserApi()
const oauth = useOAuth()
const route = useRoute()
const showLoginModal = ref(false)
const mobileOpen = ref(false)

const navItems = [
  { to: '/', label: '首页' },
  { to: '/posts', label: '文章' },
  { to: '/notes', label: '说说' },
  { to: '/friends', label: '友链' },
]

function isNavActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

watch(() => store.user, (v) => { if (v) showLoginModal.value = false })
const showProfileModal = ref(false)
const savingProfile = ref(false)
const profileForm = ref({ email: '' })

function openProfile() {
  if (!store.user) return
  profileForm.value = { email: store.user.email }
  showProfileModal.value = true
}

async function saveProfile() {
  savingProfile.value = true
  try {
    const res = await userApi.updateMe(profileForm.value)
    if (res.success) {
      store.user = res.data
      showProfileModal.value = false
      toast.success('已保存')
    } else {
      toast.error(res.message || '保存失败')
    }
  } catch (e: any) {
    toast.error(e?.message)
  } finally {
    savingProfile.value = false
  }
}

async function logout() {
  try {
    await userApi.logout()
    store.user = null
    showProfileModal.value = false
  } catch { /* ignore */ }
}

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <NuxtLink to="/" class="brand">
        <span class="brand-mark"><CloudRain :size="18" :stroke-width="1.5" /></span>
        <span class="brand-copy">
          <strong>{{ store.site.name || '3qrain' }}</strong>
          <small>Seasonal journal</small>
        </span>
      </NuxtLink>

      <nav class="nav" aria-label="主导航">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['nav-link', { active: isNavActive(item.to) }]"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="actions">
        <ThemeToggle />
        <ClientOnly>
          <button v-if="store.user" class="user-trigger" @click="openProfile">
            <img :src="store.user.avatarUrl" alt="" class="user-avatar" />
          </button>
          <button v-else class="trigger" @click="showLoginModal = true">
            <UserIcon :size="18" :stroke-width="1.5" />
          </button>
          <template #fallback>
            <button class="trigger">
              <UserIcon :size="18" :stroke-width="1.5" />
            </button>
          </template>
        </ClientOnly>
        <button class="menu-trigger" :aria-label="mobileOpen ? '关闭导航' : '打开导航'" @click="mobileOpen = !mobileOpen">
          <X v-if="mobileOpen" :size="18" :stroke-width="1.75" />
          <Menu v-else :size="18" :stroke-width="1.75" />
        </button>
      </div>
    </div>

    <Transition name="drawer">
      <nav v-if="mobileOpen" class="mobile-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['mobile-link', { active: isNavActive(item.to) }]"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </Transition>
  </header>

  <BaseModal v-model:open="showLoginModal">
    <div class="login-card">
      <h3 class="login-title">选择登录方式</h3>
      <div class="providers">
        <button class="provider" :disabled="!!oauth.loadingProvider.value" @click="oauth.login('github')">
          <svg v-if="oauth.loadingProvider.value === 'github'" class="spin" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M22 12a10 10 0 0 0-10-10" stroke-linecap="round"/></svg>
          <svg v-else viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          <span>GitHub</span>
        </button>
        <button class="provider" :disabled="!!oauth.loadingProvider.value" @click="oauth.login('google')">
          <svg v-if="oauth.loadingProvider.value === 'google'" class="spin" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M22 12a10 10 0 0 0-10-10" stroke-linecap="round"/></svg>
          <svg v-else viewBox="0 0 24 24" width="24" height="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          <span>Google</span>
        </button>
      </div>
    </div>
  </BaseModal>

  <BaseModal v-model:open="showProfileModal">
    <div v-if="store.user" class="profile-card">
      <div class="profile-header">
        <img :src="store.user.avatarUrl" alt="" class="profile-avatar" />
        <p class="profile-name">{{ store.user.username }}</p>
      </div>
      <div class="profile-form">
        <label class="field">
          <span>邮箱</span>
          <input v-model="profileForm.email" type="email" class="input" placeholder="用于接收通知" maxlength="254" />
        </label>
      </div>
      <div class="profile-actions">
        <button class="btn-logout" @click="logout">退出登录</button>
        <button class="btn-save" :disabled="savingProfile" @click="saveProfile">
          {{ savingProfile ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped lang="less">
.header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  height: var(--header-height);
  display: flex;
  align-items: center;
  background: var(--color-header);
  backdrop-filter: blur(1.25rem);

  &-inner {
    height: 100%;
    width: min(var(--site-max), calc(100vw - 2rem));
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: var(--color-base-content);
  flex-shrink: 0;
}

.brand-mark {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-accent-soft);
  color: var(--color-primary);
  transition: transform 0.3s ease, background 0.3s ease;

  .brand:hover & {
    transform: translateY(0.125rem);
    background: var(--color-surface-muted);
  }
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1;

  strong {
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0;
  }

  small {
    margin-top: 0.3rem;
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--color-subtle);
  }
}

.nav {
  display: flex;
  justify-content: center;
  align-self: stretch;
  gap: 1.75rem;
}

.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-base-content);
  opacity: 0.46;
  transition: color 0.2s ease, opacity 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: calc(50% + 1rem);
    left: 0;
    height: 0.125rem;
    border-radius: 999px;
    background: var(--color-primary);
    transform: scaleX(0);
    transition: transform 0.2s ease;
  }

  &:hover {
    color: var(--color-primary);
    opacity: 0.86;
  }

  &.active {
    opacity: 1;
    color: var(--color-base-content);

    &::after {
      transform: scaleX(1);
    }
  }
}

.actions {
  flex-shrink: 0;
  min-width: 5.25rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.trigger,
.user-trigger,
.menu-trigger {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: opacity 0.15s;
}

.trigger,
.menu-trigger {
  color: var(--color-base-content);
  opacity: 0.48;

  &:hover {
    color: var(--color-primary);
    background: var(--color-accent-soft);
    opacity: 1;
  }
}

.menu-trigger {
  display: none;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
}

.mobile-nav {
  display: none;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-0.375rem);
}

/* ---- Modal Card ---- */
.login-card,
.profile-card {
  background: var(--color-base-100, #fff);
  border-radius: 0.5rem;
  padding: 1.75rem 2rem;
  width: 20rem;
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 0.15);
}

.login-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 1.25rem;
  text-align: center;
}

.providers {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.provider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  border: 0.0625rem solid var(--color-border, #e5e5e5);
  background: transparent;
  color: var(--color-base-content, #333);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.12s;

  &:hover { background: var(--color-base-200, #f5f5f5); }
  &:disabled { opacity: .35; cursor: default; &:hover { background: transparent; } }
}

.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.25rem;
}

.profile-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  object-fit: cover;
}

.profile-name {
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  > span {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.025rem;
    opacity: 0.4;
  }
}

.input {
  padding: 0.4375rem 0.625rem;
  border-radius: 0.4375rem;
  border: 0.0625rem solid var(--color-border, #e5e5e5);
  background: var(--color-base-100, #fff);
  font-size: 0.8125rem;
  color: var(--color-base-content, #333);
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;

  &:focus { border-color: var(--color-primary, #6366f1); }
}

.profile-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.25rem;
}

.btn-logout {
  border: none;
  background: transparent;
  font-size: 0.75rem;
  color: var(--color-base-content, #333);
  opacity: 0.35;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.7; }
}

.btn-save {
  padding: 0.375rem 1rem;
  border-radius: 0.4375rem;
  border: none;
  background: var(--color-primary, #6366f1);
  color: var(--color-primary-content, #fff);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: default; }
}

@media (max-width: 768px) {
  .nav {
    display: none;
  }

  .brand-copy small {
    display: none;
  }

  .actions {
    min-width: 0;
  }

  .menu-trigger {
    display: flex;
  }

  .mobile-nav {
    display: flex;
    position: absolute;
    left: 0;
    right: 0;
    top: var(--header-height);
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.625rem max(1rem, calc((100vw - var(--site-max)) / 2));
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-header);
    box-shadow: var(--shadow-soft);
    backdrop-filter: blur(1.25rem);
  }

  .mobile-link {
    padding: 0.75rem 0.875rem;
    border-radius: 0.3125rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-muted);

    &.active {
      color: var(--color-primary);
      background: var(--color-accent-soft);
    }
  }

  .login-card,
  .profile-card {
    width: min(20rem, calc(100vw - 2rem));
  }
}

</style>
