<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Trash2 } from '@lucide/vue'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'
import { useSavedAnalysesStore } from '@/stores/savedAnalyses'
import { useExchangePrefillStore } from '@/stores/exchangePrefill'
import { parseTradeMessage } from '@/services/tradeMessageParser'
import { analyzeTrade, withoutConflicts, type TradeAnalysisResult } from '@/services/tradeAnalysis'
import { stickerEntryLabel } from '@/services/stickerId'
import type { StickerEntry } from '@/types/models'

type Mode = 'mutual' | 'theirDupes' | 'theirSearch'

const { t } = useI18n()
const router = useRouter()
const album = useAlbumStore()
const exchangesStore = useExchangesStore()
const savedAnalyses = useSavedAnalysesStore()
const prefillStore = useExchangePrefillStore()

const messageText = ref('')
const result = ref<TradeAnalysisResult | null>(null)
const mode = ref<Mode>('mutual')

savedAnalyses.load()

function analyze() {
  const parsed = parseTradeMessage(messageText.value)
  result.value = analyzeTrade(parsed, album.stickers)
}

function entryLabel(e: StickerEntry) {
  return stickerEntryLabel(e)
}

const conflictFreeTheyHaveWeNeed = computed(() =>
  result.value ? withoutConflicts(result.value.theyHaveWeNeed, (id) => exchangesStore.incomingCount(id)) : [],
)
const conflictFreeWeHaveTheyNeed = computed(() =>
  result.value ? withoutConflicts(result.value.weHaveTheyNeed, (id) => exchangesStore.reservedCount(id)) : [],
)
const hasConflicts = computed(
  () =>
    !!result.value &&
    (conflictFreeTheyHaveWeNeed.value.length !== result.value.theyHaveWeNeed.length ||
      conflictFreeWeHaveTheyNeed.value.length !== result.value.weHaveTheyNeed.length),
)

function createExchange(excludeConflicts: boolean) {
  if (!result.value) return
  prefillStore.set({
    giving: excludeConflicts ? conflictFreeWeHaveTheyNeed.value : result.value.weHaveTheyNeed,
    wanting: excludeConflicts ? conflictFreeTheyHaveWeNeed.value : result.value.theyHaveWeNeed,
  })
  router.push('/exchange/new')
}

async function saveCurrent() {
  if (!messageText.value.trim()) return
  await savedAnalyses.save(messageText.value)
}

function reuse(text: string) {
  messageText.value = text
  analyze()
}
</script>

<template>
  <div class="trade-analysis">
    <h1>{{ t('nav.tradeAnalysis') }}</h1>

    <textarea
      v-model="messageText"
      class="message-input"
      rows="6"
      :placeholder="t('tradeAnalysis.placeholder')"
    />

    <div class="actions">
      <button class="btn primary" :disabled="!messageText.trim()" @click="analyze">
        {{ t('tradeAnalysis.analyze') }}
      </button>
      <button class="btn secondary" :disabled="!messageText.trim()" @click="saveCurrent">
        {{ t('tradeAnalysis.save') }}
      </button>
    </div>

    <template v-if="result">
      <div class="mode-switch">
        <button class="mode-btn" :class="{ active: mode === 'mutual' }" @click="mode = 'mutual'">
          {{ t('tradeAnalysis.modeMutual') }}
        </button>
        <button class="mode-btn" :class="{ active: mode === 'theirDupes' }" @click="mode = 'theirDupes'">
          {{ t('tradeAnalysis.modeTheirDupes') }}
        </button>
        <button class="mode-btn" :class="{ active: mode === 'theirSearch' }" @click="mode = 'theirSearch'">
          {{ t('tradeAnalysis.modeTheirSearch') }}
        </button>
      </div>

      <section v-if="mode === 'mutual' || mode === 'theirDupes'" class="result-section">
        <h2>{{ t('tradeAnalysis.theyHaveWeNeed') }}</h2>
        <p v-if="result.theyHaveWeNeed.length === 0" class="empty">{{ t('tradeAnalysis.none') }}</p>
        <div v-else class="chip-row">
          <span v-for="e in result.theyHaveWeNeed" :key="entryLabel(e)" class="chip">{{ entryLabel(e) }}</span>
        </div>
      </section>

      <section v-if="mode === 'mutual' || mode === 'theirSearch'" class="result-section">
        <h2>{{ t('tradeAnalysis.weHaveTheyNeed') }}</h2>
        <p v-if="result.weHaveTheyNeed.length === 0" class="empty">{{ t('tradeAnalysis.none') }}</p>
        <div v-else class="chip-row">
          <span v-for="e in result.weHaveTheyNeed" :key="entryLabel(e)" class="chip">{{ entryLabel(e) }}</span>
        </div>
      </section>

      <template v-if="mode === 'mutual'">
        <section v-if="result.weNeedButTheyDontHave.length > 0" class="result-section muted">
          <h2>{{ t('tradeAnalysis.weNeedButTheyDontHave') }}</h2>
          <div class="chip-row">
            <span v-for="e in result.weNeedButTheyDontHave" :key="entryLabel(e)" class="chip">{{ entryLabel(e) }}</span>
          </div>
        </section>
        <section v-if="result.weHaveButTheyDontNeed.length > 0" class="result-section muted">
          <h2>{{ t('tradeAnalysis.weHaveButTheyDontNeed') }}</h2>
          <div class="chip-row">
            <span v-for="e in result.weHaveButTheyDontNeed" :key="entryLabel(e)" class="chip">{{ entryLabel(e) }}</span>
          </div>
        </section>
      </template>

      <div v-if="result.theyHaveWeNeed.length > 0 || result.weHaveTheyNeed.length > 0" class="actions">
        <button class="btn primary" @click="createExchange(false)">{{ t('tradeAnalysis.createExchange') }}</button>
        <button v-if="hasConflicts" class="btn secondary" @click="createExchange(true)">
          {{ t('tradeAnalysis.createExchangeNoConflicts') }}
        </button>
      </div>
    </template>

    <section v-if="savedAnalyses.analyses.length > 0" class="history">
      <h2>{{ t('tradeAnalysis.history') }}</h2>
      <ul>
        <li v-for="a in savedAnalyses.analyses" :key="a.id" class="history-row">
          <button class="history-text" @click="reuse(a.messageText)">
            {{ a.messageText.slice(0, 60) }}{{ a.messageText.length > 60 ? '…' : '' }}
          </button>
          <button class="delete-btn" @click="savedAnalyses.remove(a.id)"><Trash2 :size="14" /></button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.trade-analysis {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 22px;
  margin: 0 0 var(--space-3);
}

.message-input {
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-sunken);
  resize: vertical;
  font-family: inherit;
}

.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 13px;
}

.btn.primary {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

.btn.primary:disabled {
  opacity: 0.4;
}

.btn.secondary {
  background: var(--color-bg-sunken);
}

.mode-switch {
  display: flex;
  background: var(--color-bg-sunken);
  border-radius: var(--radius-md);
  padding: 2px;
  margin-top: var(--space-4);
}

.mode-btn {
  flex: 1;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.mode-btn.active {
  background: var(--color-bg-elevated);
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.result-section {
  margin-top: var(--space-4);
}

.result-section.muted h2 {
  color: var(--color-text-tertiary);
}

h2 {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
}

.empty {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  font-size: 12px;
  background: var(--color-bg-sunken);
  border-radius: var(--radius-pill);
  padding: 4px 10px;
}

.history {
  margin-top: var(--space-5);
}

.history-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.history-text {
  flex: 1;
  text-align: left;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.delete-btn {
  color: var(--color-danger);
}
</style>
