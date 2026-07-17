<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'

const { t } = useI18n()
const router = useRouter()
const finance = useFinanceStore()

const price = ref(0)
const date = ref(new Date().toISOString().slice(0, 10))
const comment = ref('')

async function submit() {
  await finance.addSale(price.value, new Date(date.value).toISOString(), comment.value)
  router.push('/finance')
}
</script>

<template>
  <form class="add-sale" @submit.prevent="submit">
    <h1>{{ t('finance.addSale') }}</h1>

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
      <button type="button" class="btn secondary" @click="router.push('/finance')">{{ t('common.cancel') }}</button>
      <button type="submit" class="btn primary">{{ t('common.save') }}</button>
    </div>
  </form>
</template>

<style scoped>
.add-sale {
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

.btn.secondary {
  background: var(--color-bg-sunken);
}
</style>
