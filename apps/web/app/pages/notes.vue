<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  LoaderCircle,
  LocateFixed,
  Minus,
  Move,
  Plus,
} from '@lucide/vue'
import type { NoteItem } from '~/composables/useNoteApi'

type ViewMode = 'canvas' | 'list'

interface Point {
  x: number
  y: number
}

const store = useAppStore()
const noteApi = useNoteApi()
const pageSize = 2

const { data: initialRes, status } = await useAsyncData(
  'notes-spatial-list',
  () => noteApi.getList({ page: 1, pageSize })
)

const notes = ref<NoteItem[]>(initialRes.value?.data?.list ?? [])
const total = ref(initialRes.value?.data?.total ?? 0)
const page = ref(initialRes.value?.data?.page ?? 1)
const loadingMore = ref(false)
const mode = ref<ViewMode>('canvas')
const ready = ref(false)
const focusedIndex = ref(0)
const detailNote = ref<NoteItem | null>(null)
const detailShowsComments = ref(false)
const camera = reactive({ x: 0, y: 0, scale: 1 })
const dragging = ref(false)
const movedDuringDrag = ref(false)
let revealTimer: ReturnType<typeof setTimeout> | undefined

const drag = reactive({
  pointerId: -1,
  cardIndex: -1,
  startX: 0,
  startY: 0,
  cameraX: 0,
  cameraY: 0,
})

const pointers = new Map<number, Point>()
const pinch = reactive({
  distance: 0,
  scale: 1,
  worldX: 0,
  worldY: 0,
})

const hasMore = computed(() => notes.value.length < total.value)
const totalPages = computed(() => Math.ceil(total.value / pageSize))

// 固定螺旋格保证服务端与客户端得到完全一致的坐标，也给不同高度的卡片留出稳定间距。
const positions = computed<Point[]>(() => notes.value.map((_, index) => spiralPoint(index)))

const worldStyle = computed(() => ({
  transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`,
}))

function spiralPoint(index: number): Point {
  if (index === 0) return { x: 0, y: 0 }

  let x = 0
  let y = 0
  let dx = 1
  let dy = 0
  let segmentLength = 1
  let segmentPassed = 0
  let turns = 0

  for (let step = 0; step < index; step += 1) {
    x += dx
    y += dy
    segmentPassed += 1

    if (segmentPassed === segmentLength) {
      segmentPassed = 0
      const nextDx = -dy
      dy = dx
      dx = nextDx
      turns += 1
      if (turns % 2 === 0) segmentLength += 1
    }
  }

  return { x: x * 400, y: y * 460 }
}

function setMode(nextMode: ViewMode) {
  if (mode.value === nextMode) return
  mode.value = nextMode
  if (nextMode === 'canvas') focusNote(focusedIndex.value, false)
}

function focusNote(index: number, animated = true) {
  const point = positions.value[index]
  if (!point) return

  focusedIndex.value = index
  if (!animated) ready.value = false
  camera.x = -point.x * camera.scale
  camera.y = -point.y * camera.scale

  if (!animated) {
    clearTimeout(revealTimer)
    revealTimer = setTimeout(() => { ready.value = true }, 30)
  }

  if (notes.value.length - index <= 4) void loadMore()
}

function focusPrevious() {
  if (focusedIndex.value <= 0) return
  focusNote(focusedIndex.value - 1)
}

async function focusFollowing() {
  const nextIndex = focusedIndex.value + 1
  if (nextIndex < notes.value.length) {
    focusNote(nextIndex)
    return
  }

  await loadMore()
  if (nextIndex < notes.value.length) focusNote(nextIndex)
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  try {
    const response = await noteApi.getList({ page: page.value + 1, pageSize })
    if (!response.success) return

    const existingIds = new Set(notes.value.map(note => note.id))
    const incoming = response.data.list.filter(note => !existingIds.has(note.id))
    notes.value.push(...incoming)
    total.value = response.data.total
    page.value = response.data.page
  } catch {
    // 下一次接近末尾或点击导航时会自然重试。
  } finally {
    loadingMore.value = false
  }
}

function loadMoreAtCanvasEdge(viewport: HTMLElement) {
  if (!hasMore.value || loadingMore.value) return

  const nextPoint = spiralPoint(notes.value.length)
  const rect = viewport.getBoundingClientRect()
  const screenX = nextPoint.x * camera.scale + camera.x
  const screenY = nextPoint.y * camera.scale + camera.y
  const margin = 160

  if (
    Math.abs(screenX) <= rect.width / 2 + margin &&
    Math.abs(screenY) <= rect.height / 2 + margin
  ) {
    void loadMore()
  }
}

function openDetail(note: NoteItem, comments = false) {
  detailNote.value = note
  detailShowsComments.value = comments
}

function closeDetail() {
  detailNote.value = null
  detailShowsComments.value = false
}

function adjustZoom(change: number) {
  camera.scale = Math.min(1.2, Math.max(0.68, Number((camera.scale + change).toFixed(2))))
  focusNote(focusedIndex.value)
}

function clampScale(scale: number) {
  return Math.min(1.2, Math.max(0.68, scale))
}

function startPinch(viewport: HTMLElement) {
  const [first, second] = Array.from(pointers.values())
  if (!first || !second) return

  const rect = viewport.getBoundingClientRect()
  const centerX = (first.x + second.x) / 2 - rect.left - rect.width / 2
  const centerY = (first.y + second.y) / 2 - rect.top - rect.height / 2
  pinch.distance = Math.hypot(second.x - first.x, second.y - first.y)
  pinch.scale = camera.scale
  pinch.worldX = (centerX - camera.x) / camera.scale
  pinch.worldY = (centerY - camera.y) / camera.scale
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return

  const viewport = event.currentTarget as HTMLElement
  viewport.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  drag.pointerId = event.pointerId
  drag.cardIndex = Number((event.target as HTMLElement).closest<HTMLElement>('.canvas-node')?.dataset.nodeIndex ?? -1)
  drag.startX = event.clientX
  drag.startY = event.clientY
  drag.cameraX = camera.x
  drag.cameraY = camera.y
  dragging.value = true
  movedDuringDrag.value = false

  if (pointers.size === 2) startPinch(viewport)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || !pointers.has(event.pointerId)) return

  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (pointers.size >= 2) {
    const viewport = event.currentTarget as HTMLElement
    const [first, second] = Array.from(pointers.values())
    if (!first || !second || !pinch.distance) return

    const rect = viewport.getBoundingClientRect()
    const centerX = (first.x + second.x) / 2 - rect.left - rect.width / 2
    const centerY = (first.y + second.y) / 2 - rect.top - rect.height / 2
    const distance = Math.hypot(second.x - first.x, second.y - first.y)
    const nextScale = clampScale(pinch.scale * distance / pinch.distance)
    camera.scale = nextScale
    camera.x = centerX - pinch.worldX * nextScale
    camera.y = centerY - pinch.worldY * nextScale
    movedDuringDrag.value = true
    loadMoreAtCanvasEdge(viewport)
    return
  }

  if (event.pointerId !== drag.pointerId) return

  const deltaX = event.clientX - drag.startX
  const deltaY = event.clientY - drag.startY
  if (Math.abs(deltaX) + Math.abs(deltaY) > 4) movedDuringDrag.value = true
  camera.x = drag.cameraX + deltaX
  camera.y = drag.cameraY + deltaY
  if (movedDuringDrag.value) loadMoreAtCanvasEdge(event.currentTarget as HTMLElement)
}

function onPointerUp(event: PointerEvent) {
  if (!pointers.has(event.pointerId)) return

  pointers.delete(event.pointerId)
  if (!movedDuringDrag.value && drag.cardIndex >= 0) focusNote(drag.cardIndex)

  const remaining = Array.from(pointers.entries())[0]
  if (remaining) {
    const [pointerId, point] = remaining
    drag.pointerId = pointerId
    drag.cardIndex = -1
    drag.startX = point.x
    drag.startY = point.y
    drag.cameraX = camera.x
    drag.cameraY = camera.y
    movedDuringDrag.value = true
    return
  }

  dragging.value = false
  movedDuringDrag.value = false
  drag.pointerId = -1
  drag.cardIndex = -1
}

function onCardFocus(index: number) {
  if (movedDuringDrag.value) {
    movedDuringDrag.value = false
    return
  }
  focusNote(index)
}

function onWheel(event: WheelEvent) {
  const viewport = event.currentTarget as HTMLElement
  const rect = viewport.getBoundingClientRect()
  const cursorX = event.clientX - rect.left - rect.width / 2
  const cursorY = event.clientY - rect.top - rect.height / 2
  const worldX = (cursorX - camera.x) / camera.scale
  const worldY = (cursorY - camera.y) / camera.scale
  const nextScale = clampScale(camera.scale * Math.exp(-event.deltaY * 0.0012))

  camera.scale = nextScale
  camera.x = cursorX - worldX * nextScale
  camera.y = cursorY - worldY * nextScale
}

onMounted(() => {
  // 后台标签页可能暂停 requestAnimationFrame，短定时器能保证节点最终解除隐藏状态。
  revealTimer = setTimeout(() => { ready.value = true }, 30)
})

onBeforeUnmount(() => clearTimeout(revealTimer))

useHead({ title: computed(() => `说说 - ${store.site.name || '3qrain'}`) })
</script>

<template>
  <section class="notes-page">
    <BaseLoading v-if="status === 'pending'" class="notes-loading" />

    <template v-else-if="notes.length">
      <div class="notes-toolbar page-shell">
        <div class="toolbar-copy">
          <strong>说说</strong>
          <span>{{ total }} 个散落的片刻</span>
        </div>

        <div class="toolbar-actions">
          <div v-if="mode === 'canvas'" class="canvas-tools" aria-label="画布工具">
            <button type="button" title="缩小" aria-label="缩小" @click="adjustZoom(-0.08)">
              <Minus :size="16" :stroke-width="1.7" />
            </button>
            <span>{{ Math.round(camera.scale * 100) }}%</span>
            <button type="button" title="放大" aria-label="放大" @click="adjustZoom(0.08)">
              <Plus :size="16" :stroke-width="1.7" />
            </button>
            <button type="button" title="回到当前说说" aria-label="回到当前说说" @click="focusNote(focusedIndex)">
              <LocateFixed :size="16" :stroke-width="1.7" />
            </button>
          </div>

          <div class="view-switch" aria-label="浏览方式">
            <button
              type="button"
              :class="{ active: mode === 'canvas' }"
              title="画布模式"
              aria-label="画布模式"
              @click="setMode('canvas')"
            >
              <Grid3X3 :size="16" :stroke-width="1.7" />
            </button>
            <button
              type="button"
              :class="{ active: mode === 'list' }"
              title="列表模式"
              aria-label="列表模式"
              @click="setMode('list')"
            >
              <List :size="17" :stroke-width="1.7" />
            </button>
          </div>
        </div>
      </div>

      <Transition name="view" mode="out-in">
        <div
          v-if="mode === 'canvas'"
          key="canvas"
          :class="['canvas-viewport', { ready, dragging }]"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @wheel.prevent="onWheel"
        >
          <div class="canvas-center-glow" aria-hidden="true" />

          <div class="canvas-world" :style="worldStyle">
            <div
              v-for="(note, index) in notes"
              :key="note.id"
              class="canvas-node"
              :data-node-index="index"
              :style="{
                '--node-x': `${positions[index]?.x ?? 0}px`,
                '--node-y': `${positions[index]?.y ?? 0}px`,
                '--node-delay': `${Math.min(index, 12) * 45}ms`,
              }"
            >
              <NoteCard
                :note="note"
                :index="index"
                mode="canvas"
                :active="focusedIndex === index"
                @focus="onCardFocus(index)"
                @detail="openDetail(note)"
                @comments="openDetail(note, true)"
              />
            </div>
          </div>

          <div class="canvas-navigation" aria-label="说说导航">
            <button
              type="button"
              title="上一篇说说"
              aria-label="上一篇说说"
              :disabled="focusedIndex <= 0"
              @click="focusPrevious"
            >
              <ChevronLeft :size="17" :stroke-width="1.8" />
            </button>
            <span>
              <strong>{{ String(focusedIndex + 1).padStart(2, '0') }}</strong>
              / {{ String(total).padStart(2, '0') }}
            </span>
            <button
              type="button"
              title="下一篇说说"
              aria-label="下一篇说说"
              :disabled="loadingMore || (!hasMore && focusedIndex >= notes.length - 1)"
              @click="focusFollowing"
            >
              <LoaderCircle v-if="loadingMore" class="loading-icon" :size="16" :stroke-width="1.8" />
              <ChevronRight v-else :size="17" :stroke-width="1.8" />
            </button>
          </div>

          <div class="canvas-hint">
            <Move :size="14" :stroke-width="1.7" />
            拖动画布探索
          </div>
        </div>

        <div v-else key="list" class="list-view page-shell">
          <TransitionGroup name="list-note" tag="div" class="list-notes" appear>
            <NoteCard
              v-for="(note, index) in notes"
              :key="note.id"
              :note="note"
              :index="index"
              mode="list"
              :style="{ '--list-delay': `${Math.min(index, 10) * 35}ms` }"
              @focus="focusedIndex = index"
              @detail="openDetail(note)"
              @comments="openDetail(note, true)"
            />
          </TransitionGroup>

          <BasePagination
            mode="scroll"
            :current-page="page"
            :total-pages="totalPages"
            :loading="loadingMore"
            @change="loadMore()"
          />
        </div>
      </Transition>

    </template>

    <p v-else class="empty">这里还没有落下新的片刻。</p>

    <BaseModal :open="!!detailNote" @update:open="value => { if (!value) closeDetail() }">
      <NoteDetail
        v-if="detailNote"
        :note="detailNote"
        :show-comments="detailShowsComments"
        @close="closeDetail"
      />
    </BaseModal>
  </section>
</template>

<style scoped lang="less">
.notes-page {
  position: relative;
  min-height: calc(100vh - var(--header-height));
  // padding-top: 1rem;
}

.notes-loading,
.empty {
  min-height: 34rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty {
  color: var(--color-subtle);
  font-size: 0.875rem;
}

.notes-toolbar {
  position: relative;
  z-index: 3;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.toolbar-copy {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;

  strong {
    font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
    font-size: 1.25rem;
    font-weight: 650;
  }

  span {
    overflow: hidden;
    color: var(--color-subtle);
    font-size: 0.6875rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.toolbar-actions,
.canvas-tools,
.view-switch {
  display: flex;
  align-items: center;
}

.toolbar-actions {
  gap: 0.5rem;
}

.canvas-tools,
.view-switch {
  height: 2.25rem;
  padding: 0.1875rem;
  border-radius: 0.375rem;
  background: var(--color-surface-muted);
  backdrop-filter: blur(0.75rem);
}

.canvas-tools span {
  width: 2.75rem;
  color: var(--color-subtle);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.toolbar-actions button {
  width: 1.875rem;
  height: 1.875rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.42;
  cursor: pointer;
  transition: color 0.18s ease, opacity 0.18s ease, background-color 0.18s ease;

  &:hover,
  &.active {
    background: var(--color-base-100);
    color: var(--color-primary);
    opacity: 1;
  }
}

.canvas-viewport {
  position: relative;
  height: max(38rem, calc(100vh - var(--header-height) - 5.5rem));
  overflow: hidden;
  touch-action: none;
  cursor: grab;
  user-select: none;
  background-image: radial-gradient(circle, var(--color-border) 0.75px, transparent 0.75px);
  background-size: 1.5rem 1.5rem;
  mask-image: linear-gradient(to bottom, transparent, #000 2.5rem calc(100% - 2.5rem), transparent);

  &.dragging {
    cursor: grabbing;
  }
}

.canvas-world {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  transform-origin: 0 0;
  transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.dragging .canvas-world {
  transition: none;
}

.canvas-node {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(0.88);
  opacity: 0;
  transition:
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) var(--node-delay),
    opacity 0.4s ease var(--node-delay);
  will-change: transform;
}

.ready .canvas-node {
  transform: translate(-50%, -50%) translate3d(var(--node-x), var(--node-y), 0) scale(1);
  opacity: 1;
}

.canvas-center-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8rem;
  height: 8rem;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--color-primary) 18%, transparent) 0%,
    color-mix(in oklab, var(--color-primary) 8%, transparent) 38%,
    transparent 72%
  );
  filter: blur(0.625rem);
  pointer-events: none;
}

.canvas-hint {
  position: absolute;
  left: 1.5rem;
  bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-subtle);
  font-size: 0.6875rem;
  pointer-events: none;
}

.canvas-navigation {
  position: absolute;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  height: 2.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 2rem;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(1rem);

  button {
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--color-base-content);
    opacity: 0.52;
    cursor: pointer;
    transition: color 0.18s ease, opacity 0.18s ease, background-color 0.18s ease;

    &:hover:not(:disabled) {
      background: var(--color-base-200);
      color: var(--color-primary);
      opacity: 1;
    }

    &:disabled {
      opacity: 0.16;
      cursor: default;
    }
  }

  span {
    min-width: 3.75rem;
    color: var(--color-subtle);
    font-size: 0.625rem;
    font-variant-numeric: tabular-nums;
    text-align: center;

    strong {
      color: var(--color-base-content);
      font-size: 0.75rem;
    }
  }
}

.loading-icon {
  animation: spin 0.8s linear infinite;
}

.list-view {
  width: min(46rem, calc(100vw - 2rem));
  padding: 1rem 0 5rem;
}

.list-notes {
  position: relative;
}

.list-note-enter-active {
  transition:
    opacity 0.45s ease var(--list-delay),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) var(--list-delay);
}

.list-note-enter-from {
  opacity: 0;
  transform: translateY(1.25rem);
}

.view-enter-active,
.view-leave-active {
  transition: opacity 0.22s ease, transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.view-enter-from {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.99);
}

.view-leave-to {
  opacity: 0;
  transform: translateY(-0.375rem) scale(0.995);
}

@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}

@media (max-width: 768px) {
  .notes-page {
    padding-top: 0.5rem;
  }

  .notes-toolbar {
    height: 3.25rem;
  }

  .toolbar-copy span,
  .canvas-tools span {
    display: none;
  }

  .canvas-viewport {
    height: max(34rem, calc(100vh - var(--header-height) - 4.25rem));
    background-size: 1.25rem 1.25rem;
  }

  .canvas-tools {
    display: none;
  }

  .canvas-hint {
    display: none;
  }
}
</style>
