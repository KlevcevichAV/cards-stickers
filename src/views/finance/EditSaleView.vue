<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFinanceStore } from '@/stores/finance'
import SaleForm from '@/components/SaleForm.vue'
import type { SaleFormPayload } from '@/types/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const finance = useFinanceStore()

// Only active sales are editable — once completed the sale already deducted duplicates
// and counted the price as earned, so its stickers/price can no longer be freely rewritten.
const sale = computed(() => {
  const found = finance.sales.find((s) => s.id === route.params.id)
  return found?.status === 'active' ? found : undefined
})

async function onSubmit(payload: SaleFormPayload) {
  if (!sale.value) return
  await finance.updateSale(sale.value.id, payload)
  router.push('/finance')
}
</script>

<template>
  <div class="edit-sale">
    <h1>{{ t('finance.editSale') }}</h1>
    <SaleForm v-if="sale" :initial="sale" @submit="onSubmit" @cancel="router.push('/finance')" />
    <p v-else class="not-found">{{ t('finance.saleNotFound') }}</p>
  </div>
</template>

<style scoped>
.edit-sale {
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
