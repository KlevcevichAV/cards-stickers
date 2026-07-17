<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, Upload, Smartphone } from '@lucide/vue'
import { useSettingsStore } from '@/stores/settings'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { exportBackup, downloadBackup, parseBackup, importBackup } from '@/services/backupService'

const { t } = useI18n()
const settings = useSettingsStore()
const { canInstall, install, isIOS, isStandalone } = usePwaInstall()

const importStatus = ref<'idle' | 'success' | 'error'>('idle')
const fileInput = ref<HTMLInputElement | null>(null)

async function handleExport() {
  const backup = await exportBackup()
  downloadBackup(backup)
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleImportFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const backup = parseBackup(text)
    await importBackup(backup)
    importStatus.value = 'success'
  } catch {
    importStatus.value = 'error'
  } finally {
    if (fileInput.value) fileInput.value.value = ''
    setTimeout(() => (importStatus.value = 'idle'), 3000)
  }
}
</script>

<template>
  <div class="settings">
    <h1>{{ t('nav.settings') }}</h1>

    <section class="card">
      <h2>{{ t('settings.language') }}</h2>
      <select v-model="settings.language">
        <option value="system">{{ t('settings.languageSystem') }}</option>
        <option value="en">{{ t('settings.languageEn') }}</option>
        <option value="ru">{{ t('settings.languageRu') }}</option>
      </select>
    </section>

    <section v-if="!isStandalone" class="card">
      <h2>{{ t('settings.install') }}</h2>
      <p class="description">{{ t('settings.installDescription') }}</p>
      <button v-if="canInstall" class="btn primary" @click="install">
        <Smartphone :size="16" /> {{ t('settings.installButton') }}
      </button>
      <p v-else-if="isIOS" class="description">{{ t('settings.iosInstallHint') }}</p>
    </section>

    <section class="card">
      <h2>{{ t('settings.backup') }}</h2>
      <div class="backup-actions">
        <button class="btn secondary" @click="handleExport">
          <Download :size="16" /> {{ t('settings.exportBackup') }}
        </button>
        <button class="btn secondary" @click="triggerImport">
          <Upload :size="16" /> {{ t('settings.importBackup') }}
        </button>
        <input ref="fileInput" type="file" accept="application/json" class="hidden-input" @change="handleImportFile" />
      </div>
      <p v-if="importStatus === 'success'" class="status success">{{ t('settings.importSuccess') }}</p>
      <p v-if="importStatus === 'error'" class="status error">{{ t('settings.importError') }}</p>
    </section>
  </div>
</template>

<style scoped>
.settings {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 26px;
  margin: 0 0 var(--space-4);
}

.card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-3);
}

h2 {
  font-size: 14px;
  margin: 0 0 var(--space-3);
  color: var(--color-text-secondary);
}

select,
input[type='text'] {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-sunken);
}

.description {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3);
}

.backup-actions {
  display: flex;
  gap: var(--space-3);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 13px;
  flex: 1;
}

.btn.primary {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

.btn.secondary {
  background: var(--color-bg-sunken);
}

.hidden-input {
  display: none;
}

.status {
  margin-top: var(--space-2);
  font-size: 12px;
  font-weight: 600;
}

.status.success {
  color: var(--color-success);
}

.status.error {
  color: var(--color-danger);
}
</style>
