<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProgressRing from '@/components/ProgressRing.vue'
import type { TeamStat } from '@/stores/album'

const props = defineProps<{ team: TeamStat }>()
defineEmits<{ click: [] }>()

const { locale } = useI18n()
const name = computed(() => (locale.value === 'ru' ? props.team.nameRU : props.team.nameEN))
const percent = computed(() => (props.team.total > 0 ? props.team.pasted / props.team.total : 0))
</script>

<template>
  <button class="card" @click="$emit('click')">
    <ProgressRing :percent="percent" :size="48" />
    <span class="flag">{{ team.flagEmoji }}</span>
    <span class="name">{{ name }}</span>
    <span class="count">{{ team.pasted }}/{{ team.total }}</span>
  </button>
</template>

<style scoped>
.card {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  min-width: 84px;
}

.flag {
  font-size: 18px;
  margin-top: -8px;
}

.name {
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 76px;
}

.count {
  font-size: 10px;
  color: var(--color-text-secondary);
}
</style>
