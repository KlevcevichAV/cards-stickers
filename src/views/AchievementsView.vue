<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock, CircleCheck } from '@lucide/vue'
import { useAchievementsStore } from '@/stores/achievements'
import { achievements, achievementCategoryOrder } from '@/data/achievements'
import { achievementIcons } from '@/config/achievementIcons'
import ProgressRing from '@/components/ProgressRing.vue'
import type { AchievementCategory } from '@/types/models'

const { t, locale } = useI18n()
const store = useAchievementsStore()

const unlockedCount = computed(() => store.unlockedIds.size)
const totalCount = achievements.length
const percent = computed(() => (totalCount > 0 ? unlockedCount.value / totalCount : 0))

const categoryLabels: Record<AchievementCategory, string> = {
  superstar: 'achievements.categorySuperstar',
  starHunter: 'achievements.categoryStarHunter',
  team: 'achievements.categoryTeam',
  worldRuler: 'achievements.categoryWorldRuler',
  centurion: 'achievements.categoryCenturion',
  milestone: 'achievements.categoryMilestone',
}

const groups = computed(() =>
  achievementCategoryOrder.map((category) => ({
    category,
    items: achievements.filter((a) => a.category === category),
  })),
)

function title(a: (typeof achievements)[number]) {
  return locale.value === 'ru' ? a.titleRU : a.titleEN
}
function desc(a: (typeof achievements)[number]) {
  return locale.value === 'ru' ? a.descRU : a.descEN
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="achievements">
    <header class="header">
      <h1>{{ t('nav.achievements') }}</h1>
      <div class="summary">
        <ProgressRing :percent="percent" :size="56" />
        <span class="summary-count">{{ unlockedCount }} / {{ totalCount }}</span>
      </div>
    </header>

    <section v-for="group in groups" :key="group.category" class="category">
      <h2>{{ t(categoryLabels[group.category]) }}</h2>
      <ul class="cards">
        <li v-for="a in group.items" :key="a.id" class="card" :class="{ locked: !store.isUnlocked(a.id) }">
          <div class="icon-circle">
            <component :is="store.isUnlocked(a.id) ? achievementIcons[a.icon] : Lock" :size="20" />
          </div>
          <div class="text">
            <div class="title">{{ title(a) }}</div>
            <div class="desc">{{ desc(a) }}</div>
            <div v-if="store.isUnlocked(a.id)" class="unlocked-date">{{ formatDate(store.unlockedDate(a.id)!) }}</div>
          </div>
          <CircleCheck v-if="store.isUnlocked(a.id)" :size="18" class="check" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.achievements {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

h1 {
  font-size: 26px;
  margin: 0;
}

.summary {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-count {
  position: absolute;
  font-size: 10px;
  font-weight: 700;
}

h2 {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: var(--space-4) 0 var(--space-2);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.card.locked {
  opacity: 0.55;
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(145deg, var(--color-foil), color-mix(in srgb, var(--color-foil) 60%, black));
  color: #fff;
}

.card.locked .icon-circle {
  background: var(--color-bg-sunken);
  color: var(--color-text-tertiary);
}

.text {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 13px;
  font-weight: 700;
}

.desc {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.unlocked-date {
  font-size: 10px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.check {
  color: var(--color-success);
  flex-shrink: 0;
}
</style>
