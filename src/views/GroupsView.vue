<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { List, GalleryHorizontal, ArrowDownAZ, Search } from '@lucide/vue'
import { useAlbumStore, type TeamStat } from '@/stores/album'
import TeamMiniCard from '@/components/TeamMiniCard.vue'
import { groupTitle } from '@/services/groupTitle'

type ViewMode = 'list' | 'scroll' | 'alpha'

const album = useAlbumStore()
const { locale, t } = useI18n()
const router = useRouter()
const route = useRoute()

const mode = ref<ViewMode>('list')
const search = ref('')
const expandedGroups = ref<Set<string>>(new Set())

function teamName(t: { nameEN: string; nameRU: string }) {
  return locale.value === 'ru' ? t.nameRU : t.nameEN
}

function toggleGroup(letter: string) {
  const next = new Set(expandedGroups.value)
  if (next.has(letter)) next.delete(letter)
  else next.add(letter)
  expandedGroups.value = next
}

function openTeam(code: string) {
  router.push({ path: '/album', query: { team: code } })
}

// Deep-link support: /groups?expand=A, used by the Stats screen.
watch(
  () => route.query.expand,
  (letter) => {
    if (typeof letter !== 'string') return
    mode.value = 'list'
    expandedGroups.value = new Set([...expandedGroups.value, letter])
    router.replace({ path: '/groups' })
  },
  { immediate: true },
)

const alphaTeams = computed<TeamStat[]>(() => {
  const query = search.value.trim().toLowerCase()
  const list = [...album.teamStats].sort((a, b) => teamName(a).localeCompare(teamName(b)))
  if (!query) return list
  return list.filter(
    (t) => teamName(t).toLowerCase().includes(query) || t.code.toLowerCase().includes(query),
  )
})

const modes: { key: ViewMode; icon: Component; labelKey: string }[] = [
  { key: 'list', icon: List, labelKey: 'groups.viewList' },
  { key: 'scroll', icon: GalleryHorizontal, labelKey: 'groups.viewScroll' },
  { key: 'alpha', icon: ArrowDownAZ, labelKey: 'groups.viewAlpha' },
]

</script>

<template>
  <div class="groups">
    <header class="header">
      <h1>{{ $t('nav.groups') }}</h1>
      <div class="mode-switch">
        <button
          v-for="m in modes"
          :key="m.key"
          class="mode-btn"
          :class="{ active: mode === m.key }"
          :aria-label="t(m.labelKey)"
          @click="mode = m.key"
        >
          <component :is="m.icon" :size="16" />
        </button>
      </div>
    </header>

    <!-- List mode: collapsible sections per group -->
    <div v-if="mode === 'list'" class="list-mode">
      <section v-for="group in album.groupStats" :key="group.letter" class="group-section">
        <button class="group-header" @click="toggleGroup(group.letter)">
          <span class="group-title">{{ groupTitle(group.letter) }}</span>
          <span class="group-progress">{{ group.pasted }}/{{ group.total }}</span>
        </button>
        <ul v-if="expandedGroups.has(group.letter)" class="team-list">
          <li v-for="team in group.teams" :key="team.code">
            <button class="team-row" @click="openTeam(team.code)">
              <span class="flag">{{ team.flagEmoji }}</span>
              <span class="team-name">{{ teamName(team) }}</span>
              <span class="team-bar">
                <span
                  class="team-bar-fill"
                  :style="{ width: `${team.total > 0 ? (team.pasted / team.total) * 100 : 0}%` }"
                />
              </span>
              <span class="team-count">{{ team.pasted }}/{{ team.total }}</span>
            </button>
          </li>
        </ul>
      </section>
    </div>

    <!-- Scroll mode: horizontal-scrolling rows per group -->
    <div v-else-if="mode === 'scroll'" class="scroll-mode">
      <section v-for="group in album.groupStats" :key="group.letter" class="scroll-section">
        <h2>{{ groupTitle(group.letter) }}</h2>
        <div class="scroll-row">
          <TeamMiniCard
            v-for="team in group.teams"
            :key="team.code"
            :team="team"
            @click="openTeam(team.code)"
          />
        </div>
      </section>
    </div>

    <!-- Alpha mode: flat searchable list -->
    <div v-else class="alpha-mode">
      <div class="search-box">
        <Search :size="16" />
        <input v-model="search" type="search" :placeholder="t('common.search')" />
      </div>
      <ul class="team-list">
        <li v-for="team in alphaTeams" :key="team.code">
          <button class="team-row" @click="openTeam(team.code)">
            <span class="flag">{{ team.flagEmoji }}</span>
            <span class="team-name">{{ teamName(team) }}</span>
            <span class="team-bar">
              <span
                class="team-bar-fill"
                :style="{ width: `${team.total > 0 ? (team.pasted / team.total) * 100 : 0}%` }"
              />
            </span>
            <span class="team-count">{{ team.pasted }}/{{ team.total }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.groups {
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

.mode-switch {
  display: flex;
  background: var(--color-bg-sunken);
  border-radius: var(--radius-md);
  padding: 2px;
}

.mode-btn {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.mode-btn.active {
  background: var(--color-bg-elevated);
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.group-section + .group-section,
.scroll-section + .scroll-section {
  margin-top: var(--space-3);
}

.group-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.group-progress {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.team-list {
  margin-top: var(--space-2);
}

.team-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
}

.flag {
  font-size: 20px;
}

.team-name {
  flex: 1;
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-bar {
  width: 60px;
  height: 5px;
  border-radius: var(--radius-pill);
  background: var(--color-border);
  overflow: hidden;
}

.team-bar-fill {
  display: block;
  height: 100%;
  background: var(--color-accent);
}

.team-count {
  font-size: 11px;
  color: var(--color-text-secondary);
  width: 40px;
  text-align: right;
}

h2 {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
}

.scroll-row {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-2);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-3);
  color: var(--color-text-secondary);
}

.search-box input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 14px;
}
</style>
