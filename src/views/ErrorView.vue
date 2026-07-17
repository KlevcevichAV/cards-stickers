<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ message?: string }>()

const resetting = ref(false)

function reload() {
  window.location.reload()
}

function resetAppData() {
  resetting.value = true
  const request = indexedDB.deleteDatabase('StickerTrackerDB')
  request.onsuccess = reload
  request.onerror = reload
  request.onblocked = reload
}
</script>

<template>
  <div class="error-view">
    <h1>Something went wrong</h1>
    <p>The local database could not be opened. Your data may still be intact — try reloading first.</p>
    <pre v-if="message">{{ message }}</pre>
    <div class="actions">
      <button class="btn" @click="reload">Reload</button>
      <button class="btn danger" :disabled="resetting" @click="resetAppData">
        {{ resetting ? 'Resetting…' : 'Reset app data' }}
      </button>
    </div>
    <p class="hint">"Reset app data" permanently deletes everything stored in this browser and starts fresh.</p>
  </div>
</template>

<style scoped>
.error-view {
  padding: var(--space-5);
  max-width: 640px;
  margin: 0 auto;
}

h1 {
  color: var(--color-danger);
}

pre {
  white-space: pre-wrap;
  background: var(--color-bg-sunken);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: 12px;
}

.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.btn {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  background: var(--color-bg-sunken);
}

.btn.danger {
  background: var(--color-danger);
  color: #fff;
}

.hint {
  margin-top: var(--space-3);
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
