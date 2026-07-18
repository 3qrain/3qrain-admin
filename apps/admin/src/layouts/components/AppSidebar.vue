<script lang="ts" setup>
import { menuRoutes } from '~/router/routes'
import ThemeToggle from '~/components/theme/ThemeToggle.vue'
import UploadIndicator from '~/components/uppy-uploader/UploadIndicator.vue'
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()

defineProps<{
  mobile?: boolean
}>()

const emit = defineEmits<{
  close: []
  upload: []
}>()

function handleClick() {
  emit('close')
}

function openUpload() {
  emit('upload')
}
</script>

<template>
  <div class="sidebar-root">
    <!-- Logo -->
    <div class="logo">
      <span class="logo-text">3qrain</span>
      <span class="logo-badge">Admin</span>
    </div>

    <!-- Nav -->
    <nav class="nav">
      <router-link
        v-for="route in menuRoutes"
        :key="route.path"
        :to="route.path"
        class="nav-item"
        active-class="nav-item-active"
        @click="mobile && handleClick()"
      >
        <component
          :is="route.meta?.icon"
          v-if="route.meta?.icon"
          style="width: 1.125rem; height: 1.125rem"
          class="nav-icon"
        />
        <span>{{ route.meta?.title }}</span>
        <span v-if="route.name === 'notifications' && appStore.unreadCount > 0" class="notify-badge">
          {{ appStore.unreadCount > 99 ? '99+' : appStore.unreadCount }}
        </span>
        <span v-if="route.name === 'friendLinks' && appStore.pendingFriendLinkCount > 0" class="notify-badge">
          {{ appStore.pendingFriendLinkCount > 99 ? '99+' : appStore.pendingFriendLinkCount }}
        </span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="theme-slot">
        <ThemeToggle />
      </div>
      <UploadIndicator size="sm" @click="openUpload" />
    </div>
  </div>
</template>

<style scoped lang="less">
.sidebar-root {
  display: flex;
  flex-direction: column;
  min-width: 15rem;
  height: 100%;
  padding: 0 0.75rem;
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  padding: 1.25rem 0.75rem 1.5rem;
  flex-shrink: 0;
}

@media (width <= 48rem) {
  .logo {
    padding-top: 0rem;
  }
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.0313rem;
}

.logo-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.0625rem;
  opacity: 0.4;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-base-content);
  opacity: 0.6;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;

  &:not(&-active):hover {
    opacity: 0.9;
    background: color-mix(in oklab, var(--color-base-content) 10%, transparent);
  }

  &-active {
    opacity: 1;
    background: var(--color-menu-active-bg);
    box-shadow: 0 0.125rem 0.1875rem -0.125rem var(--color-menu-active-bg);
    color: var(--color-menu-active-fg);
  }
}

.nav-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-item--active .nav-icon {
  opacity: 1;
}

.notify-badge {
  position: absolute;
  top: calc(50% - .5rem);
  right: .5rem;
  min-width: 1rem;
  height: 1rem;
  padding: 0 .25rem;
  // border-radius: 62.4375rem;
  border-radius: .25rem;
  box-shadow: 0 0 .125rem .0625rem #ef4444;
  background: #ef4444;
  color: #fff;
  font-size: .625rem;
  font-weight: 700;
  line-height: 1rem;
  text-align: center;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 1rem 0.75rem;
  border-top: 0.0625rem solid var(--color-border);
}

.theme-slot {
  flex: 1;
  min-width: 0;

  :deep(.theme-toggle) {
    width: 100%;
  }
}
</style>
