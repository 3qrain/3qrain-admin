<!-- app-main区域内专用分页组件 -->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import Loading from '~/components/base/Loading.vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    totalPages: number
    mode?: 'button' | 'scroll'
    loading?: boolean
    rootId?: string
  }>(),
  { mode: 'button', loading: false, rootId: undefined }
)

const emit = defineEmits<{ (e: 'change', page: number): void }>()

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

/* ---- 按钮模式：页码序列 ---- */
const pages = computed<(number | string)[]>(() => {
  const total = props.totalPages
  const current = props.currentPage
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
})

function goTo(page: number) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return
  emit('change', page)
}

/* ---- 滚动模式：IntersectionObserver ---- */
function setupObserver() {
  if (!sentinel.value) return
  const scrollRoot = props.rootId ? document.getElementById(props.rootId) : document.getElementById('app-main')
  
  observer = new IntersectionObserver(
    ([entry]) => {      
      if (entry.isIntersecting && !props.loading && props.currentPage < props.totalPages) {
        emit('change', props.currentPage + 1)
      }
    },
    {
      root: scrollRoot,
      rootMargin: '0px 0px 500px 0px',
    }
  )
  observer.observe(sentinel.value)
}

function teardownObserver() {
  observer?.disconnect()
  observer = null
}

onMounted(() => {
  if (props.mode === 'scroll') setupObserver()
})
onUnmounted(teardownObserver)

watch(
  () => props.mode,
  async val => {
    teardownObserver()
    if (val === 'scroll') {
      await nextTick()
      setupObserver()
    }
  }
)

// 每次加载完后重建Observer，强制触发一次新的交叉检测 
// 避免了加载完成时，填充完内容后，分页组件还在观测区域范围内，导致不能重新计算交叉关系。
watch(
  () => props.loading,
  async (val) => {
    if (!val && props.mode === 'scroll') {
      teardownObserver()
      await nextTick()
      setupObserver()
    }
  }
)
</script>

<template>
  <div class="pagination">
    <!-- 按钮模式 -->
    <template v-if="mode === 'button'">
      <Loading v-if="loading" />
      <nav v-if="totalPages > 1 && loading === false" class="pager">
        <button class="pg-btn" :disabled="currentPage <= 1" @click="goTo(currentPage - 1)">
          <ChevronLeft style="width: 1.125rem; height: 1.125rem" />
        </button>
        <template v-for="(p, i) in pages" :key="`${i}-${p}`">
          <button v-if="typeof p === 'number'" :class="['pg-num', p === currentPage && 'on']" @click="goTo(p)">
            {{ p }}
          </button>
          <span v-else class="pg-dots">...</span>
        </template>
        <button class="pg-btn" :disabled="currentPage >= totalPages" @click="goTo(currentPage + 1)">
          <ChevronRight style="width: 1.125rem; height: 1.125rem" />
        </button>
      </nav>
    </template>

    <!-- 滚动模式 -->
    <div v-else-if="mode === 'scroll'" ref="sentinel" class="scroll-sentinel">
      <Loading v-if="loading" />
      <span v-else-if="currentPage >= totalPages && totalPages > 1" class="ended">没有更多了</span>
    </div>
  </div>
</template>

<style scoped lang="less">
.pagination {
  min-height: 2rem;
}
/* ---- 按钮分页 ---- */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.pg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.5;
  cursor: pointer;
  transition: all 0.12s;

  &:hover:not(:disabled) {
    opacity: 0.85;
    background: var(--color-base-200);
  }
  &:disabled {
    opacity: 0.15;
    cursor: default;
  }
}

.pg-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-base-content);
  opacity: 0.5;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    opacity: 0.85;
    background: var(--color-base-200);
  }
  &.on {
    opacity: 1;
    background: var(--color-primary);
    color: var(--color-primary-content);
  }
}

.pg-dots {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  font-size: 0.8125rem;
  opacity: 0.3;
  user-select: none;
}

/* ---- 滚动加载 ---- */
.scroll-sentinel {
  display: flex;
  justify-content: center;
  font-size: 0.8125rem;
  color: var(--color-base-content);
}

.ended {
  padding: 2rem 0;
  opacity: 0.35;
}
</style>
