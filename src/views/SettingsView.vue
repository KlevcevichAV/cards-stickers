<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, Upload, Smartphone, PartyPopper, ClipboardPaste, Link2 } from '@lucide/vue'
import { useSettingsStore } from '@/stores/settings'
import { useAlbumStore } from '@/stores/album'
import { useAchievementsStore } from '@/stores/achievements'
import { useExchangesStore } from '@/stores/exchanges'
import { useFinanceStore } from '@/stores/finance'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { exportBackup, downloadBackup, parseBackup, importBackup } from '@/services/backupService'
import { parseTradeMessage } from '@/services/tradeMessageParser'
import { fetchLastStickerCollection } from '@/services/lastStickerImport'

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

const importCollectionText = ref('')
const importCollectionStatus = ref<'idle' | 'success'>('idle')
const importCollectionResult = ref({ missing: 0, duplicates: 0, pasted: 0 })

const parsedImportCollection = computed(() => parseTradeMessage(importCollectionText.value))
const canApplyImportCollection = computed(
  () => parsedImportCollection.value.need.length + parsedImportCollection.value.have.length > 0,
)

// Its own independent flow: fetch + apply happen together in one click, with no
// intermediate "need"/"have" text shown — that manual path (below) is a separate option.
const lastStickerUrl = ref('')
const lastStickerStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const lastStickerResult = ref({ missing: 0, duplicates: 0, pasted: 0 })

async function handleTransferFromLastSticker() {
  lastStickerStatus.value = 'loading'
  let entries: Awaited<ReturnType<typeof fetchLastStickerCollection>>
  try {
    entries = await fetchLastStickerCollection(lastStickerUrl.value)
  } catch {
    // Whatever went wrong — bad link, no matching collection, the reader proxy being
    // unreachable — the manual list paste below still works as a fallback.
    lastStickerStatus.value = 'error'
    return
  }

  const confirmed = window.confirm(
    t('settings.lastStickerConfirm', { need: entries.need.length, have: entries.have.length }),
  )
  if (!confirmed) {
    lastStickerStatus.value = 'idle'
    return
  }

  lastStickerResult.value = await album.setCollectionFromLists(entries.need, entries.have)
  lastStickerStatus.value = 'success'
  setTimeout(() => (lastStickerStatus.value = 'idle'), 5000)
}

async function handleImportCollection() {
  const parsed = parsedImportCollection.value
  const confirmed = window.confirm(
    t('settings.importCollectionConfirm', { need: parsed.need.length, have: parsed.have.length }),
  )
  if (!confirmed) return
  importCollectionResult.value = await album.setCollectionFromLists(parsed.need, parsed.have)
  importCollectionStatus.value = 'success'
  importCollectionText.value = ''
  setTimeout(() => (importCollectionStatus.value = 'idle'), 5000)
}

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
