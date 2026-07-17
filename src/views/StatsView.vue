<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'
import ProgressRing from '@/components/ProgressRing.vue'
import TeamMiniCard from '@/components/TeamMiniCard.vue'
import { groupTitle } from '@/services/groupTitle'

const album = useAlbumStore()
const exchanges = useExchangesStore()
const router = useRouter()

const alphaTeams = computed(() => [...album.teamStats].sort((a, b) => a.nameEN.localeCompare(b.nameEN)))

function openGroup(letter: string) {
  router.push({ path: '/groups', query: { expand: letter } })
}

function openTeam(code: string) {
  router.push({ path: '/album', query: { team: code } })
}
</script>

<template>
  <div class="stats">
    <h1>{{ $t('nav.stats') }}</h1>

    <section class="summary-card">
      <ProgressRing :percent="album.albumPercent" :size="88" :stroke-width="8" />
      <div class="summary-text">
        <div class="big-percent">{{ Math.round(album.albumPercent * 100) }}%</div>
        <div class="row">
          <span>{{ $t('stats.pasted') }}</span>
          <strong
            >{{ album.totalPasted }} / {{ album.totalStickers }}
            <span v-if="exchanges.pendingIncoming > 0" class="delta plus"
              >(+{{ exchanges.pendingIncoming }})</span
            ></strong
          >
        </div>
        <div class="row">
          <span>{{ $t('stats.missing') }}</span>
          <strong>{{ album.totalStickers - album.totalPasted }}</strong>
        </div>
        <div class="row">
          <span>{{ $t('stats.duplicates') }}</span>
          <strong
            >{{ album.totalDuplicates }}
            <span v-if="exchanges.pendingReserved > 0" class="delta minus"
              >(-{{ exchanges.pendingReserved }})</span
            ></strong
          >
        </div>
      </div>
    </section>

    <section class="strip-section">
      <h2>{{ $t('stats.groups') }}</h2>
      <div class="strip">
        <button
          v-for="group in album.groupStats"
          :key="group.letter"
          class="group-card"
          @click="openGroup(group.letter)"
        >
          <ProgressRing :percent="group.total > 0 ? group.pasted / group.total : 0" :size="44" />
          <span class="group-card-title">{{ groupTitle(group.letter) }}</span>
          <span class="group-card-count">{{ group.pasted }}/{{ group.total }}</span>
        </button>
      </div>
    </section>

    <section class="strip-section">
      <h2>{{ $t('stats.countries') }}</h2>
      <div class="strip">
        <TeamMiniCard
          v-for="team in alphaTeams"
          :key="team.code"
          :team="team"
          @click="openTeam(team.code)"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.stats {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 26px;
  margin: 0 0 var(--space-4);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.big-percent {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.summary-text {
  flex: 1;
}

.row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 2px 0;
}

.row strong {
  color: var(--color-text);
  font-weight: 600;
}

.delta {
  font-size: 11px;
  font-weight: 600;
}

.delta.plus {
  color: var(--color-success);
}

.delta.minus {
  color: var(--color-danger);
}

.strip-section {
  margin-top: var(--space-5);
}

h2 {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
}

.strip {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-2);
}

.group-card {
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

.group-card-title {
  font-size: 11px;
  text-align: center;
}

.group-card-count {
  font-size: 10px;
  color: var(--color-text-secondary);
}
</style>
