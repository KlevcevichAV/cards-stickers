<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, Upload, Smartphone, PartyPopper, ClipboardPaste, Link2, Trash2 } from '@lucide/vue'
import { useSettingsStore, STORAGE_PREFIX } from '@/stores/settings'
import { useAlbumStore } from '@/stores/album'
import { useAchievementsStore } from '@/stores/achievements'
import { useExchangesStore } from '@/stores/exchanges'
import { useFinanceStore } from '@/stores/finance'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { useLastStickerImport } from '@/composables/useLastStickerImport'
import { useTradeListImport } from '@/composables/useTradeListImport'
import { exportBackup, downloadBackup, parseBackup, importBackup } from '@/services/backupService'
import { db } from '@/db/database'

const { t } = useI18n()
const settings = useSettingsStore()
const album = useAlbumStore()
const { canInstall, install, isIOS, isStandalone } = usePwaInstall()

const importStatus = ref<'idle' | 'success' | 'error'>('idle')
const fileInput = ref<HTMLInputElement | null>(null)

const collectionStatus = ref<'idle' | 'success'>('idle')
const collectedCount = ref(0)

async function handleMarkCollectionComplete() {
  if (!window.confirm(t('settings.collectionCompleteConfirm'))) return
  collectedCount.value = await album.markAllCollected()
  collectionStatus.value = 'success'
  setTimeout(() => (collectionStatus.value = 'idle'), 4000)
}

const {
  text: importCollectionText,
  status: importCollectionStatus,
  result: importCollectionResult,
  parsed: parsedImportCollection,
  canApply: canApplyImportCollection,
  submit: handleImportCollection,
} = useTradeListImport(t)

// Its own independent flow: fetch + apply happen together in one click, with no
// intermediate "need"/"have" text shown — that manual path (above) is a separate option.
const {
  url: lastStickerUrl,
  status: lastStickerStatus,
  result: lastStickerResult,
  submit: handleTransferFromLastSticker,
} = useLastStickerImport(t)

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
    // The relevant stores were already loaded into memory at app boot (see
    // AppShell.vue) and their `load()` is a no-op once `loaded` is set, so
    // without forcing a re-read here every screen would keep showing the
    // pre-import data until a full page reload.
    await Promise.all([
      album.load(true),
      useAchievementsStore().load(true),
      useExchangesStore().load(true),
      useFinanceStore().load(true),
    ])
    importStatus.value = 'success'
  } catch {
    importStatus.value = 'error'
  } finally {
    if (fileInput.value) fileInput.value.value = ''
    setTimeout(() => (importStatus.value = 'idle'), 3000)
  }
}

async function handleResetApp() {
  if (!window.confirm(t('settings.resetConfirm'))) return

  // Wipe the whole Dexie database (album, achievements, exchanges, finances) and every
  // localStorage key this app owns (settings, language, the onboarding-seen flag), then
  // reload — main.ts's bootstrap() re-seeds from scratch on the next boot, so this is a
  // true "as if freshly installed" reset rather than resetting each store by hand.
  await db.delete()
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key)
  }
  window.location.reload()
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

    <section class="card">
      <h2>{{ t('settings.collectionComplete') }}</h2>
      <p class="description">{{ t('settings.collectionCompleteDescription') }}</p>
      <button class="btn warning" @click="handleMarkCollectionComplete">
        <PartyPopper :size="16" /> {{ t('settings.collectionCompleteButton') }}
      </button>
      <p v-if="collectionStatus === 'success'" class="status success">
        {{ t('settings.collectionCompleteSuccess', { count: collectedCount }) }}
      </p>
    </section>

    <section class="card">
      <h2>{{ t('settings.lastStickerTitle') }}</h2>
      <p class="description">{{ t('settings.lastStickerDescription') }}</p>
      <div class="last-sticker-row">
        <input
          v-model="lastStickerUrl"
          type="text"
          :placeholder="t('settings.lastStickerPlaceholder')"
          @keyup.enter="handleTransferFromLastSticker"
        />
      </div>
      <button
        class="btn warning"
        :disabled="!lastStickerUrl.trim() || lastStickerStatus === 'loading'"
        @click="handleTransferFromLastSticker"
      >
        <Link2 :size="16" />
        {{ lastStickerStatus === 'loading' ? t('settings.lastStickerFetching') : t('settings.lastStickerButton') }}
      </button>
      <p v-if="lastStickerStatus === 'error'" class="status error">{{ t('settings.lastStickerError') }}</p>
      <p v-if="lastStickerStatus === 'success'" class="status success">
        {{
          t('settings.importCollectionSuccess', {
            pasted: lastStickerResult.pasted,
            duplicates: lastStickerResult.duplicates,
            missing: lastStickerResult.missing,
          })
        }}
      </p>
    </section>

    <section class="card">
      <h2>{{ t('settings.importCollection') }}</h2>
      <p class="description">{{ t('settings.importCollectionDescription') }}</p>
      <textarea
        v-model="importCollectionText"
        class="import-textarea"
        rows="6"
        :placeholder="t('settings.importCollectionPlaceholder')"
      />
      <p v-if="importCollectionText.trim()" class="parsed-summary">
        {{
          t('settings.importCollectionParsed', {
            need: parsedImportCollection.need.length,
            have: parsedImportCollection.have.length,
          })
        }}
      </p>
      <button class="btn warning" :disabled="!canApplyImportCollection" @click="handleImportCollection">
        <ClipboardPaste :size="16" /> {{ t('settings.importCollectionButton') }}
      </button>
      <p v-if="importCollectionStatus === 'success'" class="status success">
        {{
          t('settings.importCollectionSuccess', {
            pasted: importCollectionResult.pasted,
            duplicates: importCollectionResult.duplicates,
            missing: importCollectionResult.missing,
          })
        }}
      </p>
    </section>

    <section class="card">
      <h2>{{ t('settings.resetTitle') }}</h2>
      <p class="description">{{ t('settings.resetDescription') }}</p>
      <button class="btn danger" @click="handleResetApp">
        <Trash2 :size="16" /> {{ t('settings.resetButton') }}
      </button>
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

.last-sticker-row {
  margin-bottom: var(--space-3);
}

.last-sticker-row input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-sunken);
  /* iOS Safari auto-zooms the page on focus for any input with a computed
     font-size under 16px — keep this at 16px to avoid that. */
  font-size: 16px;
}

.import-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-sunken);
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
  margin-bottom: var(--space-2);
}

.parsed-summary {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3);
}

.btn:disabled {
  opacity: 0.4;
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

.btn.warning {
  background: var(--color-warning);
  color: #fff;
}

.btn.danger {
  background: var(--color-danger);
  color: #fff;
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
