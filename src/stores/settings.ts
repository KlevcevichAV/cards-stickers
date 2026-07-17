import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { i18n, resolveLocale, SETTINGS_LANGUAGE_KEY, type LanguagePreference } from '@/i18n'

const STORAGE_PREFIX = 'stw26.'

function loadString(key: string, fallback: string): string {
  return localStorage.getItem(STORAGE_PREFIX + key) ?? fallback
}

function persistOn(key: string, source: ReturnType<typeof ref>) {
  watch(source, (value) => localStorage.setItem(STORAGE_PREFIX + key, String(value)), { deep: true })
}

/**
 * Settings persisted to localStorage (flat key-value, unlike the relational
 * Dexie data): language and the trade-message meeting location.
 */
export const useSettingsStore = defineStore('settings', () => {
  const language = ref((localStorage.getItem(SETTINGS_LANGUAGE_KEY) as LanguagePreference | null) ?? 'system')
  const tradeMessageLocation = ref(loadString('tradeMessageLocation', ''))

  watch(
    language,
    (value) => {
      localStorage.setItem(SETTINGS_LANGUAGE_KEY, value)
      i18n.global.locale.value = resolveLocale(value)
    },
    { immediate: true },
  )
  persistOn('tradeMessageLocation', tradeMessageLocation)

  return {
    language,
    tradeMessageLocation,
  }
})
