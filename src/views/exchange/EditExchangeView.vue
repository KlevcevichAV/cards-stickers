<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useExchangesStore } from '@/stores/exchanges'
import ExchangeForm from '@/components/ExchangeForm.vue'
import type { ExchangeFormPayload } from '@/types/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const exchangesStore = useExchangesStore()

const exchange = computed(() => exchangesStore.findExchange(route.params.id as string))

async function onSubmit(payload: ExchangeFormPayload) {
  if (!exchange.value) return
  await exchangesStore.update(exchange.value.id, {
    giving: payload.giving,
    wanting: payload.wanting,
    partner: payload.partner,
    meetingDate: payload.meetingDate,
  })
  router.push('/exchange')
}
</script>

<template>
  <div class="edit-exchange">
    <h1>{{ t('exchange.edit') }}</h1>
    <ExchangeForm v-if="exchange" :initial="exchange" @submit="onSubmit" @cancel="router.push('/exchange')" />
    <p v-else class="not-found">{{ t('exchange.notFound') }}</p>
  </div>
</template>

<style scoped>
.edit-exchange h1 {
  font-size: 22px;
  padding: var(--space-4) var(--space-4) 0;
  margin: 0;
}

.not-found {
  padding: var(--space-4);
  color: var(--color-text-secondary);
}
</style>
