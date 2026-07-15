<script setup lang="ts">
import { Flower2, Leaf, Monitor, Moon, Palette, Snowflake, Sun, SunMedium } from '@lucide/vue'
import type { Season } from '~/stores/app'

type Theme = 'system' | 'light' | 'dark'

const store = useAppStore()
const root = ref<HTMLElement | null>(null)
const open = ref(false)

const themes: { value: Theme; label: string; icon: typeof Monitor }[] = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '白天', icon: Sun },
  { value: 'dark', label: '黑夜', icon: Moon }
]

const seasons: { value: Season; label: string; icon: typeof Leaf }[] = [
  { value: 'spring', label: '春', icon: Flower2 },
  { value: 'summer', label: '夏', icon: SunMedium },
  { value: 'autumn', label: '秋', icon: Leaf },
  { value: 'winter', label: '冬', icon: Snowflake }
]

function resolve(theme: Theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyAppearance() {
  document.documentElement.dataset.theme = resolve(store.theme)
  document.documentElement.dataset.season = store.season
}

function setTheme(theme: Theme) {
  store.theme = theme
  applyAppearance()
}

function setSeason(season: Season) {
  store.season = season
  applyAppearance()
}

function onDocumentClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

let mediaQuery: MediaQueryList | null = null
function onSystemThemeChange() {
  if (store.theme === 'system') applyAppearance()
}

onMounted(() => {
  applyAppearance()
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', onSystemThemeChange)
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', onSystemThemeChange)
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <ClientOnly>
    <div ref="root" class="appearance">
      <button
        type="button"
        class="appearance-trigger"
        title="外观"
        :aria-expanded="open"
        @click.stop="open = !open"
      >
        <Palette :size="17" :stroke-width="1.6" />
      </button>

      <Transition name="appearance-pop">
        <div v-if="open" class="appearance-panel">
          <div class="control-group">
            <span class="control-label">明暗</span>
            <div class="theme-options">
              <button
                v-for="item in themes"
                :key="item.value"
                type="button"
                :class="['theme-option', { active: store.theme === item.value }]"
                :title="item.label"
                @click="setTheme(item.value)"
              >
                <component :is="item.icon" :size="15" :stroke-width="1.6" />
              </button>
            </div>
          </div>

          <div class="control-group season-group">
            <span class="control-label">季节</span>
            <div class="season-options">
              <button
                v-for="item in seasons"
                :key="item.value"
                type="button"
                :class="['season-option', `season-${item.value}`, { active: store.season === item.value }]"
                @click="setSeason(item.value)"
              >
                <span class="season-swatch" />
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <template #fallback>
      <span class="appearance-fallback" />
    </template>
  </ClientOnly>
</template>

<style scoped lang="less">
.appearance {
  position: relative;
}

.appearance-trigger,
.appearance-fallback {
  width: 2.25rem;
  height: 2.25rem;
}

.appearance-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-base-content);
  cursor: pointer;
  opacity: 0.5;
  transition: color 0.16s ease, opacity 0.16s ease, background 0.16s ease;

  &:hover,
  &[aria-expanded='true'] {
    color: var(--color-primary);
    background: var(--color-accent-soft);
    opacity: 1;
  }
}

.appearance-fallback {
  display: block;
}

.appearance-panel {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: 15rem;
  padding: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(1.25rem);
}

.control-group {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.625rem;
}

.season-group {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.control-label {
  color: var(--color-subtle);
  font-size: 0.6875rem;
}

.theme-options,
.season-options {
  display: grid;
  gap: 0.25rem;
}

.theme-options {
  grid-template-columns: repeat(3, 1fr);
}

.theme-option {
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.3125rem;
  background: var(--color-surface-muted);
  color: var(--color-muted);
  cursor: pointer;

  &.active {
    background: var(--color-base-content);
    color: var(--color-base-100);
  }
}

.season-options {
  grid-template-columns: repeat(4, 1fr);
}

.season-option {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.375rem 0.125rem;
  border: none;
  border-radius: 0.3125rem;
  background: transparent;
  color: var(--color-subtle);
  font-size: 0.625rem;
  cursor: pointer;

  &.active {
    background: var(--color-surface-muted);
    color: var(--color-base-content);
  }
}

.season-swatch {
  width: 0.875rem;
  height: 0.875rem;
  border: 0.125rem solid var(--color-surface);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--color-border);
}

.season-spring .season-swatch { background: var(--swatch-spring); }
.season-summer .season-swatch { background: var(--swatch-summer); }
.season-autumn .season-swatch { background: var(--swatch-autumn); }
.season-winter .season-swatch { background: var(--swatch-winter); }

.appearance-pop-enter-active,
.appearance-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.appearance-pop-enter-from,
.appearance-pop-leave-to {
  opacity: 0;
  transform: translateY(-0.375rem) scale(0.98);
}
</style>
