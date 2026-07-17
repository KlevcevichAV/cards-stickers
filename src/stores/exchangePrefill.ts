import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StickerEntry } from '@/types/models'

export interface ExchangePrefill {
  giving: StickerEntry[]
  wanting: StickerEntry[]
}

/**
 * Transient handoff from Trade Analysis's "Create exchange" action to the New
 * Exchange form — there's no page-to-page object passing in a web SPA the way
 * the iOS app could push a pre-filled sheet, so this small store bridges it.
 */
export const useExchangePrefillStore = defineStore('exchangePrefill', () => {
  const pending = ref<ExchangePrefill | null>(null)

  function set(payload: ExchangePrefill) {
    pending.value = payload
  }

  function consume(): ExchangePrefill | null {
    const value = pending.value
    pending.value = null
    return value
  }

  return { pending, set, consume }
})
