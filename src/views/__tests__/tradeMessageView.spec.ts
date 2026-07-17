import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import TradeMessageView from '@/views/TradeMessageView.vue'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  return { pinia, i18n }
}

describe('TradeMessageView', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('lists the standalone "00" sticker as "✨ 00" — no colon, no number, no FWC', async () => {
    const { pinia, i18n } = setup()
    await useAlbumStore().load()

    const wrapper = mount(TradeMessageView, { global: { plugins: [pinia, i18n] } })
    const lookingForBlock = wrapper.findAll('pre.block-text')[0].text()
    const lines = lookingForBlock.split('\n')

    expect(lines).toContain('✨ 00')
    expect(lookingForBlock).not.toContain('00:')
    // Must never be merged into a "FWC:" line either.
    expect(lookingForBlock).not.toMatch(/FWC:[^\n]*\b0\b/)
  })

  it('prefixes FWC with the trophy emoji and countries with their flag', async () => {
    const { pinia, i18n } = setup()
    const album = useAlbumStore()
    await album.load()

    const wrapper = mount(TradeMessageView, { global: { plugins: [pinia, i18n] } })
    const lookingForBlock = wrapper.findAll('pre.block-text')[0].text()

    expect(lookingForBlock).toContain('🏆 FWC:')
    expect(lookingForBlock).toContain('🇦🇷 ARG:')
    expect(lookingForBlock).toContain('🇧🇷 BRA:')
  })
})
