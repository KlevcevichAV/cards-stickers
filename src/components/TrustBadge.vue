<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ThumbsUp, Minus, ThumbsDown } from '@lucide/vue'
import type { TrustLevel } from '@/services/trustLevel'

const props = defineProps<{ level: TrustLevel }>()
const { t } = useI18n()

const icon = computed(() => ({ good: ThumbsUp, medium: Minus, bad: ThumbsDown })[props.level])
const labelKey = computed(
  () => ({ good: 'exchange.trustGood', medium: 'exchange.trustMedium', bad: 'exchange.trustBad' })[props.level],
)
</script>

<template>
  <span class="trust-badge" :class="level">
    <component :is="icon" :size="12" />
    {{ t(labelKey) }}
  </span>
</template>

<style scoped>
.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
}

.trust-badge.good {
  background: color-mix(in srgb, var(--color-success) 18%, transparent);
  color: var(--color-success);
}

.trust-badge.medium {
  background: color-mix(in srgb, var(--color-warning) 18%, transparent);
  color: var(--color-warning);
}

.trust-badge.bad {
  background: color-mix(in srgb, var(--color-danger) 18%, transparent);
  color: var(--color-danger);
}
</style>
