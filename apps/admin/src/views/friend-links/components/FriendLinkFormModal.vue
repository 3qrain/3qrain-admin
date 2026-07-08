<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import Input from '~/components/base/Input.vue'
import Button from '~/components/base/Button.vue'
import BaseModal from '~/components/base/Modal.vue'
import { createFriendLink, updateFriendLink } from '~/api/friend-links'
import type { FriendLink, CreateFriendLinkInput } from '~/api/friend-links/types'

const editItem = defineModel<FriendLink | null>('editItem')

const emit = defineEmits<{
  saved: [item?: FriendLink]
}>()

const open = defineModel<boolean>('open', { default: false })
const form = ref<CreateFriendLinkInput>({ siteName: '', siteUrl: '', avatarUrl: '', description: '' })
const saving = ref(false)

watch(open, v => {
  if (v && editItem.value) {
    form.value = {
      siteName: editItem.value.siteName,
      siteUrl: editItem.value.siteUrl,
      avatarUrl: editItem.value.avatarUrl || '',
      description: editItem.value.description || ''
    }
  } else if (v) {
    form.value = { siteName: '', siteUrl: '', avatarUrl: '', description: '' }
  }
})

async function handleSubmit() {
  if (!form.value.siteName || !form.value.siteUrl) return
  saving.value = true
  try {
    if (editItem.value) {
      await updateFriendLink(editItem.value.id, form.value)
      for (const key in form.value) {
        const k = key as keyof CreateFriendLinkInput
        editItem.value[k] = form.value[k] || ''
      }
      toast.success('已保存')
    } else {
      await createFriendLink(form.value)
      toast.success('添加成功')
      emit('saved')
    }
    open.value = false
  } catch (e: any) {
    toast.error(e?.response?.data?.message || '操作失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal v-model:open="open">
    <div class="card">
      <h3 class="title">{{ editItem ? '编辑友链' : '添加友链' }}</h3>
      <div class="form">
        <Input v-model="form.siteName" placeholder="站点名称" />
        <Input v-model="form.siteUrl" placeholder="站点 URL" />
        <Input v-model="form.avatarUrl" placeholder="头像链接（可选）" />
        <Input v-model="form.description" placeholder="简介（可选）" />
      </div>
      <div class="actions">
        <Button variant="ghost" @click="open = false">取消</Button>
        <Button :loading="saving" @click="handleSubmit">{{ editItem ? '保存' : '添加' }}</Button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped lang="less">
.card {
  background: var(--color-base-200);
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 20rem;
}

.title {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
