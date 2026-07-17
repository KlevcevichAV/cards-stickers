<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useExchangesStore } from '@/stores/exchanges'
import { useExchangePrefillStore } from '@/stores/exchangePrefill'
import ExchangeForm from '@/components/ExchangeForm.vue'
import type { ExchangeFormPayload } from '@/types/ui'

const router = useRouter()
const { t } = useI18n()
const exchangesStore = useExchangesStore()
const prefill = useExchangePrefillStore().consume()

async function onSubmit(payload: ExchangeFormPayload) {
  await exchangesStore.create(payload)
  router.push('/exchange')
}
</script>

<template>
  <div class="new-exchange">
    <h1>{{ t('exchange.new') }}</h1>
    <ExchangeForm :initial="prefill ?? undefined" allow-archive @submit="onSubmit" @cancel="router.push('/exchange')" />
  </div>
</template>

<style scoped>
.new-exchange h1 {
  font-size: 22px;
  padding: var(--space-4) var(--space-4) 0;
  margin: 0;
}
</style>
