<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Copy } from '@lucide/vue'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'
import { useFinanceStore } from '@/stores/finance'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const album = useAlbumStore()
const exchangesStore = useExchangesStore()
const finance = useFinanceStore()
const settings = useSettingsStore()
const copied = ref(false)

/** The standalone "Panini Logo" team has exactly one sticker — no number to list, just its own code. */
const STANDALONE_LOGO_TEAM_CODE = '00'

function buildBlock(predicate: (sticker: { status: string; duplicateCount: number; teamCode: string; number: number; id: string }) => boolean) {
  const lines: string[] = []
  for (const team of album.teams) {
    const stickers = (album.stickersByTeam.get(team.code) ?? []).filter(predicate)
    if (stickers.length === 0) continue
    if (team.code === STANDALONE_LOGO_TEAM_CODE) {
      lines.push(`${team.flagEmoji} ${team.code}`)
      continue
    }
    const numbers = stickers
      .map((s) => (s.duplicateCount > 1 ? `${s.number}(x${s.duplicateCount})` : `${s.number}`))
      .join(', ')
    lines.push(`${team.flagEmoji} ${team.code}: ${numbers}`)
  }
  return lines.join('\n')
}

const lookingForText = computed(() =>
  buildBlock((s) => s.status === 'missing' && exchangesStore.incomingCount(s.id) === 0),
)

const duplicatesText = computed(() =>
  buildBlock((s) => s.duplicateCount > exchangesStore.reservedCount(s.id) + finance.reservedForSaleCount(s.id)),
)

/** Fixed message template — see TradeMessageView spec: no user prefix/suffix, just the location line. */
const messageText = computed(() => {
  const parts = [t('tradeMessage.templateTitle'), t('tradeMessage.templateSubtitle')]

  if (lookingForText.value) {
    parts.push('', t('tradeMessage.lookingForHeader'), lookingForText.value)
  }
  if (duplicatesText.value) {
    parts.push('', t('tradeMessage.duplicatesHeader'), duplicatesText.value)
  }
  if (settings.tradeMessageLocation.trim()) {
    parts.push('', `📍 ${settings.tradeMessageLocation.trim()}`)
  }

  return parts.join('\n')
})

async function copy() {
  await navigator.clipboard.writeText(messageText.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="trade-message">
    <h1>{{ t('nav.tradeMessage') }}</h1>

    <section class="settings-block">
      <label class="field-label" for="trade-message-location">{{ t('tradeMessage.locationLabel') }}</label>
      <input
        id="trade-message-location"
        v-model="settings.tradeMessageLocation"
        type="text"
        class="text-field"
        :placeholder="t('tradeMessage.locationPlaceholder')"
      />
    </section>

    <section class="block">
      <pre class="block-text">{{ messageText }}</pre>
    </section>

    <button class="btn primary" @click="copy">
      <Copy :size="14" /> {{ copied ? t('tradeMessage.copied') : t('tradeMessage.copy') }}
    </button>
  </div>
</template>

<style scoped>
.trade-message {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 22px;
  margin: 0 0 var(--space-4);
}

.settings-block {
  background: var(--color-bg-sunken);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: 13px;
  font-weight: 500;
}

.text-field {
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
}

.block {
  margin-bottom: var(--space-4);
}

.block-text {
  white-space: pre-wrap;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: 13px;
  font-family: inherit;
  box-shadow: var(--shadow-sm);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-weight: 600;
}

.btn.primary {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}
</style>
