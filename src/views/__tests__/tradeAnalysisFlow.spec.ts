import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { router as appRouter } from '@/router'
import TradeAnalysisView from '@/views/TradeAnalysisView.vue'
import NewExchangeView from '@/views/exchange/NewExchangeView.vue'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
  return { pinia, i18n, router }
}

describe('Trade Analysis → New Exchange handoff', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('analyzes a pasted message and prefills the New Exchange form on "Create exchange"', async () => {
    const { pinia, i18n, router } = setup()
    const album = useAlbumStore()
    await album.load()
    // We have a spare BRA14 (Vinícius) and are missing ARG17 (Messi).
    await album.paste('BRA14')
    await album.addDuplicate('BRA14')

    await router.push('/trade-analysis')
    await router.isReady()
    const wrapper = mount(TradeAnalysisView, { global: { plugins: [pinia, router, i18n] } })

    await wrapper.find('textarea').setValue('ARG 17\nИщу\nBRA 14')
    await wrapper.find('button.btn.primary').trigger('click') // Analyze
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('ARG #17')
    expect(wrapper.text()).toContain('BRA #14')

    const createBtn = wrapper.findAll('button').find((b) => b.text() === 'Create exchange')
    expect(createBtn).toBeTruthy()
    await createBtn!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/exchange/new')

    const newExchangeWrapper = mount(NewExchangeView, { global: { plugins: [pinia, router, i18n] } })
    await newExchangeWrapper.vm.$nextTick()

    const [givingPicker, wantingPicker] = newExchangeWrapper.findAll('.picker')
    expect(givingPicker.find('.selected-list').text()).toContain('BRA #14')
    expect(wantingPicker.find('.selected-list').text()).toContain('ARG #17')
  })

  it('displays a match on the standalone "00" sticker as bare "00", not "00 #0"', async () => {
    const { pinia, i18n, router } = setup()
    const album = useAlbumStore()
    await album.load()
    // We're missing "00" (Panini Logo) — they claim to have it spare.
    await router.push('/trade-analysis')
    await router.isReady()
    const wrapper = mount(TradeAnalysisView, { global: { plugins: [pinia, router, i18n] } })

    await wrapper.find('textarea').setValue('00')
    await wrapper.find('button.btn.primary').trigger('click') // Analyze
    await wrapper.vm.$nextTick()

    const chips = wrapper.findAll('.chip').map((c) => c.text())
    expect(chips).toContain('00')
    expect(chips).not.toContain('00 #0')
  })
})
