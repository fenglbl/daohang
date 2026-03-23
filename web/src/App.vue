<template>
  <main class="page-body">
    <div v-if="$route.name !== 'home'" class="page-logo" @click="$router.push('/')">
      <div class="page-logo-icon">导</div>
      <span>{{ t('app.logo') }}</span>
    </div>
    <router-view />

    <div class="toast-stack">
      <div v-for="item in store.notices" :key="item.id" class="toast-item" :class="`toast-${item.type}`">
        <span>{{ item.message }}</span>
        <button class="toast-close" @click="store.removeNotice(item.id)">×</button>
      </div>
    </div>

    <div v-if="store.confirmDialog.visible" class="modal-mask" @click.self="store.resolveConfirm(false)">
      <div class="modal-card modal-card-confirm">
        <div class="modal-head">
          <h3>{{ store.confirmDialog.title }}</h3>
        </div>
        <p class="confirm-message">{{ store.confirmDialog.message }}</p>
        <div class="modal-actions">
          <button class="mini-btn" @click="store.resolveConfirm(false)">{{ store.confirmDialog.cancelText }}</button>
          <button class="primary-btn" :class="{ 'danger-solid-btn': store.confirmDialog.type === 'danger' }" @click="store.resolveConfirm(true)">{{ store.confirmDialog.confirmText }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore } from './stores/app'
import { useI18n } from './i18n'

const store = useAppStore()
const { t } = useI18n()

onMounted(() => {
  store.applyTheme()
})
</script>
