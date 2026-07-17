<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAchievementsStore } from '@/stores/achievements'
import { achievementIcons } from '@/config/achievementIcons'
import ConfettiView from '@/components/ConfettiView.vue'

const AUTO_DISMISS_MS = 3500

const store = useAchievementsStore()
const { locale, t } = useI18n()

const banner = computed(() => store.currentBanner)
const icon = computed(() => (banner.value ? achievementIcons[banner.value.icon] : null))
const title = computed(() =>
  banner.value ? (locale.value === 'ru' ? banner.value.titleRU : banner.value.titleEN) : '',
)
const description = computed(() =>
  banner.value ? (locale.value === 'ru' ? banner.value.descRU : banner.value.descEN) : '',
)

let timer: ReturnType<typeof setTimeout> | null = null

watch(banner, (value) => {
  if (timer) clearTimeout(timer)
  if (value) {
    timer = setTimeout(() => store.dismissBanner(), AUTO_DISMISS_MS)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="banner">
      <div v-if="banner" class="overlay" @click="store.dismissBanner()">
        <ConfettiView />
        <div class="card">
          <div class="icon-circle">
            <component :is="icon" v-if="icon" :size="28" />
          </div>
          <div class="unlocked-label">{{ t('achievements.unlocked') }}</div>
          <div class="title">{{ title }}</div>
          <div class="desc">{{ description }}</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-banner);
  padding: var(--space-4);
}

.card {
  position: relative;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  max-width: 320px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, var(--color-foil), color-mix(in srgb, var(--color-foil) 60%, black));
  color: #fff;
  margin-bottom: var(--space-2);
}

.unlocked-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.title {
  font-size: 18px;
  font-weight: 700;
}

.desc {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.banner-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.banner-leave-active {
  transition: opacity 0.2s ease;
}
.banner-enter-from {
  opacity: 0;
}
.banner-enter-from .card {
  transform: translateY(-40px) scale(0.9);
}
.banner-leave-to {
  opacity: 0;
}
</style>
