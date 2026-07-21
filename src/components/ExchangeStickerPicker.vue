<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Plus, Minus, Check } from '@lucide/vue'
import { useAlbumStore } from '@/stores/album'
import { stickerIdFor, stickerIdForEntry, stickerLabelFor } from '@/services/stickerId'
import type { StickerEntry, Team } from '@/types/models'

const props = defineProps<{ mode: 'giving' | 'wanting'; modelValue: StickerEntry[] }>()
const emit = defineEmits<{ 'update:modelValue': [StickerEntry[]] }>()

const album = useAlbumStore()
const { t, locale } = useI18n()

function teamName(team: { nameEN: string; nameRU: string }) {
  return locale.value === 'ru' ? team.nameRU : team.nameEN
}

function teamHasDuplicates(code: string): boolean {
  return (album.stickersByTeam.get(code) ?? []).some((s) => s.duplicateCount > 0)
}

// In "giving" mode, default to the first team that actually has a spare duplicate —
// otherwise the picker would open on an empty grid for whatever team sorts first.
const firstSelectableTeam =
  props.mode === 'giving' ? album.teams.find((team) => teamHasDuplicates(team.code)) : album.teams[0]
const selectedTeam = ref<string>(firstSelectableTeam?.code ?? '')
const teamQuery = ref(firstSelectableTeam ? teamName(firstSelectableTeam) : '')
const teamDropdownOpen = ref(false)
// The input starts pre-filled with the selected team's name, which — if that text were
// also used as the filter right away — would make the freshly-opened dropdown look like
// there's only ever that one option. Only start filtering once the user actually edits it.
const isFiltering = ref(false)

interface TeamOption {
  team: Team
  hasDuplicates: boolean
}

// With nothing typed (or just opened), show every team worth picking from (they have a
// spare duplicate), with whichever one is already selected pinned to the top. Once the
// user types something, also surface matching teams *without* duplicates — disabled,
// with a note — so typing a known team name never looks like a dead end.
const teamOptions = computed<TeamOption[]>(() => {
  const query = isFiltering.value ? teamQuery.value.trim().toLowerCase() : ''
  const list = !query
    ? album.teams.filter((team) => teamHasDuplicates(team.code)).map((team) => ({ team, hasDuplicates: true }))
    : album.teams
        .filter((team) => teamName(team).toLowerCase().includes(query) || team.code.toLowerCase().includes(query))
        .map((team) => ({ team, hasDuplicates: teamHasDuplicates(team.code) }))

  const selectedIndex = list.findIndex((opt) => opt.team.code === selectedTeam.value)
  if (selectedIndex > 0) list.unshift(list.splice(selectedIndex, 1)[0])
  return list
})

const hasAnyDuplicates = computed(() => album.teams.some((team) => teamHasDuplicates(team.code)))

function chooseTeam(option: TeamOption) {
  selectedTeam.value = option.team.code
  teamQuery.value = teamName(option.team)
  teamDropdownOpen.value = false
  isFiltering.value = false
}

function onTeamSearchFocus(e: Event) {
  teamDropdownOpen.value = true
  isFiltering.value = false
  ;(e.target as HTMLInputElement).select()
}

function onTeamSearchInput() {
  isFiltering.value = true
}

const currentTeamStickers = computed(() => {
  const list = (album.stickersByTeam.get(selectedTeam.value) ?? []).slice().sort((a, b) => a.number - b.number)
  // The number grid only ever needs to offer stickers that can actually be given away.
  return props.mode === 'giving' ? list.filter((s) => s.duplicateCount > 0) : list
})

function entryFor(teamCode: string, number: number): StickerEntry | undefined {
  return props.modelValue.find((e) => e.teamCode === teamCode && e.number === number)
}

function setEntry(teamCode: string, number: number, count: number) {
  const rest = props.modelValue.filter((e) => !(e.teamCode === teamCode && e.number === number))
  const next = count > 0 ? [...rest, { teamCode, number, count }] : rest
  emit('update:modelValue', next)
}

function toggle(teamCode: string, number: number) {
  const existing = entryFor(teamCode, number)
  setEntry(teamCode, number, existing ? 0 : 1)
}

function maxFor(entry: StickerEntry): number {
  if (props.mode === 'wanting') return 20
  const sticker = album.stickers.get(stickerIdForEntry(entry))
  return sticker?.duplicateCount ?? 0
}

function bump(entry: StickerEntry, delta: number) {
  const next = Math.min(maxFor(entry), Math.max(0, entry.count + delta))
  setEntry(entry.teamCode, entry.number, next)
}

function badgeFor(number: number): string {
  const sticker = album.stickers.get(stickerIdFor(selectedTeam.value, number))
  if (!sticker) return ''
  if (props.mode === 'giving') return sticker.duplicateCount > 0 ? `×${sticker.duplicateCount}` : ''
  return sticker.status !== 'missing' ? '✓' : ''
}
</script>

<template>
  <div class="picker">
    <div v-if="mode === 'giving'" class="team-combobox">
      <input
        v-model="teamQuery"
        type="text"
        class="team-search"
        :placeholder="t('stickerPicker.searchTeamPlaceholder')"
        @focus="onTeamSearchFocus"
        @click="onTeamSearchFocus"
        @input="onTeamSearchInput"
        @blur="teamDropdownOpen = false"
      />
      <ul v-if="teamDropdownOpen" class="team-dropdown">
        <li v-for="opt in teamOptions" :key="opt.team.code">
          <button
            type="button"
            class="team-option"
            :class="{ disabled: !opt.hasDuplicates, current: opt.team.code === selectedTeam }"
            :disabled="!opt.hasDuplicates"
            @mousedown.prevent="chooseTeam(opt)"
          >
            <span class="flag">{{ opt.team.flagEmoji }}</span>
            <span class="name">{{ teamName(opt.team) }}</span>
            <span v-if="!opt.hasDuplicates" class="no-dupes-note">{{ t('stickerPicker.noDuplicates') }}</span>
            <Check v-else-if="opt.team.code === selectedTeam" :size="14" class="current-check" />
          </button>
        </li>
        <li v-if="teamOptions.length === 0" class="empty-note">{{ t('stickerPicker.noTeamsWithDuplicates') }}</li>
      </ul>
      <p v-if="!hasAnyDuplicates" class="empty-hint">{{ t('stickerPicker.noTeamsWithDuplicates') }}</p>
    </div>

    <select v-else v-model="selectedTeam" class="team-select">
      <option v-for="team in album.teams" :key="team.code" :value="team.code">
        {{ team.flagEmoji }} {{ teamName(team) }}
      </option>
    </select>

    <div class="number-grid">
      <button
        v-for="sticker in currentTeamStickers"
        :key="sticker.id"
        type="button"
        class="number-btn"
        :class="{ selected: !!entryFor(sticker.teamCode, sticker.number) }"
        @click="toggle(sticker.teamCode, sticker.number)"
      >
        {{ sticker.number }}
        <span v-if="badgeFor(sticker.number)" class="mini-badge">{{ badgeFor(sticker.number) }}</span>
      </button>
    </div>

    <ul v-if="modelValue.length > 0" class="selected-list">
      <li v-for="entry in modelValue" :key="`${entry.teamCode}-${entry.number}`" class="selected-chip">
        <span class="chip-label">{{ stickerLabelFor(entry.teamCode, entry.number) }}</span>
        <button type="button" class="stepper-btn" @click="bump(entry, -1)"><Minus :size="12" /></button>
        <span class="qty">{{ entry.count }}</span>
        <button type="button" class="stepper-btn" :disabled="entry.count >= maxFor(entry)" @click="bump(entry, 1)">
          <Plus :size="12" />
        </button>
        <button type="button" class="remove-btn" @click="setEntry(entry.teamCode, entry.number, 0)">
          <X :size="12" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.team-select {
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-bg-sunken);
  border: 1px solid var(--color-border);
}

.team-combobox {
  position: relative;
}

.team-search {
  width: 100%;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-bg-sunken);
  border: 1px solid var(--color-border);
  /* iOS Safari auto-zooms the page on focus for any input with a computed
     font-size under 16px — keep this at 16px to avoid that. */
  font-size: 16px;
}

.team-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 5;
  max-height: 220px;
  overflow-y: auto;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.team-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  text-align: left;
}

.team-option.disabled {
  opacity: 0.45;
}

.team-option.current .name {
  font-weight: 600;
}

.team-option .flag {
  font-size: 16px;
}

.team-option .name {
  flex: 1;
}

.current-check {
  color: var(--color-accent);
  flex-shrink: 0;
}

.no-dupes-note {
  font-size: 10px;
  color: var(--color-text-secondary);
}

.empty-note {
  padding: var(--space-2) var(--space-3);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.empty-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.number-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.number-btn {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  background: var(--color-bg-sunken);
  border: 1px solid var(--color-border);
  font-size: 13px;
  font-weight: 600;
}

.number-btn.selected {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  border-color: var(--color-accent);
}

.mini-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 8px;
  background: var(--color-warning);
  color: #fff;
  border-radius: var(--radius-pill);
  padding: 1px 3px;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--space-2);
}

.selected-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-bg-sunken);
  border-radius: var(--radius-pill);
  padding: 4px 6px;
  font-size: 12px;
}

.stepper-btn,
.remove-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
}

.remove-btn {
  color: var(--color-danger);
}

.qty {
  min-width: 14px;
  text-align: center;
  font-weight: 700;
}
</style>
