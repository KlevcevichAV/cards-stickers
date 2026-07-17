import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { i18n, SETTINGS_LANGUAGE_KEY } from '@/i18n'

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('defaults to "system" language and persists explicit choices', async () => {
    const settings = useSettingsStore()
    expect(settings.language).toBe('system')

    settings.language = 'ru'
    await nextTick()
    expect(localStorage.getItem(SETTINGS_LANGUAGE_KEY)).toBe('ru')
    expect(i18n.global.locale.value).toBe('ru')

    settings.language = 'en'
    await nextTick()
    expect(i18n.global.locale.value).toBe('en')
  })

  it('persists and reloads the trade-message location across store instances', async () => {
    const settings = useSettingsStore()
    settings.tradeMessageLocation = 'Minsk'
    await nextTick()

    setActivePinia(createPinia())
    const reloaded = useSettingsStore()
    expect(reloaded.tradeMessageLocation).toBe('Minsk')
  })
})
