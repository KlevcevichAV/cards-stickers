import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'
import { router as appRouter } from '@/router'
import NewExchangeView from '@/views/exchange/NewExchangeView.vue'
import ExchangeListView from '@/views/exchange/ExchangeListView.vue'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
  return { pinia, i18n, router }
}

describe('Exchange flow via the UI', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('creates a new exchange by picking a wanting sticker and submitting the form', async () => {
    const { pinia, i18n, router } = setup()
    await useAlbumStore().load()
    const exchangesStore = useExchangesStore()
    await router.push('/exchange/new')
    await router.isReady()

    const wrapper = mount(NewExchangeView, { global: { plugins: [pinia, router, i18n] } })
    await wrapper.vm.$nextTick()

    // Two ExchangeStickerPicker instances: giving (0), wanting (1).
    const wantingPicker = wrapper.findAll('.picker')[1]
    // Team select defaults to the first team by orderIndex; pick its first sticker.
    const numberButtons = wantingPicker.findAll('button.number-btn')
    expect(numberButtons.length).toBeGreaterThan(0)
    await numberButtons[0].trigger('click')
    await wrapper.vm.$nextTick()

    // Scoped to .partner-row: the giving-mode picker's own team-search text input
    // (see ExchangeStickerPicker) now also matches a bare `input[type="text"]` selector.
    const partnerInput = wrapper.find('.partner-row input[type="text"]')
    await partnerInput.setValue('sam')

    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(exchangesStore.exchanges).toHaveLength(1))

    expect(exchangesStore.exchanges).toHaveLength(1)
    expect(exchangesStore.exchanges[0].partner).toBe('@sam')
    expect(exchangesStore.exchanges[0].wanting).toHaveLength(1)
  })

  it('lists an active exchange and completes it, updating the album', async () => {
    const { pinia, i18n, router } = setup()
    const album = useAlbumStore()
    await album.load()
    const exchangesStore = useExchangesStore()
    await exchangesStore.create({
      giving: [],
      wanting: [{ teamCode: 'BRA', number: 14, count: 1 }],
      partner: '@sam',
    })

    await router.push('/exchange')
    await router.isReady()
    const wrapper = mount(ExchangeListView, { global: { plugins: [pinia, router, i18n] } })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('@sam')

    await wrapper.find('button.row-summary').trigger('click')
    await wrapper.vm.$nextTick()

    const completeBtn = wrapper.findAll('button.action-btn.success')[0]
    expect(completeBtn).toBeTruthy()
    await completeBtn.trigger('click')
    await vi.waitFor(() => expect(exchangesStore.exchanges[0].status).toBe('completed'))

    expect(album.stickers.get('BRA14')?.status).toBe('pasted')
    expect(exchangesStore.exchanges[0].status).toBe('completed')
  })
})
