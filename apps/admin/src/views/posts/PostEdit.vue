<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { getPost, createPost, updatePost } from '~/api/posts'
import { getCategories } from '~/api/categories'
import { getTags } from '~/api/tags'
import PostEditorStatusBar from './components/editor/PostEditorStatusBar.vue'
import PostEditorContent from './components/editor/PostEditorContent.vue'
import PostEditorSettings from './components/editor/PostEditorSettings.vue'
import type { Category } from '~/api/categories/types'
import type { Tag } from '~/api/tags/types'

const route = useRoute()
const router = useRouter()

const postId = ref(Number(route.params.id) || 0)
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const showSettings = ref(false)
const isDirty = ref(false)
const saving = ref(false)
// 编辑已有文章时先显示加载中，创建新文章直接显示编辑界面
const ready = ref(Number(route.params.id) ? false : true)

const title = ref('')
const slug = ref('')
const summary = ref('')
const cover = ref('')
const contentEditorRef = ref<InstanceType<typeof PostEditorContent> | null>(null)
const initialContent = ref<object>({ type: 'doc', content: [] })
const status = ref<'draft' | 'published' | 'archived'>('draft')
const isPinned = ref(false)
const categoryId = ref(0)
const tagIds = ref<number[]>([])

let saveTimer: ReturnType<typeof setTimeout> | null = null

async function loadData() {
  const [cats, tagList] = await Promise.all([getCategories(), getTags()])
  categories.value = cats
  tags.value = tagList

  if (postId.value) {
    try {
      const post = await getPost(postId.value)

      initialContent.value = post.content
      title.value = post.title
      slug.value = post.slug
      summary.value = post.summary
      cover.value = post.cover
      status.value = post.status as 'draft' | 'published' | 'archived'
      isPinned.value = post.isPinned === true || (post.isPinned as unknown as number) === 1
      categoryId.value = post.categoryId
      tagIds.value = post.tags?.map((t: Tag) => t.id) || []

      ready.value = true
    } catch {
      toast.error('文章不存在')
      router.push('/posts')
    }
  }
}

function buildForm() {
  const c = contentEditorRef.value?.getContent() || {
    json: {},
    html: '',
    text: ''
  }
  return {
    title: title.value,
    slug: slug.value,
    summary: summary.value,
    cover: cover.value,
    content: c.json,
    contentHtml: c.html,
    contentText: c.text,
    status: status.value,
    isPinned: isPinned.value,
    categoryId: categoryId.value,
    tagIds: tagIds.value
  }
}

async function doSave(asStatus?: string, silent = false, successMsg?: string): Promise<boolean> {
  if (saving.value) return false
  // 发布/归档时前端先校验
  if (asStatus && asStatus !== 'draft') {
    if (!title.value || !slug.value || !categoryId.value) {
      if(!silent) toast.error('发布/归档时标题、标识和分类为必填')
      return false
    }
  }
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  const prevStatus = status.value
  saving.value = true
  try {
    if (postId.value) {
      if (asStatus) status.value = asStatus as 'draft' | 'published' | 'archived'
      await updatePost(postId.value, buildForm())
    } else {
      status.value = (asStatus || 'draft') as 'draft' | 'published' | 'archived'
      const created = await createPost(buildForm())
      postId.value = created.id
      router.replace({ name: 'postEdit', params: { id: String(created.id) } })
    }
    isDirty.value = false
    if (successMsg) toast.success(successMsg)
    return true
  } catch (e: any) {
    if (asStatus) status.value = prevStatus
    if (!silent) toast.error(e?.response?.data?.message || '保存失败')
    return false
  } finally {
    saving.value = false
  }
}

function scheduleAutoSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (isDirty.value) doSave(status.value, true)
  }, 2000)
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    // 暂时调整为，当前什么状态，保存后还为什么状态
    // 草稿行为，等未来加文章版本控制了再做
    doSave(status.value)
  }
}
async function publish() {
  await doSave('published', false, '已发布')
}

async function archive() {
  await doSave('archived', false, '已归档')
}

onMounted(() => {
  loadData().then(() => {
    watch(
      [title, slug, summary, cover, status, isPinned, categoryId, tagIds],
      () => {
        if (!isDirty.value) isDirty.value = true
        scheduleAutoSave()
      },
      { deep: true }
    )
  })
  window.addEventListener('keydown', onKeydown)
  if (window.innerWidth > 1024) {
    showSettings.value = true
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (saveTimer) clearTimeout(saveTimer)
})
</script>

<template>
  <div class="editor">
    <div v-if="!ready && postId !== 0" class="loading">加载中...</div>
    <template v-else>
      <!-- 左侧 -->
      <div class="main">
        <PostEditorStatusBar
          :settings-open="showSettings"
          :saving="saving"
          :is-dirty="isDirty"
          :is-new="postId === 0"
          :is-draft="status === 'draft'"
          :is-published="status === 'published'"
          :is-archived="status === 'archived'"
          @toggle-settings="showSettings = !showSettings"
          @publish="publish"
          @archive="archive"
        />
        <PostEditorContent
          ref="contentEditorRef"
          v-model:title="title"
          :initial-content="initialContent"
          @dirty="
            () => {
              isDirty = true
              scheduleAutoSave()
            }
          "
        />
      </div>

      <!-- 宽屏：内联侧栏 -->
      <div class="sidebar-wrap" :style="{ width: showSettings ? '17.5rem' : '0' }">
        <PostEditorSettings
          v-model:slug="slug"
          v-model:summary="summary"
          v-model:cover="cover"
          v-model:is-pinned="isPinned"
          v-model:category-id="categoryId"
          v-model:tag-ids="tagIds"
          :categories="categories"
          :tags="tags"
          @change="scheduleAutoSave()"
        />
      </div>

      <!-- 窄屏：浮层 -->
      <Teleport to="body">
        <Transition name="overlay">
          <div v-if="showSettings" class="overlay-bg" @click.self="showSettings = false">
            <aside class="overlay-panel">
              <PostEditorSettings
                v-model:slug="slug"
                v-model:summary="summary"
                v-model:cover="cover"
                v-model:is-pinned="isPinned"
                v-model:category-id="categoryId"
                v-model:tag-ids="tagIds"
                :categories="categories"
                :tags="tags"
                @change="scheduleAutoSave()"
              />
            </aside>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>

<style scoped lang="less">
.editor {
  display: flex;
  height: 100%;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 宽屏内联侧栏 */
.sidebar-wrap {
  display: none;
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (width >= 64rem) {
  .sidebar-wrap {
    display: block;
  }
}

/* 窄屏浮层（< 64rem 时 sidebar-wrap 不显示，用浮层） */
.overlay-bg {
  display: none;
  @media (width < 64rem) {
    display: flex;
    justify-content: flex-end;
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgb(0 0 0 / 0.25);
    backdrop-filter: blur(.125rem);
  }
}

.overlay-panel {
  height: 100%;
  background: var(--color-base-100);
}

/* 浮层动画 */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;

  .overlay-panel {
    transition: transform 0.22s ease;
  }
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;

  .overlay-panel {
    transform: translateX(100%);
  }
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  font-size: .875rem;
  color: var(--color-base-content);
  opacity: 0.4;
}
</style>
