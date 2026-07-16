<script setup lang="ts">
import { formatDate } from '~/utils/date'
import { AtSign } from '@lucide/vue'

const props = defineProps<{ targetType: string; targetId: number }>()

const commentApi = useCommentApi()
const store = useAppStore()

const comments = ref<any[]>([])
const total = ref(0)
const loading = ref(true)
const t = ref(String(Date.now()))
const page = ref(1)

const showReply = reactive(new Set<number>())

function toggleReply(id: number) {
  if (showReply.has(id)) showReply.delete(id)
  else showReply.add(id)
}

const parentTotal = ref(0)
const totalPages = computed(() => Math.ceil(parentTotal.value / 10))

async function load(append = false) {
  loading.value = true
  try {
    const res = await commentApi.getList(props.targetType, props.targetId, page.value, t.value)
    if (res.success) {
      comments.value = append ? [...comments.value, ...res.data.list] : res.data.list
      total.value = res.data.total
      parentTotal.value = res.data.parentTotal
    }
  } catch {
    /* ignore */
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="section">
    <ClientOnly>
      <CommentComposer
        :target-type="targetType"
        :target-id="targetId"
        @done="
          () => {
            t = String(Date.now())
            page = 1
            load()
          }
        "
      />
    </ClientOnly>

    <template v-if="comments.length">
      <h3 class="title">
        评论 <span v-if="total" class="count">{{ total }}</span>
      </h3>
      <div v-for="c in comments" :key="c.id" class="thread">
        <div class="comment parent">
          <img :src="c.user.avatarUrl" alt="" class="avatar" />
          <div class="comment-body">
            <div class="meta">
              <span class="name">{{ c.user.username }}</span>
              <time>{{ formatDate(c.createdAt) }}</time>
              <span v-if="c.isPinned" class="pin">置顶</span>
            </div>
            <p class="text">{{ c.content }}</p>
            <div class="act-group">
              <button v-if="store.user" class="act" @click="toggleReply(c.id)">回复</button>
            </div>
            <CommentComposer
              v-show="showReply.has(c.id)"
              :target-type="targetType"
              :target-id="targetId"
              :reply-to="{ id: c.id, userId: c.userId, username: c.user.username, replyToId: undefined }"
              @cancel="showReply.delete(c.id)"
              @done="
                () => {
                  showReply.delete(c.id)
                  t = String(Date.now())
                  page = 1
                  load()
                }
              "
            />
          </div>
        </div>

        <div v-if="c.replies?.length" class="replies">
          <div v-for="r in c.replies" :key="r.id" class="comment sub">
            <img :src="r.user.avatarUrl" alt="" class="avatar" />
            <div class="comment-body">
              <div class="meta">
                <span class="name">{{ r.user.username }}</span>
                <template v-if="r.replyToId && r.replyToUser">
                  <span class="re"><AtSign style="width: 0.8125rem; height: 0.8125rem" stroke-width="2" /></span>
                  <span class="name">{{ r.replyToUser.username }}</span>
                </template>
                <time>{{ formatDate(r.createdAt) }}</time>
              </div>
              <p class="text">{{ r.content }}</p>
              <div class="act-group">
                <button v-if="store.user" class="act" @click="toggleReply(r.id)">回复</button>
              </div>

              <CommentComposer
                v-show="showReply.has(r.id)"
                :target-type="targetType"
                :target-id="targetId"
                :reply-to="{ id: c.id, userId: r.userId, username: r.user.username, replyToId: r.id }"
                @cancel="showReply.delete(r.id)"
                @done="
                  () => {
                    showReply.delete(r.id)
                    t = String(Date.now())
                    page = 1
                    load()
                  }
                "
              />
            </div>
          </div>
        </div>
      </div>

      <BasePagination
        mode="scroll"
        :current-page="page"
        :total-pages="totalPages"
        :loading="loading"
        @change="
          p => {
            page = p
            load(true)
          }
        "
      />
    </template>

    <p v-else-if="!loading" class="empty">还没有评论，来发表第一条吧</p>
    <BaseLoading v-else />
  </div>
</template>

<style scoped lang="less">
.section {
  max-width: 48rem;
  margin: 3rem auto 0;
  padding-top: 2rem;
}

.empty {
  padding: 3rem 0;
  text-align: center;
  font-size: 0.875rem;
  opacity: 0.35;
}
.thread {
  display: flex;
  flex-direction: column;
  // padding: 1rem 0;
  margin: 1rem 0;
}
.title {
  margin-top: 1.25rem;
  font-size: 1.125rem;
  font-weight: 600;
  .count {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-primary);
    background: color-mix(in oklab, var(--color-primary) 12%, transparent);
    padding: 0.2rem 0.4375rem;
    border-radius: 0.25rem;
    line-height: 1.25rem;
    vertical-align: middle;
    margin-left: 0.375rem;
  }
}
.comment {
  display: flex;
  gap: 0.75rem;
  &.sub {
    margin-top: 0.625rem;
    .avatar {
      width: 1.5rem;
      height: 1.5rem;
    }
  }
}
.avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.comment-body {
  flex: 1;
  min-width: 0;
}
.meta {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 0.125rem;
}
.name {
  font-weight: 600;
}
.pin {
  position: absolute;
  right: 0;
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--color-primary);
}
.re {
  display: flex;
  align-items: center;
  opacity: 0.8;
  font-weight: 400;
}
time {
  font-size: 0.625rem;
  opacity: 0.35;
}
.text {
  padding: 0.25rem 0;
  font-size: 0.875rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
.act-group {
  display: flex;
  height: 1.5rem;
  .act {
    border: none;
    background: transparent;
    font-size: 0.75rem;
    color: var(--color-base-content);
    opacity: 0.25;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.15s;
    &:hover {
      opacity: 0.5;
    }
  }
}
.replies {
  margin-top: 0.375rem;
  margin-left: 2rem;
}
</style>
