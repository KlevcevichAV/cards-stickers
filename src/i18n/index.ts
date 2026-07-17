import { createI18n } from 'vue-i18n'
import en from './locales/en'
import ru from './locales/ru'

export type AppLocale = 'en' | 'ru'
export type LanguagePreference = 'system' | AppLocale
export const SETTINGS_LANGUAGE_KEY = 'stw26.language'

export function resolveLocale(preference: LanguagePreference): AppLocale {
  if (preference === 'en' || preference === 'ru') return preference
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

function detectInitialLocale(): AppLocale {
  const stored = localStorage.getItem(SETTINGS_LANGUAGE_KEY) as LanguagePreference | null
  return resolveLocale(stored ?? 'system')
}

export const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, ru },
})
