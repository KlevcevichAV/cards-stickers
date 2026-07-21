<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFinanceStore } from '@/stores/finance'
import PurchaseForm from '@/components/PurchaseForm.vue'
import type { PurchaseFormPayload } from '@/types/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const finance = useFinanceStore()

const purchase = computed(() => finance.purchases.find((p) => p.id === route.params.id))

async function onSubmit(payload: PurchaseFormPayload) {
  if (!purchase.value) return
  await finance.updatePurchase(purchase.value.id, payload)
  router.push('/finance')
}
</script>

<template>
  <div class="edit-purchase">
    <h1>{{ t('finance.editPurchase') }}</h1>
    <PurchaseForm v-if="purchase" :initial="purchase" @submit="onSubmit" @cancel="router.push('/finance')" />
    <p v-else class="not-found">{{ t('finance.purchaseNotFound') }}</p>
  </div>
</template>

<style scoped>
.edit-purchase {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 22px;
  margin: 0 0 var(--space-4);
}

.not-found {
  color: var(--color-text-secondary);
}
</style>
