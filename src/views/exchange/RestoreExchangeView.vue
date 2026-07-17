<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useExchangesStore } from '@/stores/exchanges'
import { stickerEntryLabel } from '@/services/stickerId'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const exchangesStore = useExchangesStore()

const exchangeId = route.params.id as string
const exchange = computed(() => exchangesStore.findExchange(exchangeId))
const validation = computed(() => exchangesStore.validateRestore(exchangeId))
const acknowledged = ref(false)

const canRestore = computed(
  () => validation.value.ok && (validation.value.alreadyOwnedWanting.length === 0 || acknowledged.value),
)

async function confirmRestore() {
  if (!canRestore.value) return
  await exchangesStore.restore(exchangeId)
  router.push('/exchange')
}
</script>

<template>
  <div class="restore-view">
    <h1>{{ t('exchange.restore') }}</h1>

    <p v-if="!exchange" class="not-found">{{ t('exchange.notFound') }}</p>

    <template v-else>
      <div v-if="validation.insufficientGiving.length > 0" class="banner error">
        {{ t('exchange.restoreInsufficientGiving') }}
        <ul>
          <li v-for="e in validation.insufficientGiving" :key="`${e.teamCode}${e.number}`">
            {{ stickerEntryLabel(e) }}
          </li>
        </ul>
      </div>

      <div v-if="validation.alreadyOwnedWanting.length > 0" class="banner warning">
        {{ t('exchange.restoreAlreadyOwned') }}
        <ul>
          <li v-for="e in validation.alreadyOwnedWanting" :key="`${e.teamCode}${e.number}`">
            {{ stickerEntryLabel(e) }}
          </li>
        </ul>
        <label class="checkbox-row">
          <input v-model="acknowledged" type="checkbox" />
          {{ t('exchange.restoreAcknowledge') }}
        </label>
      </div>

      <div class="actions">
        <button class="btn secondary" @click="router.push('/exchange')">{{ t('common.cancel') }}</button>
        <button class="btn primary" :disabled="!canRestore" @click="confirmRestore">
          {{ t('exchange.restore') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.restore-view {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 22px;
  margin: 0 0 var(--space-4);
}

.banner {
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-bottom: var(--space-3);
  font-size: 13px;
}

.banner ul {
  margin-top: var(--space-2);
  padding-left: var(--space-3);
  list-style: disc;
}

.banner.error {
  background: color-mix(in srgb, var(--color-danger) 15%, transparent);
  color: var(--color-danger);
}

.banner.warning {
  background: color-mix(in srgb, var(--color-warning) 15%, transparent);
  color: var(--color-warning);
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-weight: 600;
}

.not-found {
  color: var(--color-text-secondary);
}

.actions {
  display: flex;
  gap: var(--space-3);
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
