<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ExchangeStickerPicker from '@/components/ExchangeStickerPicker.vue'
import type { StickerEntry } from '@/types/models'
import type { SaleFormPayload } from '@/types/ui'

interface FormInitial {
  stickers?: StickerEntry[]
  price?: number
  date?: string
  comment?: string
}

const props = defineProps<{ initial?: FormInitial }>()

const emit = defineEmits<{
  submit: [SaleFormPayload]
  cancel: []
}>()

const { t } = useI18n()

const stickers = ref<StickerEntry[]>(props.initial?.stickers?.map((e) => ({ ...e })) ?? [])
const price = ref(props.initial?.price ?? 0)
const date = ref((props.initial?.date ?? new Date().toISOString()).slice(0, 10))
const comment = ref(props.initial?.comment ?? '')

const canSubmit = computed(() => stickers.value.length > 0)

function submit() {
  emit('submit', {
    stickers: stickers.value,
    price: price.value,
    date: new Date(date.value).toISOString(),
    comment: comment.value,
  })
}
</script>

<template>
  <form class="sale-form" @submit.prevent="submit">
    <div class="field">
      <label>{{ t('finance.soldStickers') }}</label>
      <ExchangeStickerPicker v-model="stickers" mode="giving" />
    </div>

    <div class="field">
      <label>{{ t('finance.pricePerUnit') }}</label>
      <input v-model.number="price" type="number" min="0" step="0.01" />
    </div>

    <div class="field">
      <label>{{ t('finance.date') }}</label>
      <input v-model="date" type="date" />
    </div>

    <div class="field">
      <label>{{ t('finance.comment') }}</label>
      <input v-model="comment" type="text" />
    </div>

    <div class="actions">
      <button type="button" class="btn secondary" @click="emit('cancel')">{{ t('common.cancel') }}</button>
      <button type="submit" class="btn primary" :disabled="!canSubmit">{{ t('common.save') }}</button>
    </div>
  </form>
</template>

<style scoped>
.sale-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
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

input {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-sunken);
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
