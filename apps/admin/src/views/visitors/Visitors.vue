<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { BadgeCheck, Ban } from '@lucide/vue'
import { getVisitors, updateVisitor } from '~/api/visitors'
import type { Visitor } from '~/api/visitors/types'

const list = ref<Visitor[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try { list.value = await getVisitors() }
  catch { toast.error('加载失败') }
  finally { loading.value = false }
}

async function toggleAdmin(v: Visitor) {
  const newRole = v.role === 'admin' ? 'visitor' : 'admin'
  try {
    const updated = await updateVisitor(v.id, { role: newRole })
    Object.assign(v, updated)
    toast.success(newRole === 'admin' ? '已设为管理员' : '已取消管理员')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

async function toggleBan(v: Visitor) {
  try {
    const updated = await updateVisitor(v.id, { isBanned: !v.isBanned })
    Object.assign(v, updated)
    toast.success(updated.isBanned ? '已封禁' : '已解封')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>访客</h1>
        <span class="sub">{{ list.length }} 个用户</span>
      </div>
    </div>

    <div v-if="loading" class="empty">加载中...</div>
    <div v-else-if="list.length === 0" class="empty">暂无访客</div>
    <div v-else class="list">
      <div v-for="v in list" :key="v.id" class="row">
        <img :src="v.avatarUrl || ''" alt="" class="avatar" />
        <div class="info">
          <span class="name">{{ v.username }}<span class="uid">#{{  v.id  }}</span></span>
          <span class="email">{{ v.email }}</span>
        </div>
        <span class="badge" :class="v.provider">{{ v.provider }}</span>
        <div class="actions">
          <button
            :class="['toggle', v.role === 'admin' && 'on']"
            :title="v.role === 'admin' ? '取消管理员' : '设为管理员'"
            @click="toggleAdmin(v)"
          >
            <BadgeCheck style="width: 0.875rem; height: 0.875rem;" />
          </button>
          <button
            :class="['toggle danger', v.isBanned && 'on']"
            :title="v.isBanned ? '解封' : '封禁'"
            @click="toggleBan(v)"
          >
            <Ban style="width: 0.875rem; height: 0.875rem;" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.page {
  max-width: 42rem;
  // padding: 1.75rem 2rem;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;

  h1 { font-size: 1.25rem; font-weight: 700; margin: 0; }
}

.sub {
  font-size: 0.75rem;
  opacity: 0.35;
  display: block;
  margin-top: 0.125rem;
}

.list {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  transition: background 0.1s;

  &:hover { background: var(--color-base-200); }
}

.avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--color-base-200);
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
}

.name {
  font-size: 0.8125rem;
  font-weight: 500;
  .uid {
    font-size: 0.625rem;
    opacity: 0.35;
    font-weight: 400;
    margin-left: 0.125rem;
  }
}

.email {
  font-size: 0.6875rem;
  opacity: 0.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.025rem;

  &.github {
    background: var(--color-base-300);
    opacity: 0.6;
  }

  &.google {
    background: var(--color-base-300);
    opacity: 0.6;
  }
}

.actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-base-content);
  opacity: 0.2;
  cursor: pointer;
  transition: all 0.12s;

  &:hover { opacity: 0.5; }

  &.on {
    opacity: 1;
    color: var(--color-success);
    background: var(--color-base-200);
  }

  &.danger.on {
    color: var(--color-error);
  }
}

.empty {
  text-align: center;
  padding: 3rem 0;
  font-size: 0.875rem;
  opacity: 0.3;
}

@media (max-width: 48rem) {
  // .page { padding: 1.25rem 1rem; }
  .email { display: none; }
}
</style>
