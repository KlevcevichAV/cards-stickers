<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDownAZ, ListOrdered, Minus } from '@lucide/vue'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'
import { useFinanceStore } from '@/stores/finance'
import type { Sticker, Team } from '@/types/models'

type SortMode = 'album' | 'alpha'

const album = useAlbumStore()
const exchanges = useExchangesStore()
const finance = useFinanceStore()
const { locale, t } = useI18n()

const sort = ref<SortMode>('album')
const expanded = ref<Set<string>>(new Set())

function teamName(team: Team) {
  return locale.value === 'ru' ? team.nameRU : team.nameEN
}

function toggle(code: string) {
  const next = new Set(expanded.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  expanded.value = next
}

interface TeamGroup {
  team: Team
  stickers: Sticker[]
}

const teamGroups = computed<TeamGroup[]>(() => {
  const groups: TeamGroup[] = []
  for (const team of album.teams) {
    const dupes = (album.stickersByTeam.get(team.code) ?? []).filter((s) => s.duplicateCount > 0)
    if (dupes.length > 0) groups.push({ team, stickers: dupes })
  }
  if (sort.value === 'alpha') {
    return [...groups].sort((a, b) => teamName(a.team).localeCompare(teamName(b.team)))
  }
  return groups.sort((a, b) => a.team.orderIndex - b.team.orderIndex)
})

const totalDuplicateStickers = computed(() => teamGroups.value.reduce((sum, g) => sum + g.stickers.length, 0))
</script>

<template>
  <div class="duplicates">
    <header class="header">
      <h1>{{ $t('nav.duplicates') }}</h1>
      <div class="sort-switch">
        <button
          class="sort-btn"
          :class="{ active: sort === 'album' }"
          :aria-label="t('duplicates.sortAlbum')"
          @click="sort = 'album'"
        >
          <ListOrdered :size="16" />
        </button>
        <button
          class="sort-btn"
          :class="{ active: sort === 'alpha' }"
          :aria-label="t('duplicates.sortAlpha')"
          @click="sort = 'alpha'"
        >
          <ArrowDownAZ :size="16" />
        </button>
      </div>
    </header>

    <p v-if="totalDuplicateStickers === 0" class="empty">{{ $t('duplicates.empty') }}</p>

    <section v-for="group in teamGroups" :key="group.team.code" class="team-group">
      <button class="team-header" @click="toggle(group.team.code)">
        <span class="flag">{{ group.team.flagEmoji }}</span>
        <span class="team-name">{{ teamName(group.team) }}</span>
        <span class="team-count">{{ group.stickers.length }}</span>
      </button>
      <ul v-if="expanded.has(group.team.code)" class="sticker-list">
        <li v-for="sticker in group.stickers" :key="sticker.id" class="sticker-row">
          <span class="sticker-info">
            <span v-if="sticker.teamCode !== '00'" class="sticker-number">#{{ sticker.number }}</span>
            <span class="sticker-name">{{ sticker.nameEN }}</span>
          </span>
          <span class="badge">×{{ sticker.duplicateCount }}</span>
          <span v-if="exchanges.reservedCount(sticker.id) > 0" class="reserved-label">
            {{ $t('duplicates.inExchange', { count: exchanges.reservedCount(sticker.id) }) }}
          </span>
          <span v-if="finance.reservedForSaleCount(sticker.id) > 0" class="reserved-label for-sale">
            {{ $t('duplicates.forSale', { count: finance.reservedForSaleCount(sticker.id) }) }}
          </span>
          <button class="minus-btn" @click="album.removeDuplicate(sticker.id)">
            <Minus :size="14" />
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.duplicates {
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

.sort-switch {
  display: flex;
  background: var(--color-bg-sunken);
  border-radius: var(--radius-md);
  padding: 2px;
}

.sort-btn {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.sort-btn.active {
  background: var(--color-bg-elevated);
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.empty {
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--space-6) 0;
}

.team-group + .team-group {
  margin-top: var(--space-2);
}

.team-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.flag {
  font-size: 18px;
}

.team-name {
  flex: 1;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
}

.team-count {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.sticker-list {
  margin-top: 4px;
}

.sticker-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
}

.sticker-info {
  flex: 1;
  display: flex;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
}

.sticker-number {
  color: var(--color-text-secondary);
}

.sticker-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--color-danger);
  border-radius: var(--radius-pill);
  padding: 2px 6px;
}

.reserved-label {
  font-size: 10px;
  color: var(--color-warning);
}

.reserved-label.for-sale {
  color: var(--color-accent);
}

.minus-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-sunken);
}
</style>
