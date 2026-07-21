<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { useAlbumStore } from '@/stores/album'
import ProgressRing from '@/components/ProgressRing.vue'
import StickerCell from '@/components/StickerCell.vue'

const album = useAlbumStore()
const { locale } = useI18n()
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
</style>
