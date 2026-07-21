<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import PurchaseForm from '@/components/PurchaseForm.vue'
import type { PurchaseFormPayload } from '@/types/ui'

const { t } = useI18n()
const router = useRouter()
const finance = useFinanceStore()

async function onSubmit(payload: PurchaseFormPayload) {
  await finance.addPurchase(payload.kind, payload.quantity, payload.price, payload.date)
  router.push('/finance')
}
</script>

<template>
  <div class="add-purchase">
    <h1>{{ t('finance.addPurchase') }}</h1>
    <PurchaseForm @submit="onSubmit" @cancel="router.push('/finance')" />
  </div>
</template>

<style scoped>
.add-purchase {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 22px;
  margin: 0 0 var(--space-4);
}
</style>
