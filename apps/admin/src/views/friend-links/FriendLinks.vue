<script setup lang="ts">
import { ref } from 'vue'
import FriendLinkList from './components/FriendLinkList.vue'
import FriendLinkDetail from './components/FriendLinkDetail.vue'
import BaseModal from '~/components/base/Modal.vue'
import type { FriendLink } from '~/api/friend-links/types'

const listRef = ref<InstanceType<typeof FriendLinkList>>()
const selectedItem = ref<FriendLink | null>(null)
const showModal = ref(false)

function handleSelect(item: FriendLink | null) {
  selectedItem.value = item
  if (item && window.innerWidth <= 1024) showModal.value = true
}

const approving = ref(false)
async function handleApprove() {
  if (!selectedItem.value) return
  approving.value = true
  try {
    await listRef.value?.handleApprove(selectedItem.value)
  } finally {
    approving.value = false
  }
}

const rejecting = ref(false)
async function handleReject(rejectReason: string) {
  if (!selectedItem.value) return
  rejecting.value = true
  try {
    await listRef.value?.handleReject(selectedItem.value, rejectReason)
  } finally {
    rejecting.value = false
  }
}

const deleting = ref(false)
async function handleDelete() {
  if (!selectedItem.value) return
  deleting.value = true
  try {
    await listRef.value?.handleDelete(selectedItem.value)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="left">
      <FriendLinkList ref="listRef" @select="handleSelect" />
    </div>
    <div class="right">
      <FriendLinkDetail
        v-model:selectedItem="selectedItem"
        :approving="approving"
        :rejecting="rejecting"
        :deleting="deleting"
        @delete="handleDelete"
        @reject="handleReject"
        @approve="handleApprove"
      />
    </div>

    <BaseModal v-model:open="showModal">
      <div class="modal-card">
        <FriendLinkDetail
          v-model:selectedItem="selectedItem"
          :approving="approving"
          :rejecting="rejecting"
          :deleting="deleting"
          @delete="handleDelete"
          @reject="handleReject"
          @approve="handleApprove"
        />
      </div>
    </BaseModal>
  </div>
</template>

<style scoped lang="less">
.page {
  display: flex;
  height: 100%;
}

.left {
  width: 22rem;
  flex-shrink: 0;
}

.right {
  flex: 1;
  min-width: 0;
}

.modal-card {
  background: var(--color-base-200);
  border-radius: 0.75rem;
  width: min(32rem, calc(100vw - 2rem));
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

@media (width <= 1024px) {
  .list-panel {
    border-right: none;
  }
  .left {
    width: 100%;
  }
  .right {
    display: none;
  }
}
</style>
