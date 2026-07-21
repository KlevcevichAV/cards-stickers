<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import SaleForm from '@/components/SaleForm.vue'
import type { SaleFormPayload } from '@/types/ui'

const { t } = useI18n()
const router = useRouter()
const finance = useFinanceStore()

async function onSubmit(payload: SaleFormPayload) {
  await finance.addSale(payload.stickers, payload.price, payload.date, payload.comment)
  router.push('/finance')
}
</script>

<template>
  <div class="add-sale">
    <h1>{{ t('finance.addSale') }}</h1>
    <SaleForm @submit="onSubmit" @cancel="router.push('/finance')" />
  </div>
</template>

<style scoped>
.add-sale {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 22px;
  margin: 0 0 var(--space-4);
}
</style>
