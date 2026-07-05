<script setup lang="ts">
import { computed, markRaw, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Palette, Lock, Mail } from '@lucide/vue'
import ProfileSection from './sections/ProfileSection.vue'
import AppearanceSection from './sections/AppearanceSection.vue'
import SecuritySection from './sections/SecuritySection.vue'
import EmailSection from './sections/EmailSection.vue'

interface Section {
  key: string
  title: string
  icon: Component
  component: Component
}

const sections: Section[] = [
  { key: 'profile', title: '个人信息', icon: markRaw(User), component: markRaw(ProfileSection) },
  { key: 'appearance', title: '外观', icon: markRaw(Palette), component: markRaw(AppearanceSection) },
  { key: 'security', title: '安全', icon: markRaw(Lock), component: markRaw(SecuritySection) },
  { key: 'email', title: '邮件', icon: markRaw(Mail), component: markRaw(EmailSection) },
]

const route = useRoute()
const router = useRouter()

const activeKey = computed(() => {
  const tab = route.query.tab as string
  return sections.some(s => s.key === tab) ? tab : 'profile'
})
const activeSection = computed(() => sections.find(s => s.key === activeKey.value)!)

function switchTab(key: string) {
  router.replace({ query: { tab: key } })
}
</script>

<template>
  <div class="page">
    <div class="head">
      <h1>设置</h1>
    </div>

    <div class="settings">
      <nav class="sidebar">
        <button
          v-for="s in sections"
          :key="s.key"
          :class="['nav-item', { active: activeKey === s.key }]"
          @click="switchTab(s.key)"
        >
          <component :is="s.icon" style="width: 1rem; height: 1rem;" />
          {{ s.title }}
        </button>
      </nav>

      <div class="content">
        <component :is="activeSection.component" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.page {
  max-width: 50rem;
  // padding: 1.75rem 2rem;
}

.head {
  margin-bottom: 1.5rem;

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }
}

.settings {
  display: flex;
  gap: 2rem;
}

.sidebar {
  flex-shrink: 0;
  width: 10rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: var(--color-base-content);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.12s;

  &:hover {
    opacity: 0.8;
    background: var(--color-base-200);
  }

  &.active {
    opacity: 1;
    background: var(--color-base-200);
  }
}

.content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 64rem) {
  // .page {
  //   padding: 1.25rem 1rem;
  // }

  .settings {
    flex-direction: column;
    gap: 1.25rem;
  }

  .sidebar {
    width: auto;
    flex-direction: row;
    gap: 0.25rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .nav-item {
    white-space: nowrap;
    padding: 0.4375rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>
