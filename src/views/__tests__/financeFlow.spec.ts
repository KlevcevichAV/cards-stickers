import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useFinanceStore } from '@/stores/finance'
import { router as appRouter } from '@/router'
import AddPurchaseView from '@/views/finance/AddPurchaseView.vue'
import FinanceView from '@/views/FinanceView.vue'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
  return { pinia, i18n, router }
}

describe('Finance: add a purchase via the UI', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('submits the default pack purchase and shows it in the Finance list', async () => {
    const { pinia, i18n, router } = setup()
    const finance = useFinanceStore()
    await finance.load()

    await router.push('/finance/add-purchase')
    await router.isReady()
    const wrapper = mount(AddPurchaseView, { global: { plugins: [pinia, router, i18n] } })

    // Defaults to "pack" (7 stickers, $4.99), quantity 1.
    expect(wrapper.text()).toContain('7')

    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(finance.purchases).toHaveLength(1))

    expect(finance.purchases).toHaveLength(1)
    expect(finance.purchases[0].stickerCount).toBe(7)
    expect(router.currentRoute.value.path).toBe('/finance')

    const financeWrapper = mount(FinanceView, { global: { plugins: [pinia, router, i18n] } })
    expect(financeWrapper.text()).toContain('4.99')
  })
})
