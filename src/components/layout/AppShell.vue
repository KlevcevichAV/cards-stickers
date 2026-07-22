<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import TabBar from './TabBar.vue'
import Sidebar from './Sidebar.vue'
import AchievementBanner from '@/components/AchievementBanner.vue'
import OnboardingModal from '@/components/OnboardingModal.vue'
import { useAlbumStore } from '@/stores/album'
import { useAchievementsStore } from '@/stores/achievements'
import { useExchangesStore } from '@/stores/exchanges'
import { useFinanceStore } from '@/stores/finance'
import { useSettingsStore } from '@/stores/settings'

const album = useAlbumStore()
const settings = useSettingsStore()

onMounted(async () => {
  await Promise.all([
    album.load(),
    useAchievementsStore().load(),
    useExchangesStore().load(),
    useFinanceStore().load(),
  ])
})
</script>

<template>
  <div class="app-shell">
    <Sidebar class="desktop-only" />
    <div class="content-area">
      <main class="content">
        <RouterView />
      </main>
      <TabBar class="mobile-only" />
    </div>
    <AchievementBanner />
    <OnboardingModal v-if="album.loaded && !settings.hasSeenOnboarding" />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100dvh;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content {
  flex: 1;
  min-width: 0;
  padding-top: var(--safe-top);
}

.desktop-only {
  display: none;
}

.mobile-only {
  display: flex;
}

@media (min-width: 900px) {
  .desktop-only {
    display: flex;
    flex-direction: column;
  }

  .mobile-only {
    display: none;
  }

  .content {
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
  }
}
</style>
