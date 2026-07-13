<script setup lang="ts">
import { computed } from 'vue'
import { Sun, Moon, Monitor } from '@lucide/vue'
import { setTheme, type Theme } from '~/css/themes'
import { useAppStore } from '~/stores/app'

const theme = computed(() => useAppStore().theme)

const modes: { key: Theme; icon: typeof Sun; label: string }[] = [
  { key: 'light', icon: Sun, label: '浅色' },
  { key: 'dark', icon: Moon, label: '深色' },
  { key: 'system', icon: Monitor, label: '跟随系统' }
]

const activeIndex = computed(() => modes.findIndex(m => m.key === theme.value))
</script>

<template>
  <div class="theme-toggle">
    <span class="indicator" :style="{ '--i': activeIndex }" />
    <button
      v-for="m in modes"
      :key="m.key"
      class="btn"
      :class="{ on: theme === m.key }"
      :title="m.label"
      @click="setTheme(m.key)"
    >
      <component :is="m.icon" style="width: 0.9375rem; height: 0.9375rem" />
    </button>
  </div>
</template>

<style scoped lang="less">
.theme-toggle {
  --p: .25rem;
  position: relative;
  display: flex;
  padding: var(--p);
  border-radius: .625rem;
  background: var(--color-base-300);
}

.indicator {
  position: absolute;
  top: var(--p);
  left: calc(var(--p) + var(--i, 0) * (100% - var(--p) * 2) / 3);
  width: calc((100% - var(--p) * 2) / 3);
  height: calc(100% - var(--p) * 2);
  border-radius: .5rem;
  background: var(--color-base-100);
  box-shadow: 0 .0625rem .1875rem rgb(0 0 0 / 0.08);
  transition: left 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.btn {
  position: relative;
  z-index: 1;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: .375rem 0;
  border: none;
  border-radius: .5rem;
  background: transparent;
  color: var(--color-base-content);
  opacity: .4;
  cursor: pointer;
  transition: opacity .15s;

  &:hover { opacity: .7; }
  &.on { opacity: 1; }
}
</style>

<!-- <script setup lang="ts">
import { computed } from "vue";
import { Sun, Moon, Monitor } from "@lucide/vue";
import { setTheme, type Theme } from "~/css/themes";
import { useAppStore } from "~/stores/app";

const theme = computed(() => useAppStore().theme);

const modes: { key: Theme; icon: typeof Sun; label: string }[] = [
  { key: "light", icon: Sun, label: "浅色" },
  { key: "dark", icon: Moon, label: "深色" },
  { key: "system", icon: Monitor, label: "跟随系统" },
];
</script>

<template>
  <div class="theme-toggle">
    <button
      v-for="m in modes"
      :key="m.key"
      :class="['btn', theme === m.key && 'on']"
      :title="m.label"
      @click="setTheme(m.key)"
    >
      <component :is="m.icon" style="width: .9375rem; height: .9375rem;" />
    </button>
  </div>
</template>

<style scoped lang="less">
.theme-toggle {
  display: flex;
  gap: .125rem;
  padding: .125rem;
  border-radius: .625rem;
  background: var(--color-base-300);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: .375rem 0;
  border: none;
  border-radius: .5rem;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.4;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { opacity: 0.7; }

  &.on {
    opacity: 1;
    background: var(--color-base-100);
    box-shadow: 0 .0625rem .1875rem rgb(0 0 0 / 0.08);
  }
}
</style> -->
