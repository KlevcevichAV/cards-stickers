<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Search, X } from '@lucide/vue'
import { useAlbumStore, type TeamStat } from '@/stores/album'
import ProgressRing from '@/components/ProgressRing.vue'
import StickerCell from '@/components/StickerCell.vue'

const album = useAlbumStore()
const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

const currentIndex = ref(0)
const totalPages = computed(() => album.pages.length)
const currentPage = computed(() => album.pages[currentIndex.value])

function goTo(index: number) {
  if (index < 0 || index >= totalPages.value) return
  currentIndex.value = index
}

// Rendering every team's page (and every one of its ~20 stickers) at once means
// ~1000 StickerCell instances sitting in the DOM simultaneously, which is what made
// swiping feel sluggish on phones. Only the current page and its immediate
// neighbors (needed for the drag preview) are ever mounted; the rest are windowed
// out and mount lazily as the user pages past them.
const visibleIndices = computed(() => {
  const indices: number[] = []
  for (let i = currentIndex.value - 1; i <= currentIndex.value + 1; i++) {
    if (i >= 0 && i < totalPages.value) indices.push(i)
  }
  return indices
})

const visiblePages = computed(() => visibleIndices.value.map((i) => album.pages[i]))

// Where the current page sits within the (at most 3) currently-mounted slots.
const currentSlot = computed(() => visibleIndices.value.indexOf(currentIndex.value))

// Deep-link support: /album?team=ARG, used by Groups/Stats/Duplicates.
watch(
  () => route.query.team,
  (team) => {
    if (typeof team !== 'string') return
    const index = album.pageIndexByCode.get(team)
    if (index !== undefined) currentIndex.value = index
    router.replace({ path: '/album' })
  },
  { immediate: true },
)

// --- Pointer-drag swipe -------------------------------------------------
const trackOffset = ref(0)
const dragging = ref(false)
let startX = 0
let containerWidth = 0

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  startX = e.clientX
  containerWidth = (e.currentTarget as HTMLElement).clientWidth
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  trackOffset.value = e.clientX - startX
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  const threshold = containerWidth * 0.18
  if (trackOffset.value > threshold) {
    goTo(currentIndex.value - 1)
  } else if (trackOffset.value < -threshold) {
    goTo(currentIndex.value + 1)
  }
  trackOffset.value = 0
}

const trackStyle = computed(() => {
  const base = -currentSlot.value * 100
  const dragPercent = containerWidth > 0 ? (trackOffset.value / containerWidth) * 100 : 0
  return {
    transform: `translateX(${base + dragPercent}%)`,
    transition: dragging.value ? 'none' : 'transform 0.3s ease',
  }
})

function teamName(team: { nameEN: string; nameRU: string }) {
  return locale.value === 'ru' ? team.nameRU : team.nameEN
}

// --- Team search ----------------------------------------------------------
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInputEl = ref<HTMLInputElement | null>(null)

const searchResults = computed<TeamStat[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return album.teamStats
  return album.teamStats.filter(
    (team) => teamName(team).toLowerCase().includes(query) || team.code.toLowerCase().includes(query),
  )
})

async function openSearch() {
  searchQuery.value = ''
  searchOpen.value = true
  await nextTick()
  searchInputEl.value?.focus()
}

function closeSearch() {
  searchOpen.value = false
}

function selectTeam(code: string) {
  const index = album.pageIndexByCode.get(code)
  if (index !== undefined) currentIndex.value = index
  closeSearch()
}
</script>

<template>
  <div v-if="currentPage" class="album">
    <header class="page-header">
      <div class="team-info">
        <span class="flag">{{ currentPage.team.flagEmoji }}</span>
        <div class="names">
          <div class="name">{{ teamName(currentPage.team) }}</div>
          <div class="group">
            {{ ['00', 'FWC'].includes(currentPage.team.groupLetter) ? '—' : `Group ${currentPage.team.groupLetter}` }}
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" :aria-label="t('album.searchTeam')" @click="openSearch">
          <Search :size="20" />
        </button>
        <div class="ring-badge">
          <ProgressRing
            :percent="
              (album.teamStat(currentPage.team.code)?.pasted ?? 0) /
              Math.max(1, album.teamStat(currentPage.team.code)?.total ?? 1)
            "
            :size="40"
          />
          <span class="ring-label">
            {{ album.teamStat(currentPage.team.code)?.pasted ?? 0 }}/{{
              album.teamStat(currentPage.team.code)?.total ?? 0
            }}
          </span>
        </div>
      </div>
    </header>

    <div
      class="carousel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="track" :style="trackStyle">
        <div
          v-for="page in visiblePages"
          :key="page.team.code"
          class="page"
          :class="{ compact: page.stickers.length !== 20, current: page === currentPage }"
        >
          <div class="grid">
            <StickerCell v-for="sticker in page.stickers" :key="sticker.id" :sticker="sticker" />
          </div>
        </div>
      </div>
    </div>

    <footer class="nav-bar">
      <button
        class="nav-btn"
        :disabled="currentIndex === 0"
        :aria-label="$t('album.prevPage')"
        @click="goTo(currentIndex - 1)"
      >
        <ChevronLeft :size="20" />
      </button>
      <span class="progress-text">
        {{ $t('album.pastedOfTotal', { pasted: album.totalPasted, total: album.totalStickers }) }}
        · {{ Math.round(album.albumPercent * 100) }}%
      </span>
      <button
        class="nav-btn"
        :disabled="currentIndex === totalPages - 1"
        :aria-label="$t('album.nextPage')"
        @click="goTo(currentIndex + 1)"
      >
        <ChevronRight :size="20" />
      </button>
    </footer>

    <div v-if="searchOpen" class="search-overlay">
      <div class="search-header">
        <div class="search-box">
          <Search :size="16" />
          <input
            ref="searchInputEl"
            v-model="searchQuery"
            type="search"
            :placeholder="t('common.search')"
          />
        </div>
        <button class="icon-btn" :aria-label="t('common.cancel')" @click="closeSearch">
          <X :size="20" />
        </button>
      </div>
      <ul class="search-results">
        <li v-for="team in searchResults" :key="team.code">
          <button class="result-row" @click="selectTeam(team.code)">
            <span class="flag">{{ team.flagEmoji }}</span>
            <span class="team-name">{{ teamName(team) }}</span>
            <span class="team-code">{{ team.code }}</span>
            <span class="team-count">{{ team.pasted }}/{{ team.total }}</span>
          </button>
        </li>
      </ul>
      <p v-if="searchResults.length === 0" class="no-results">{{ t('album.noResults') }}</p>
    </div>
  </div>
</template>

<style scoped>
.album {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100dvh - 56px);
  background: var(--color-bg-sunken);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
}

.team-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.flag {
  font-size: 32px;
  line-height: 1;
}

.names {
  min-width: 0;
}

.name {
  font-weight: 700;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.ring-badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-label {
  position: absolute;
  font-size: 9px;
  font-weight: 700;
}

.carousel {
  flex: 1;
  overflow: hidden;
  touch-action: pan-y;
}

.track {
  display: flex;
  height: 100%;
  width: 100%;
  will-change: transform;
}

.page {
  flex: 0 0 100%;
  width: 100%;
  padding: var(--space-4);
  overflow-y: auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  max-width: 480px;
  margin: 0 auto;
}

/* Pages whose team doesn't have a full 20 stickers (e.g. the standalone logo
   page or FWC) leave a dangling incomplete row / lone cell in a plain grid.
   Center them instead, both as a group and within the leftover row. */
.page.compact {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.page.compact .grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  /* An explicit width is required: with auto side-margins (for centering) inside
     a column flex parent, `align-items: stretch` is disabled and the grid would
     otherwise shrink-to-fit its content, collapsing the % flex-basis below. */
  width: 100%;
}

.page.compact .grid :deep(.cell-wrap) {
  flex: 0 0 calc((100% - 3 * var(--space-2)) / 4);
}

/* The prev/next neighbor pages stay mounted (for the swipe preview) but are never
   seen mid-animation, so their foil sheen loops are wasted GPU work every frame —
   pause them and let only the on-screen page animate. */
.page:not(.current) :deep(.foil-sheen) {
  animation-play-state: paused;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border);
  /* The app shell scrolls the whole document rather than clipping .album's height
     (so a team page taller than the viewport doesn't force a fixed inner scroll
     area), which otherwise leaves this footer wherever the page's natural flow
     puts it — below the fold on a tall page. Stick it to the viewport instead, so
     the pager is always reachable without scrolling past the sticker grid.
     56px mirrors TabBar's own height (see .album's min-height above). */
  position: sticky;
  bottom: 56px;
  z-index: var(--z-shell);
}

@media (min-width: 900px) {
  .nav-bar {
    /* No TabBar to dock above on desktop (Sidebar is used instead). */
    bottom: 0;
  }
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-sunken);
  color: var(--color-text);
}

.nav-btn:disabled {
  opacity: 0.35;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* Fixed (not absolute) so it reliably covers the full viewport regardless of
   where the document happens to be scrolled to when search is opened — see the
   .nav-bar comment above for why .album's own box can't be relied on for this. */
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-shell);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated);
  padding-top: var(--safe-top);
}

.search-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-sunken);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-secondary);
}

.search-box input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--color-text);
  /* iOS Safari auto-zooms the page on focus for any input with a computed
     font-size under 16px — keep this at 16px to avoid that. */
  font-size: 16px;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) 0 calc(var(--space-4) + var(--safe-bottom));
}

.result-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
}

.result-row .flag {
  font-size: 24px;
}

.result-row .team-name {
  flex: 1;
  text-align: left;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-row .team-code {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.result-row .team-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  width: 40px;
  text-align: right;
}

.no-results {
  padding: var(--space-6) var(--space-4);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
