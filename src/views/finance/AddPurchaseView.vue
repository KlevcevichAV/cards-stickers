<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import { purchaseKinds } from '@/data/purchaseKinds'
import { useCurrency } from '@/composables/useCurrency'
import type { PurchaseKind } from '@/types/models'

const { t, locale } = useI18n()
const router = useRouter()
const finance = useFinanceStore()
const { format } = useCurrency()

const kind = ref<PurchaseKind>('pack')
const quantity = ref(1)
const price = ref(purchaseKinds.find((k) => k.kind === 'pack')!.defaultPrice)
const date = ref(new Date().toISOString().slice(0, 10))

watch(kind, (value) => {
  price.value = purchaseKinds.find((k) => k.kind === value)!.defaultPrice
})

function kindLabel(k: (typeof purchaseKinds)[number]) {
  return locale.value === 'ru' ? k.nameRU : k.nameEN
}

const stickerCount = computed(() => {
  const meta = purchaseKinds.find((k) => k.kind === kind.value)!
  return meta.stickersPerUnit * quantity.value
})
const total = computed(() => price.value * quantity.value)

async function submit() {
  await finance.addPurchase(kind.value, quantity.value, price.value, new Date(date.value).toISOString())
  router.push('/finance')
}
</script>

<template>
  <form class="add-purchase" @submit.prevent="submit">
    <h1>{{ t('finance.addPurchase') }}</h1>

    <div class="field">
      <label>{{ t('finance.kind') }}</label>
      <select v-model="kind">
        <option v-for="k in purchaseKinds" :key="k.kind" :value="k.kind">{{ kindLabel(k) }}</option>
      </select>
    </div>

    <div class="field">
      <label>{{ t('finance.quantity') }}</label>
      <input v-model.number="quantity" type="number" min="1" />
    </div>

    <div class="field">
      <label>{{ t('finance.pricePerUnit') }}</label>
      <input v-model.number="price" type="number" min="0" step="0.01" />
    </div>

    <div class="field">
      <label>{{ t('finance.date') }}</label>
      <input v-model="date" type="date" />
    </div>

    <div class="live-summary">
      <span>{{ t('finance.stickerCount') }}: <strong>{{ stickerCount }}</strong></span>
      <span>{{ t('finance.total') }}: <strong>{{ format(total) }}</strong></span>
    </div>

    <div class="actions">
      <button type="button" class="btn secondary" @click="router.push('/finance')">{{ t('common.cancel') }}</button>
      <button type="submit" class="btn primary">{{ t('common.save') }}</button>
    </div>
  </form>
</template>

<style scoped>
.add-purchase {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

h1 {
  font-size: 22px;
  margin: 0 0 var(--space-2);
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

select,
input {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-sunken);
}

.live-summary {
  display: flex;
  justify-content: space-between;
  background: var(--color-bg-sunken);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: 13px;
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

.btn.secondary {
  background: var(--color-bg-sunken);
}
</style>
