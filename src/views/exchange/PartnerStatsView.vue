<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useExchangesStore } from '@/stores/exchanges'
import TrustBadge from '@/components/TrustBadge.vue'
import type { CancellationReason, Exchange } from '@/types/models'

const { t } = useI18n()
const exchangesStore = useExchangesStore()
const expanded = ref<Set<string>>(new Set())

interface PartnerSummary {
  partner: string
  completed: number
  active: number
  cancelled: number
  givenTotal: number
  receivedTotal: number
  reasons: Partial<Record<CancellationReason, number>>
}

function summarize(partner: string, list: Exchange[]): PartnerSummary {
  const summary: PartnerSummary = {
    partner,
    completed: 0,
    active: 0,
    cancelled: 0,
    givenTotal: 0,
    receivedTotal: 0,
    reasons: {},
  }
  for (const e of list) {
    if (e.status === 'completed') summary.completed++
    else if (e.status === 'active') summary.active++
    else {
      summary.cancelled++
      if (e.cancellationReason) {
        summary.reasons[e.cancellationReason] = (summary.reasons[e.cancellationReason] ?? 0) + 1
      }
    }
    summary.givenTotal += e.giving.reduce((sum, entry) => sum + entry.count, 0)
    summary.receivedTotal += e.wanting.reduce((sum, entry) => sum + entry.count, 0)
  }
  return summary
}

const summaries = computed<PartnerSummary[]>(() => {
  const byPartner = new Map<string, Exchange[]>()
  for (const e of exchangesStore.exchanges) {
    const partner = e.partner.trim()
    if (!partner) continue
    const list = byPartner.get(partner) ?? []
    list.push(e)
    byPartner.set(partner, list)
  }
  return Array.from(byPartner.entries())
    .map(([partner, list]) => summarize(partner, list))
    .sort((a, b) => b.completed + b.active + b.cancelled - (a.completed + a.active + a.cancelled))
})

function toggle(partner: string) {
  const next = new Set(expanded.value)
  if (next.has(partner)) next.delete(partner)
  else next.add(partner)
  expanded.value = next
}

const reasonLabels: Record<CancellationReason, string> = {
  noShow: 'exchange.reasonNoShow',
  noResponse: 'exchange.reasonNoResponse',
  noAgreement: 'exchange.reasonNoAgreement',
}
</script>

<template>
  <div class="partner-stats">
    <h1>{{ t('exchange.partnerStats') }}</h1>

    <p v-if="summaries.length === 0" class="empty">{{ t('exchange.noPartners') }}</p>

    <ul class="partner-list">
      <li v-for="summary in summaries" :key="summary.partner" class="partner-item">
        <button class="partner-header" @click="toggle(summary.partner)">
          <span class="partner-name">{{ summary.partner }}</span>
          <TrustBadge v-if="exchangesStore.trustLevel(summary.partner)" :level="exchangesStore.trustLevel(summary.partner)!" />
        </button>
        <div v-if="expanded.has(summary.partner)" class="partner-detail">
          <div class="stat-row"><span>{{ t('exchange.completed') }}</span><strong>{{ summary.completed }}</strong></div>
          <div class="stat-row"><span>{{ t('exchange.active') }}</span><strong>{{ summary.active }}</strong></div>
          <div class="stat-row"><span>{{ t('exchange.cancelled') }}</span><strong>{{ summary.cancelled }}</strong></div>
          <div class="stat-row"><span>{{ t('exchange.given') }}</span><strong>{{ summary.givenTotal }}</strong></div>
          <div class="stat-row"><span>{{ t('exchange.received') }}</span><strong>{{ summary.receivedTotal }}</strong></div>
          <div v-if="Object.keys(summary.reasons).length > 0" class="reasons">
            <span
              v-for="(count, reason) in summary.reasons"
              :key="reason"
              class="reason-chip"
            >
              {{ t(reasonLabels[reason as CancellationReason]) }} × {{ count }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.partner-stats {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 22px;
  margin: 0 0 var(--space-4);
}

.empty {
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--space-6) 0;
}

.partner-item + .partner-item {
  margin-top: var(--space-2);
}

.partner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.partner-name {
  font-weight: 600;
}

.partner-detail {
  padding: var(--space-3);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 2px 0;
  color: var(--color-text-secondary);
}

.stat-row strong {
  color: var(--color-text);
}

.reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--space-2);
}

.reason-chip {
  font-size: 11px;
  background: var(--color-bg-sunken);
  border-radius: var(--radius-pill);
  padding: 3px 8px;
}
</style>
