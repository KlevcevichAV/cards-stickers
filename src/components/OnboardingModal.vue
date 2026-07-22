<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronLeft, Link2, ClipboardPaste, PenLine, PartyPopper } from '@lucide/vue'
import { useSettingsStore } from '@/stores/settings'
import { useAlbumStore } from '@/stores/album'
import { useLastStickerImport } from '@/composables/useLastStickerImport'
import { useTradeListImport } from '@/composables/useTradeListImport'

const { t } = useI18n()
const settings = useSettingsStore()
const album = useAlbumStore()

type Step =
  | 'welcome'
  | 'question'
  | 'method'
  | 'last-sticker'
  | 'trade-list'
  | 'duplicates-method'
  | 'last-sticker-dup'
  | 'trade-list-dup'
  | 'done'
type DoneReason = 'collected' | 'imported' | 'manual'

const step = ref<Step>('welcome')
const doneReason = ref<DoneReason>('manual')
const importResult = ref({ missing: 0, duplicates: 0, pasted: 0 })

const {
  url: lastStickerUrl,
  status: lastStickerStatus,
  result: lastStickerResult,
  submit: submitLastSticker,
} = useLastStickerImport(t)

const {
  text: tradeListText,
  result: tradeListResult,
  parsed: parsedTradeList,
  canApply: canApplyTradeList,
  submit: submitTradeList,
} = useTradeListImport(t)

// Same two composables, but scoped to the "I already own everything, just note my
// duplicates" path: applyNeed: false means whatever the profile/list says is "needed"
// is ignored, so the album always ends up fully collected with only the spares applied.
const {
  url: lastStickerDupUrl,
  status: lastStickerDupStatus,
  result: lastStickerDupResult,
  submit: submitLastStickerDup,
} = useLastStickerImport(t, { applyNeed: false })

const {
  text: tradeListDupText,
  result: tradeListDupResult,
  parsed: parsedTradeListDup,
  canApply: canApplyTradeListDup,
  submit: submitTradeListDup,
} = useTradeListImport(t, { applyNeed: false })

// have.length is how many distinct sticker IDs are duplicates — not the total copy
// count each carries (e.g. "FWC3*3" is one entry with count: 3) — show both so the
// preview isn't misread as "found 3 spares" when it's really 3 kinds, N copies.
const tradeListDupTotalCopies = computed(() => parsedTradeListDup.value.have.reduce((sum, e) => sum + e.count, 0))

function finish() {
  settings.hasSeenOnboarding = true
}

function chooseCollected(yes: boolean) {
  step.value = yes ? 'duplicates-method' : 'method'
}

function chooseMethod(method: 'last-sticker' | 'trade-list' | 'manual') {
  if (method === 'manual') {
    doneReason.value = 'manual'
    step.value = 'done'
    return
  }
  step.value = method
}

async function chooseDuplicatesMethod(method: 'last-sticker' | 'trade-list' | 'none') {
  if (method === 'none') {
    await album.markAllCollected()
    doneReason.value = 'collected'
    step.value = 'done'
    return
  }
  step.value = method === 'last-sticker' ? 'last-sticker-dup' : 'trade-list-dup'
}

async function handleSubmitLastSticker() {
  if (!(await submitLastSticker())) return
  importResult.value = lastStickerResult.value
  doneReason.value = 'imported'
  step.value = 'done'
}

async function handleSubmitTradeList() {
  if (!(await submitTradeList())) return
  importResult.value = tradeListResult.value
  doneReason.value = 'imported'
  step.value = 'done'
}

async function handleSubmitLastStickerDup() {
  if (!(await submitLastStickerDup())) return
  importResult.value = lastStickerDupResult.value
  doneReason.value = 'imported'
  step.value = 'done'
}

async function handleSubmitTradeListDup() {
  if (!(await submitTradeListDup())) return
  importResult.value = tradeListDupResult.value
  doneReason.value = 'imported'
  step.value = 'done'
}
</script>

<template>
  <Teleport to="body">
    <div class="overlay">
      <div class="card">
        <button v-if="step !== 'done'" class="skip" :aria-label="t('onboarding.skip')" @click="finish">
          <X :size="18" />
        </button>

        <template v-if="step === 'welcome'">
          <div class="icon-circle"><PartyPopper :size="28" /></div>
          <div class="title">{{ t('onboarding.welcomeTitle') }}</div>
          <p class="desc">{{ t('onboarding.welcomeDescription') }}</p>
          <label class="language-label" for="onboarding-language">{{ t('settings.language') }}</label>
          <select id="onboarding-language" v-model="settings.language">
            <option value="system">{{ t('settings.languageSystem') }}</option>
            <option value="en">{{ t('settings.languageEn') }}</option>
            <option value="ru">{{ t('settings.languageRu') }}</option>
          </select>
          <button class="btn primary" @click="step = 'question'">{{ t('onboarding.next') }}</button>
        </template>

        <template v-else-if="step === 'question'">
          <div class="title">{{ t('onboarding.collectedQuestion') }}</div>
          <div class="stack">
            <button class="btn primary" @click="chooseCollected(true)">{{ t('onboarding.yes') }}</button>
            <button class="btn secondary" @click="chooseCollected(false)">{{ t('onboarding.no') }}</button>
          </div>
        </template>

        <template v-else-if="step === 'duplicates-method'">
          <button class="back" :aria-label="t('onboarding.back')" @click="step = 'question'">
            <ChevronLeft :size="18" />
          </button>
          <div class="title">{{ t('onboarding.duplicatesTitle') }}</div>
          <div class="stack">
            <button class="option" @click="chooseDuplicatesMethod('last-sticker')">
              <Link2 :size="18" />
              <span class="option-text">
                <span class="option-title">{{ t('onboarding.duplicatesLastSticker') }}</span>
                <span class="option-hint">{{ t('onboarding.duplicatesLastStickerHint') }}</span>
              </span>
            </button>
            <button class="option" @click="chooseDuplicatesMethod('trade-list')">
              <ClipboardPaste :size="18" />
              <span class="option-text">
                <span class="option-title">{{ t('onboarding.duplicatesList') }}</span>
                <span class="option-hint">{{ t('onboarding.duplicatesListHint') }}</span>
              </span>
            </button>
            <button class="option" @click="chooseDuplicatesMethod('none')">
              <PenLine :size="18" />
              <span class="option-text">
                <span class="option-title">{{ t('onboarding.duplicatesManual') }}</span>
                <span class="option-hint">{{ t('onboarding.duplicatesManualHint') }}</span>
              </span>
            </button>
          </div>
        </template>

        <template v-else-if="step === 'method'">
          <button class="back" :aria-label="t('onboarding.back')" @click="step = 'question'">
            <ChevronLeft :size="18" />
          </button>
          <div class="title">{{ t('onboarding.methodTitle') }}</div>
          <div class="stack">
            <button class="option" @click="chooseMethod('last-sticker')">
              <Link2 :size="18" />
              <span class="option-text">
                <span class="option-title">{{ t('onboarding.methodLastSticker') }}</span>
                <span class="option-hint">{{ t('onboarding.methodLastStickerHint') }}</span>
              </span>
            </button>
            <button class="option" @click="chooseMethod('trade-list')">
              <ClipboardPaste :size="18" />
              <span class="option-text">
                <span class="option-title">{{ t('onboarding.methodList') }}</span>
                <span class="option-hint">{{ t('onboarding.methodListHint') }}</span>
              </span>
            </button>
            <button class="option" @click="chooseMethod('manual')">
              <PenLine :size="18" />
              <span class="option-text">
                <span class="option-title">{{ t('onboarding.methodManual') }}</span>
                <span class="option-hint">{{ t('onboarding.methodManualHint') }}</span>
              </span>
            </button>
          </div>
        </template>

        <template v-else-if="step === 'last-sticker'">
          <button class="back" :aria-label="t('onboarding.back')" @click="step = 'method'">
            <ChevronLeft :size="18" />
          </button>
          <div class="title">{{ t('settings.lastStickerTitle') }}</div>
          <p class="desc">{{ t('settings.lastStickerDescription') }}</p>
          <input
            v-model="lastStickerUrl"
            type="text"
            :placeholder="t('settings.lastStickerPlaceholder')"
            @keyup.enter="handleSubmitLastSticker"
          />
          <button
            class="btn primary"
            :disabled="!lastStickerUrl.trim() || lastStickerStatus === 'loading'"
            @click="handleSubmitLastSticker"
          >
            <Link2 :size="16" />
            {{ lastStickerStatus === 'loading' ? t('settings.lastStickerFetching') : t('settings.lastStickerButton') }}
          </button>
          <p v-if="lastStickerStatus === 'error'" class="status error">{{ t('settings.lastStickerError') }}</p>
        </template>

        <template v-else-if="step === 'trade-list'">
          <button class="back" :aria-label="t('onboarding.back')" @click="step = 'method'">
            <ChevronLeft :size="18" />
          </button>
          <div class="title">{{ t('settings.importCollection') }}</div>
          <p class="desc">{{ t('settings.importCollectionDescription') }}</p>
          <textarea v-model="tradeListText" rows="5" :placeholder="t('settings.importCollectionPlaceholder')" />
          <p v-if="tradeListText.trim()" class="parsed-summary">
            {{ t('settings.importCollectionParsed', { need: parsedTradeList.need.length, have: parsedTradeList.have.length }) }}
          </p>
          <button class="btn primary" :disabled="!canApplyTradeList" @click="handleSubmitTradeList">
            <ClipboardPaste :size="16" /> {{ t('settings.importCollectionButton') }}
          </button>
        </template>

        <template v-else-if="step === 'last-sticker-dup'">
          <button class="back" :aria-label="t('onboarding.back')" @click="step = 'duplicates-method'">
            <ChevronLeft :size="18" />
          </button>
          <div class="title">{{ t('onboarding.duplicatesLastSticker') }}</div>
          <p class="desc">{{ t('settings.lastStickerDescription') }}</p>
          <input
            v-model="lastStickerDupUrl"
            type="text"
            :placeholder="t('settings.lastStickerPlaceholder')"
            @keyup.enter="handleSubmitLastStickerDup"
          />
          <button
            class="btn primary"
            :disabled="!lastStickerDupUrl.trim() || lastStickerDupStatus === 'loading'"
            @click="handleSubmitLastStickerDup"
          >
            <Link2 :size="16" />
            {{
              lastStickerDupStatus === 'loading' ? t('settings.lastStickerFetching') : t('settings.lastStickerButton')
            }}
          </button>
          <p v-if="lastStickerDupStatus === 'error'" class="status error">{{ t('settings.lastStickerError') }}</p>
        </template>

        <template v-else-if="step === 'trade-list-dup'">
          <button class="back" :aria-label="t('onboarding.back')" @click="step = 'duplicates-method'">
            <ChevronLeft :size="18" />
          </button>
          <div class="title">{{ t('onboarding.duplicatesList') }}</div>
          <p class="desc">{{ t('settings.importCollectionDescription') }}</p>
          <textarea v-model="tradeListDupText" rows="5" :placeholder="t('settings.importCollectionPlaceholder')" />
          <p v-if="tradeListDupText.trim()" class="parsed-summary">
            {{
              t('onboarding.duplicatesParsed', {
                items: parsedTradeListDup.have.length,
                total: tradeListDupTotalCopies,
              })
            }}
          </p>
          <button class="btn primary" :disabled="!canApplyTradeListDup" @click="handleSubmitTradeListDup">
            <ClipboardPaste :size="16" /> {{ t('settings.importCollectionButton') }}
          </button>
        </template>

        <template v-else-if="step === 'done'">
          <div class="icon-circle"><PartyPopper :size="28" /></div>
          <template v-if="doneReason === 'collected'">
            <div class="title">{{ t('onboarding.doneCollectedTitle') }}</div>
            <p class="desc">{{ t('onboarding.doneCollected') }}</p>
          </template>
          <template v-else-if="doneReason === 'imported'">
            <div class="title">{{ t('onboarding.doneImportedTitle') }}</div>
            <p class="desc">
              {{
                t('settings.importCollectionSuccess', {
                  pasted: importResult.pasted,
                  duplicates: importResult.duplicates,
                  missing: importResult.missing,
                })
              }}
            </p>
          </template>
          <template v-else>
            <div class="title">{{ t('onboarding.doneManualTitle') }}</div>
            <p class="desc">{{ t('onboarding.doneManual') }}</p>
          </template>
          <button class="btn primary" @click="finish">{{ t('onboarding.start') }}</button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-banner);
  padding: var(--space-4);
}

.card {
  position: relative;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  max-width: 340px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.skip {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  color: var(--color-text-secondary);
}

.back {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  color: var(--color-text-secondary);
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, var(--color-foil), color-mix(in srgb, var(--color-foil) 60%, black));
  color: #fff;
  margin-bottom: var(--space-2);
}

.title {
  font-size: 18px;
  font-weight: 700;
}

.desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-sunken);
  text-align: left;
}

.option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
}

.option-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
}

input[type='text'],
select,
textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-sunken);
  font-family: inherit;
  /* iOS Safari auto-zooms the page on focus for any input with a computed
     font-size under 16px — keep this at 16px to avoid that. */
  font-size: 16px;
}

.language-label {
  align-self: flex-start;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

textarea {
  font-size: 13px;
  resize: vertical;
}

.parsed-summary {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
  align-self: flex-start;
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
  width: 100%;
}

.btn:disabled {
  opacity: 0.4;
}

.btn.primary {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

.btn.secondary {
  background: var(--color-bg-sunken);
}

.status {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
}

.status.error {
  color: var(--color-danger);
}
</style>
