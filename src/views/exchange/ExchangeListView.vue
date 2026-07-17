<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Plus, Users, Pencil, Check, X as XIcon, RotateCcw, Copy, ChevronDown } from '@lucide/vue'
import { useExchangesStore } from '@/stores/exchanges'
import { stickerEntryLabel } from '@/services/stickerId'
import TrustBadge from '@/components/TrustBadge.vue'
import ActionSheet from '@/components/ActionSheet.vue'
import type { CancellationReason, Exchange } from '@/types/models'
import type { SheetAction } from '@/types/ui'

const { t, locale } = useI18n()
const router = useRouter()
const exchangesStore = useExchangesStore()

const expandedIds = ref<Set<string>>(new Set())
const historyOpen = ref(false)
const cancelSheetExchangeId = ref<string | null>(null)

function toggle(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function entriesLabel(entries: Exchange['giving']) {
  return entries.map(stickerEntryLabel).join(', ')
}

async function copyMessage(exchange: Exchange) {
  const lines = [
    exchange.partner ? `${t('exchange.partner')}: ${exchange.partner}` : null,
    `${t('exchange.giving')}: ${entriesLabel(exchange.giving) || '—'}`,
    `${t('exchange.wanting')}: ${entriesLabel(exchange.wanting) || '—'}`,
  ].filter(Boolean)
  await navigator.clipboard.writeText(lines.join('\n'))
}

function openCancelSheet(id: string) {
  cancelSheetExchangeId.value = id
}

const cancelActions = computed<SheetAction[]>(() => {
  const id = cancelSheetExchangeId.value
  if (!id) return []
  const reasons: { reason: CancellationReason; labelKey: string }[] = [
    { reason: 'noShow', labelKey: 'exchange.reasonNoShow' },
    { reason: 'noResponse', labelKey: 'exchange.reasonNoResponse' },
    { reason: 'noAgreement', labelKey: 'exchange.reasonNoAgreement' },
  ]
  return reasons.map((r) => ({
    label: t(r.labelKey),
    style: r.reason === 'noAgreement' ? 'default' : 'destructive',
    onSelect: () => exchangesStore.cancel(id, r.reason),
  }))
})
</script>

<template>
  <div class="exchange-list">
    <header class="header">
      <h1>{{ t('nav.exchange') }}</h1>
      <div class="header-actions">
        <button
          v-if="exchangesStore.partnerNames.length > 0"
          class="icon-btn"
          :aria-label="t('exchange.partnerStats')"
          @click="router.push('/exchange/partners')"
        >
          <Users :size="18" />
        </button>
        <button class="icon-btn primary" :aria-label="t('exchange.new')" @click="router.push('/exchange/new')">
          <Plus :size="18" />
        </button>
      </div>
    </header>

    <section>
      <h2>{{ t('exchange.active') }}</h2>
      <p v-if="exchangesStore.active.length === 0" class="empty">{{ t('exchange.noActive') }}</p>
      <ul class="exchange-rows">
        <li v-for="exchange in exchangesStore.active" :key="exchange.id" class="exchange-row">
          <button class="row-summary" @click="toggle(exchange.id)">
            <div class="row-main">
              <span class="date">{{ formatDate(exchange.meetingDate) }}</span>
              <span v-if="exchange.partner" class="partner">{{ exchange.partner }}</span>
              <TrustBadge v-if="exchangesStore.trustLevel(exchange.partner)" :level="exchangesStore.trustLevel(exchange.partner)!" />
            </div>
            <ChevronDown :size="16" class="chevron" :class="{ open: expandedIds.has(exchange.id) }" />
          </button>

          <div v-if="expandedIds.has(exchange.id)" class="row-detail">
            <div class="chip-row"><span class="chip-label">{{ t('exchange.giving') }}:</span> {{ entriesLabel(exchange.giving) || '—' }}</div>
            <div class="chip-row"><span class="chip-label">{{ t('exchange.wanting') }}:</span> {{ entriesLabel(exchange.wanting) || '—' }}</div>
            <div class="row-actions">
              <button class="action-btn success" @click="exchangesStore.complete(exchange.id)">
                <Check :size="14" /> {{ t('exchange.complete') }}
              </button>
              <button class="action-btn danger" @click="openCancelSheet(exchange.id)">
                <XIcon :size="14" /> {{ t('exchange.cancel') }}
              </button>
              <button class="action-btn" @click="router.push(`/exchange/${exchange.id}/edit`)">
                <Pencil :size="14" />
              </button>
              <button class="action-btn" @click="copyMessage(exchange)">
                <Copy :size="14" />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <section>
      <button class="history-toggle" @click="historyOpen = !historyOpen">
        {{ t('exchange.history') }}
        <ChevronDown :size="16" :class="{ open: historyOpen }" />
      </button>
      <ul v-if="historyOpen" class="exchange-rows">
        <li v-for="exchange in exchangesStore.history" :key="exchange.id" class="exchange-row">
          <button class="row-summary" @click="toggle(exchange.id)">
            <div class="row-main">
              <span class="date">{{ formatDate(exchange.meetingDate) }}</span>
              <span v-if="exchange.partner" class="partner">{{ exchange.partner }}</span>
              <span class="status-pill" :class="exchange.status">{{ t(`exchange.status.${exchange.status}`) }}</span>
            </div>
            <ChevronDown :size="16" class="chevron" :class="{ open: expandedIds.has(exchange.id) }" />
          </button>
          <div v-if="expandedIds.has(exchange.id)" class="row-detail">
            <div class="chip-row"><span class="chip-label">{{ t('exchange.giving') }}:</span> {{ entriesLabel(exchange.giving) || '—' }}</div>
            <div class="chip-row"><span class="chip-label">{{ t('exchange.wanting') }}:</span> {{ entriesLabel(exchange.wanting) || '—' }}</div>
            <div class="row-actions">
              <button
                v-if="exchange.status === 'cancelled'"
                class="action-btn"
                @click="router.push(`/exchange/${exchange.id}/restore`)"
              >
                <RotateCcw :size="14" /> {{ t('exchange.restore') }}
              </button>
              <button class="action-btn" @click="router.push(`/exchange/${exchange.id}/edit`)">
                <Pencil :size="14" />
              </button>
              <button class="action-btn" @click="copyMessage(exchange)">
                <Copy :size="14" />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <ActionSheet
      :open="cancelSheetExchangeId !== null"
      :title="t('exchange.cancelReasonPrompt')"
      :actions="cancelActions"
      @close="cancelSheetExchangeId = null"
    />
  </div>
</template>

<style scoped>
.exchange-list {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

h1 {
  font-size: 26px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--space-2);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-sunken);
}

.icon-btn.primary {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

h2 {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
}

.empty {
  color: var(--color-text-secondary);
  font-size: 13px;
  padding: var(--space-2) 0;
}

.exchange-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.exchange-row {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.row-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3);
}

.row-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
}

.date {
  color: var(--color-text-secondary);
}

.partner {
  font-weight: 600;
}

.status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-sunken);
}

.status-pill.completed {
  color: var(--color-success);
}

.status-pill.cancelled {
  color: var(--color-danger);
}

.chevron {
  transition: transform 0.2s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.row-detail {
  padding: 0 var(--space-3) var(--space-3);
  font-size: 12px;
}

.chip-row {
  padding: 2px 0;
  color: var(--color-text-secondary);
}

.chip-label {
  color: var(--color-text);
  font-weight: 600;
}

.row-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-sunken);
  font-size: 12px;
  font-weight: 600;
}

.action-btn.success {
  background: color-mix(in srgb, var(--color-success) 18%, transparent);
  color: var(--color-success);
}

.action-btn.danger {
  background: color-mix(in srgb, var(--color-danger) 18%, transparent);
  color: var(--color-danger);
}

.history-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: var(--space-2) 0;
  margin-top: var(--space-3);
}
</style>
