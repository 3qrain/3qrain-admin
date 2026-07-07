<script setup lang="ts">
import { ref } from 'vue'
import FriendLinkList from './components/FriendLinkList.vue'
import FriendLinkDetail from './components/FriendLinkDetail.vue'
import BaseModal from '~/components/base/Modal.vue'
import type { FriendLink } from '~/api/friend-links/types'

const selectedItem = ref<FriendLink | null>(null)
const showModal = ref(false)

function handleSelect(item: FriendLink | null) {
  selectedItem.value = item
  if (item && window.innerWidth <= 768) showModal.value = true
}

function handleUpdate(item: FriendLink) {
  selectedItem.value = item
}

function handleDelete() {
  selectedItem.value = null
}
</script>

<template>
  <div class="page">
    <div class="left">
      <FriendLinkList @select="handleSelect" />
    </div>
    <div class="right">
      <FriendLinkDetail
        :item="selectedItem"
        @update="handleUpdate"
        @delete="handleDelete"
      />
    </div>

    <BaseModal v-model:open="showModal">
      <div class="modal-card">
        <FriendLinkDetail
          :item="selectedItem"
          @update="handleUpdate"
          @delete="handleDelete"
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
  border-radius: .75rem;
  width: min(32rem, calc(100vw - 2rem));
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

@media (width <= 64rem) {
  .list-panel {
    border-right: none;
  }
  .left { width: 100%; }
  .right { display: none; }
}
</style>
