import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import MarketMessageView from '@/views/MarketMessageView.vue'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  return { pinia, i18n }
}

describe('MarketMessageView', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('buy mode: lists missing stickers under a "#Buy" template', async () => {
    const { pinia, i18n } = setup()
    await useAlbumStore().load()

    const wrapper = mount(MarketMessageView, { props: { mode: 'buy' }, global: { plugins: [pinia, i18n] } })
    const text = wrapper.find('pre.block-text').text()

    expect(text.startsWith('#Buy\n✅ Collection: Panini WC 2026 Stickers')).toBe(true)
    expect(text).toContain('🔍 Looking to buy:')
    expect(text).toContain('🇦🇷 ARG:')
    // Fresh seed has nothing to sell yet, and the sell section must not appear at all.
    expect(text).not.toContain('Selling:')
  })

  it('sell mode: lists spare duplicates under a "#Sell" template', async () => {
    const { pinia, i18n } = setup()
    const album = useAlbumStore()
    await album.load()
    await album.paste('ARG17')
    await album.addDuplicate('ARG17')

    const wrapper = mount(MarketMessageView, { props: { mode: 'sell' }, global: { plugins: [pinia, i18n] } })
    const text = wrapper.find('pre.block-text').text()

    expect(text.startsWith('#Sell\n✅ Collection: Panini WC 2026 Stickers')).toBe(true)
    expect(text).toContain('🔍 Selling:')
    expect(text).toContain('🇦🇷 ARG: 17')
    expect(text).not.toContain('Looking to buy:')
  })

  it('includes the price and location lines only once entered, with the right prefixes', async () => {
    const { pinia, i18n } = setup()
    await useAlbumStore().load()

    const wrapper = mount(MarketMessageView, { props: { mode: 'sell' }, global: { plugins: [pinia, i18n] } })
    let text = wrapper.find('pre.block-text').text()
    expect(text).not.toContain('PRICE')
    expect(text).not.toContain('City / Delivery')

    await wrapper.find('#market-message-price').setValue('$1 each')
    await wrapper.find('#market-message-location').setValue('#Minsk')
    await wrapper.vm.$nextTick()

    text = wrapper.find('pre.block-text').text()
    expect(text).toContain('💰 PRICE: $1 each')
    expect(text).toContain('📍 City / Delivery: #Minsk')
  })
})
