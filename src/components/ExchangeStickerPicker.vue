<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Plus, Minus } from '@lucide/vue'
import { useAlbumStore } from '@/stores/album'
import { stickerIdFor, stickerIdForEntry, stickerLabelFor } from '@/services/stickerId'
import type { StickerEntry } from '@/types/models'

const props = defineProps<{ mode: 'giving' | 'wanting'; modelValue: StickerEntry[] }>()
const emit = defineEmits<{ 'update:modelValue': [StickerEntry[]] }>()

const album = useAlbumStore()
const { locale } = useI18n()
const selectedTeam = ref<string>(album.teams[0]?.code ?? '')

function teamName(team: { nameEN: string; nameRU: string }) {
  return locale.value === 'ru' ? team.nameRU : team.nameEN
}

const currentTeamStickers = computed(() =>
  (album.stickersByTeam.get(selectedTeam.value) ?? []).slice().sort((a, b) => a.number - b.number),
)

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

function isDisabled(number: number): boolean {
  if (props.mode !== 'giving') return false
  const sticker = album.stickers.get(stickerIdFor(selectedTeam.value, number))
  return !sticker || sticker.duplicateCount === 0
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
    <select v-model="selectedTeam" class="team-select">
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
        :class="{ selected: !!entryFor(sticker.teamCode, sticker.number), disabled: isDisabled(sticker.number) }"
        :disabled="isDisabled(sticker.number)"
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

.number-btn.disabled {
  opacity: 0.35;
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
