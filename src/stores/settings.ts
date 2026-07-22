import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { i18n, resolveLocale, SETTINGS_LANGUAGE_KEY, type LanguagePreference } from '@/i18n'

export const STORAGE_PREFIX = 'stw26.'

function loadString(key: string, fallback: string): string {
  return localStorage.getItem(STORAGE_PREFIX + key) ?? fallback
}

function persistOn(key: string, source: ReturnType<typeof ref>) {
  watch(source, (value) => localStorage.setItem(STORAGE_PREFIX + key, String(value)), { deep: true })
}

export type GroupsViewMode = 'list' | 'scroll' | 'alpha'
const GROUPS_VIEW_MODES: GroupsViewMode[] = ['list', 'scroll', 'alpha']

function loadGroupsViewMode(): GroupsViewMode {
  const stored = loadString('groupsViewMode', 'list')
  return GROUPS_VIEW_MODES.includes(stored as GroupsViewMode) ? (stored as GroupsViewMode) : 'list'
}

/**
 * Settings persisted to localStorage (flat key-value, unlike the relational
 * Dexie data): language and the trade-message meeting location.
 */
export const useSettingsStore = defineStore('settings', () => {
  const language = ref((localStorage.getItem(SETTINGS_LANGUAGE_KEY) as LanguagePreference | null) ?? 'system')
  const tradeMessageLocation = ref(loadString('tradeMessageLocation', ''))
  const marketMessagePrice = ref(loadString('marketMessagePrice', ''))
  const groupsViewMode = ref<GroupsViewMode>(loadGroupsViewMode())
  const hasSeenOnboarding = ref(loadString('hasSeenOnboarding', 'false') === 'true')

  watch(
    language,
    (value) => {
      localStorage.setItem(SETTINGS_LANGUAGE_KEY, value)
      i18n.global.locale.value = resolveLocale(value)
    },
    { immediate: true },
  )
  persistOn('tradeMessageLocation', tradeMessageLocation)
  persistOn('marketMessagePrice', marketMessagePrice)
  persistOn('groupsViewMode', groupsViewMode)
  persistOn('hasSeenOnboarding', hasSeenOnboarding)

  return {
    language,
    tradeMessageLocation,
    marketMessagePrice,
    groupsViewMode,
    hasSeenOnboarding,
  }
})
