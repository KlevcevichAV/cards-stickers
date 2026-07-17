<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useExchangesStore } from '@/stores/exchanges'
import ExchangeStickerPicker from '@/components/ExchangeStickerPicker.vue'
import TrustBadge from '@/components/TrustBadge.vue'
import type { CancellationReason, StickerEntry } from '@/types/models'
import type { ExchangeFormPayload } from '@/types/ui'

interface FormInitial {
  giving?: StickerEntry[]
  wanting?: StickerEntry[]
  partner?: string
  meetingDate?: string
}

const props = defineProps<{
  initial?: FormInitial
  allowArchive?: boolean
}>()

const emit = defineEmits<{
  submit: [ExchangeFormPayload]
  cancel: []
}>()

const { t } = useI18n()
const exchangesStore = useExchangesStore()

const giving = ref<StickerEntry[]>(props.initial?.giving?.map((e) => ({ ...e })) ?? [])
const wanting = ref<StickerEntry[]>(props.initial?.wanting?.map((e) => ({ ...e })) ?? [])
const partner = ref(props.initial?.partner ?? '')
const meetingDate = ref((props.initial?.meetingDate ?? new Date().toISOString()).slice(0, 10))

const isArchive = ref(false)
const archiveCancelled = ref(false)
const archiveCancellationReason = ref<CancellationReason>('noAgreement')

const trust = computed(() => exchangesStore.trustLevel(partner.value))

const PHONE_LIKE = /^[\d+\-\s()]+$/

function normalizePartner() {
  const value = partner.value.trim()
  if (!value || value.startsWith('@') || PHONE_LIKE.test(value)) return
  partner.value = `@${value}`
}

const cancellationReasons: { value: CancellationReason; labelKey: string }[] = [
  { value: 'noShow', labelKey: 'exchange.reasonNoShow' },
  { value: 'noResponse', labelKey: 'exchange.reasonNoResponse' },
  { value: 'noAgreement', labelKey: 'exchange.reasonNoAgreement' },
]

const canSubmit = computed(() => giving.value.length > 0 || wanting.value.length > 0)

function submit() {
  normalizePartner()
  emit('submit', {
    giving: giving.value,
    wanting: wanting.value,
    partner: partner.value,
    meetingDate: new Date(meetingDate.value).toISOString(),
    archived: isArchive.value,
    archiveCancelled: archiveCancelled.value,
    archiveCancellationReason: archiveCancelled.value ? archiveCancellationReason.value : undefined,
  })
}
</script>

<template>
  <form class="exchange-form" @submit.prevent="submit">
    <section class="field">
      <label>{{ t('exchange.giving') }}</label>
      <ExchangeStickerPicker v-model="giving" mode="giving" />
    </section>

    <section class="field">
      <label>{{ t('exchange.wanting') }}</label>
      <ExchangeStickerPicker v-model="wanting" mode="wanting" />
    </section>

    <section class="field">
      <label>{{ t('exchange.partner') }}</label>
      <div class="partner-row">
        <input v-model="partner" type="text" :placeholder="t('exchange.partnerPlaceholder')" @blur="normalizePartner" />
        <TrustBadge v-if="trust" :level="trust" />
      </div>
    </section>

    <section class="field">
      <label>{{ t('exchange.meetingDate') }}</label>
      <input v-model="meetingDate" type="date" />
    </section>

    <section v-if="allowArchive" class="field archive-field">
      <label class="checkbox-row">
        <input v-model="isArchive" type="checkbox" />
        {{ t('exchange.archiveToggle') }}
      </label>

      <template v-if="isArchive">
        <label class="checkbox-row">
          <input v-model="archiveCancelled" type="checkbox" />
          {{ t('exchange.archiveCancelled') }}
        </label>
        <select v-if="archiveCancelled" v-model="archiveCancellationReason">
          <option v-for="r in cancellationReasons" :key="r.value" :value="r.value">
            {{ t(r.labelKey) }}
          </option>
        </select>
      </template>
    </section>

    <div class="actions">
      <button type="button" class="btn secondary" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </button>
      <button type="submit" class="btn primary" :disabled="!canSubmit">
        {{ t('common.save') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.exchange-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

input[type='text'],
input[type='date'],
select {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-sunken);
}

.partner-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.partner-row input {
  flex: 1;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.archive-field {
  background: var(--color-bg-sunken);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  gap: var(--space-3);
}

.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.btn {
  flex: 1;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-weight: 600;
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
</style>
