import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { useAchievementsStore } from '@/stores/achievements'
import AchievementsView from '@/views/AchievementsView.vue'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  return { pinia, i18n }
}

describe('AchievementsView', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('shows 0/67 locked achievements before anything is unlocked', async () => {
    const { pinia, i18n } = setup()
    await useAlbumStore().load()
    await useAchievementsStore().load()

    const wrapper = mount(AchievementsView, { global: { plugins: [pinia, i18n] } })
    expect(wrapper.text()).toContain('0 / 67')
    expect(wrapper.text()).toContain('El Capitán / GOAT')
    expect(wrapper.findAll('.card.locked').length).toBe(67)
  })

  it('reflects an unlocked achievement with its unlock date', async () => {
    const { pinia, i18n } = setup()
    const album = useAlbumStore()
    const achievementsStore = useAchievementsStore()
    await album.load()
    await achievementsStore.load()
    await album.paste('ARG17')

    const wrapper = mount(AchievementsView, { global: { plugins: [pinia, i18n] } })
    expect(wrapper.text()).toContain('2 / 67') // star_messi + first_sticker
    expect(wrapper.findAll('.card.locked').length).toBe(65)
  })
})
