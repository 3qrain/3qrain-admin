<script setup lang="ts">
import { ref } from 'vue'
import NotificationList from './components/NotificationList.vue'
import NotificationDetail from './components/NotificationDetail.vue'
import BaseModal from '~/components/base/Modal.vue'
import type { NotificationItem } from '~/api/notifications/types'

const selectedItem = ref<NotificationItem | null>(null)
const showModal = ref(false)

function handleSelect(item: NotificationItem | null) {
  selectedItem.value = item
  if (window.innerWidth <= 1024) {
    showModal.value = true
  }
}
</script>

<template>
  <div class="page">
    <div class="left">
      <NotificationList @select="handleSelect" />
    </div>
    <div class="right">
      <NotificationDetail :item="selectedItem" />
    </div>

    <BaseModal v-model:open="showModal">
      <div class="modal-card">
        <NotificationDetail :item="selectedItem" />
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
  padding: 1.25rem 2rem;
  height: 100%;
  overflow-y: auto;
}

.modal-card {
  padding: 1.25rem 2rem;
  background: var(--color-base-200);
  // max-width: 40rem;
  width: min(calc(100vw - 2rem), 40rem);
}

@media (width <= 1024px) {
  .list-panel {
    border-right: none;
  }
  .left { width: 100%; }
  .right { display: none; }
}
</style>
