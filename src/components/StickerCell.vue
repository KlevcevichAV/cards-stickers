<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Shield, Camera, User, Repeat2, Plus, Minus } from '@lucide/vue'
import type { Sticker } from '@/types/models'
import { useAlbumStore } from '@/stores/album'

const props = defineProps<{ sticker: Sticker }>()

const { t } = useI18n()
const album = useAlbumStore()

/** The standalone "Panini Logo" sticker is its own one-sticker team (id "00", number 0) — show "00", not "0". */
const STANDALONE_LOGO_TEAM_CODE = '00'
const displayNumber = computed(() =>
  props.sticker.teamCode === STANDALONE_LOGO_TEAM_CODE ? STANDALONE_LOGO_TEAM_CODE : props.sticker.number,
)

const typeIcon = computed(() => {
  switch (props.sticker.type) {
    case 'logo':
      return Shield
    case 'teamPhoto':
      return Camera
    default:
      return User
  }
})

const reservedCount = computed(() => album.reservedCount(props.sticker.id))
const incomingCount = computed(() => album.incomingCount(props.sticker.id))
const isSnapping = computed(() => album.justPastedId === props.sticker.id)

function increment() {
  if (props.sticker.status === 'missing') {
    album.paste(props.sticker.id)
  } else {
    album.addDuplicate(props.sticker.id)
  }
}

function decrement() {
  if (props.sticker.status === 'missing') return
  if (props.sticker.duplicateCount > 0) {
    album.removeDuplicate(props.sticker.id)
  } else {
    album.remove(props.sticker.id)
  }
}

function onAnimationEnd() {
  if (isSnapping.value) album.justPastedId = null
}
</script>

<template>
  <div class="cell-wrap">
    <div
      class="cell"
      :class="[`status-${sticker.status}`, `type-${sticker.type}`, { foil: sticker.isFoil, snap: isSnapping }]"
      @animationend="onAnimationEnd"
    >
      <span v-if="sticker.isFoil" class="foil-sheen" aria-hidden="true" />

      <span v-if="incomingCount > 0" class="badge badge-incoming">
        <Repeat2 :size="10" />
      </span>
      <span v-if="sticker.duplicateCount > 0" class="badge badge-dup">×{{ sticker.duplicateCount }}</span>
      <span v-else-if="reservedCount > 0" class="badge badge-reserved">
        <Repeat2 :size="10" />{{ reservedCount }}
      </span>

      <component :is="typeIcon" :size="14" class="type-icon" />
      <span class="number">{{ displayNumber }}</span>
    </div>

    <div class="qty-controls">
      <button
        type="button"
        class="qty-btn minus"
        :disabled="sticker.status === 'missing'"
        :aria-label="t('sticker.remove')"
        @click="decrement"
      >
        <Minus :size="10" />
      </button>
      <button type="button" class="qty-btn plus" :aria-label="t('sticker.addDuplicate')" @click="increment">
        <Plus :size="10" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.cell-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
  border: 1.5px solid var(--color-missing-border);
  background: var(--color-missing-bg);
  color: var(--color-text-tertiary);
}

.number {
  font-size: 12px;
  font-weight: 600;
}

.type-icon {
  opacity: 0.7;
}

.status-pasted,
.status-duplicate {
  border-style: solid;
  border-color: transparent;
  color: #fff;
}

.status-pasted.type-logo,
.status-duplicate.type-logo {
  background: linear-gradient(145deg, var(--color-team-logo), color-mix(in srgb, var(--color-team-logo) 70%, black));
}

.status-pasted.type-teamPhoto,
.status-duplicate.type-teamPhoto {
  background: linear-gradient(
    145deg,
    var(--color-team-photo),
    color-mix(in srgb, var(--color-team-photo) 70%, black)
  );
}

.status-pasted.type-player,
.status-duplicate.type-player {
  background: linear-gradient(
    145deg,
    var(--color-team-player),
    color-mix(in srgb, var(--color-team-player) 70%, black)
  );
}

.badge {
  position: absolute;
  top: 2px;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  padding: 3px 4px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  gap: 1px;
}

.badge-dup {
  right: 2px;
  background: var(--color-danger);
  color: #fff;
}

.badge-reserved {
  right: 2px;
  background: var(--color-warning);
  color: #fff;
}

.badge-incoming {
  left: 2px;
  background: var(--color-accent);
  color: #fff;
}

.foil {
  border-color: var(--color-foil);
  box-shadow: 0 0 0 1px var(--color-foil);
}

.foil-sheen {
  position: absolute;
  inset: -50%;
  background: linear-gradient(
    115deg,
    transparent 30%,
    color-mix(in srgb, var(--color-foil) 55%, white) 48%,
    transparent 65%
  );
  animation: sheen 3.2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes sheen {
  0% {
    transform: translateX(-40%) translateY(-10%);
  }
  100% {
    transform: translateX(40%) translateY(10%);
  }
}

.snap {
  animation: snap-pop 0.4s ease;
  z-index: 1;
}

@keyframes snap-pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.25) translateY(-6px);
    box-shadow: 0 0 16px 4px color-mix(in srgb, var(--color-accent) 60%, transparent);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .foil-sheen {
    animation: none;
  }
  .snap {
    animation: none;
  }
}

.qty-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.qty-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.qty-btn:disabled {
  opacity: 0.3;
}

.qty-btn.plus {
  color: var(--color-accent);
}

.qty-btn.minus {
  color: var(--color-danger);
}
</style>
