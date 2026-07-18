<script setup lang="ts">
import { computed } from "vue";
import ToggleGroup from "~/components/base/ToggleGroup.vue";
import { useAppStore } from "~/stores/app";
import { setTheme, type Theme } from "~/css/themes/index";

const appStore = useAppStore();
const theme = computed(() => appStore.theme);

const themeOptions = [
  { label: "跟随系统", value: "system" as const },
  { label: "浅色", value: "light" as const },
  { label: "深色", value: "dark" as const },
];
</script>

<template>
  <div class="section">
    <div class="section-heading">
      <h2 class="section-title">外观</h2>
    </div>
    <p class="section-desc">自定义后台界面的显示主题。</p>

    <div class="form">
      <div class="field">
        <span>主题</span>
        <ToggleGroup :model-value="theme" :options="themeOptions" @update:model-value="setTheme($event as Theme)" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.section-heading {
  display: flex;
  align-items: center;
  height: 2rem;
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
  margin: 0 0 1.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

</style>
