<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Plus, Trash2 } from '@lucide/vue'
import { useFinanceStore } from '@/stores/finance'
import { purchaseKindsByKind } from '@/data/purchaseKinds'
import { purchaseKindIcons } from '@/config/purchaseKindIcons'
import { useCurrency } from '@/composables/useCurrency'
import { stickerEntryLabel } from '@/services/stickerId'
import type { PurchaseKind, StickerEntry } from '@/types/models'

const { t, locale } = useI18n()
const router = useRouter()
const finance = useFinanceStore()
const { format } = useCurrency()

function kindName(kind: PurchaseKind) {
  const meta = purchaseKindsByKind.get(kind)
  if (!meta) return kind
  return locale.value === 'ru' ? meta.nameRU : meta.nameEN
}

function soldStickersLabel(entries: StickerEntry[]) {
  return entries.map(stickerEntryLabel).join(', ')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const sortedPurchases = computed(() => [...finance.purchases].sort((a, b) => b.date.localeCompare(a.date)))
const sortedSales = computed(() => [...finance.sales].sort((a, b) => b.date.localeCompare(a.date)))

const diffColor = computed(() => {
  if (finance.stickerCountDiff === 0) return 'neutral'
  return finance.stickerCountDiff > 0 ? 'positive' : 'negative'
})
</script>

<template>
  <div class="finance">
    <header class="header">
      <h1>{{ t('nav.finance') }}</h1>
      <div class="header-actions">
        <button class="icon-btn" @click="router.push('/finance/add-purchase')">
          <Plus :size="16" /> {{ t('finance.purchase') }}
        </button>
        <button class="icon-btn" @click="router.push('/finance/add-sale')">
          <Plus :size="16" /> {{ t('finance.sale') }}
        </button>
      </div>
    </header>

    <section class="summary-card">
      <div class="stat"><span>{{ t('finance.totalSpent') }}</span><strong>{{ format(finance.totalSpent) }}</strong></div>
      <div class="stat"><span>{{ t('finance.stickersBought') }}</span><strong>{{ finance.totalStickersBought }}</strong></div>
      <div class="stat"><span>{{ t('finance.packsBought') }}</span><strong>{{ finance.totalPacksBought }}</strong></div>
      <div class="stat"><span>{{ t('finance.costPerSticker') }}</span><strong>{{ format(finance.costPerSticker) }}</strong></div>
    </section>

    <section v-if="finance.sales.length > 0" class="summary-card">
      <div class="stat"><span>{{ t('finance.totalEarned') }}</span><strong>{{ format(finance.totalEarned) }}</strong></div>
      <div class="stat"><span>{{ t('finance.balance') }}</span><strong>{{ format(finance.balance) }}</strong></div>
    </section>

    <section class="summary-card">
      <div class="stat"><span>{{ t('finance.expected') }}</span><strong>{{ finance.expectedStickerTotal }}</strong></div>
      <div class="stat"><span>{{ t('finance.actual') }}</span><strong>{{ finance.actualStickerTotal }}</strong></div>
      <div class="stat">
        <span>{{ t('finance.diff') }}</span>
        <strong class="diff" :class="diffColor">{{ finance.stickerCountDiff > 0 ? '+' : '' }}{{ finance.stickerCountDiff }}</strong>
      </div>
    </section>

    <section>
      <h2>{{ t('finance.purchases') }}</h2>
      <p v-if="sortedPurchases.length === 0" class="empty">{{ t('finance.noPurchases') }}</p>
      <ul class="list">
        <li v-for="p in sortedPurchases" :key="p.id" class="list-row">
          <component :is="purchaseKindIcons[purchaseKindsByKind.get(p.kind)?.icon ?? 'book']" :size="18" class="row-icon" />
          <div class="row-main">
            <span class="row-title">{{ kindName(p.kind) }} ×{{ p.quantity }}</span>
            <span class="row-sub">{{ formatDate(p.date) }} · {{ format(p.price * p.quantity) }}</span>
          </div>
          <button class="delete-btn" @click="finance.removePurchase(p.id)"><Trash2 :size="14" /></button>
        </li>
      </ul>
    </section>

    <section>
      <h2>{{ t('finance.sales') }}</h2>
      <p v-if="sortedSales.length === 0" class="empty">{{ t('finance.noSales') }}</p>
      <ul class="list">
        <li v-for="s in sortedSales" :key="s.id" class="list-row">
          <div class="row-main">
            <span class="row-title">{{ format(s.price) }}</span>
            <span v-if="s.stickers.length > 0" class="row-sub">{{ soldStickersLabel(s.stickers) }}</span>
            <span class="row-sub">{{ formatDate(s.date) }}<template v-if="s.comment"> · {{ s.comment }}</template></span>
          </div>
          <button class="delete-btn" @click="finance.removeSale(s.id)"><Trash2 :size="14" /></button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.finance {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-2);
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
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-sunken);
  font-size: 12px;
  font-weight: 600;
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-3);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat span {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.stat strong {
  font-size: 16px;
}

.diff.neutral {
  color: var(--color-success);
}

.diff.positive {
  color: var(--color-warning);
}

.diff.negative {
  color: var(--color-danger);
}

h2 {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: var(--space-4) 0 var(--space-2);
}

.empty {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.list-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.row-icon {
  color: var(--color-accent);
  flex-shrink: 0;
}

.row-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.row-title {
  font-size: 13px;
  font-weight: 600;
}

.row-sub {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.delete-btn {
  color: var(--color-danger);
}
</style>
