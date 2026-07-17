import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { router as appRouter } from '@/router'
import en from '@/i18n/locales/en'
import App from '@/App.vue'

describe('app shell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('boots and renders the album route by default', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router, i18n] },
    })

    expect(wrapper.text()).toContain('Album')
    expect(wrapper.text()).toContain('Groups')
    expect(wrapper.text()).toContain('More')
  })

  it('navigates to the More screen and lists every section', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

    router.push('/more')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router, i18n] },
    })

    expect(wrapper.text()).toContain('Statistics')
    expect(wrapper.text()).toContain('Achievements')
    expect(wrapper.text()).toContain('Exchange')
    expect(wrapper.text()).toContain('Finances')
    expect(wrapper.text()).toContain('Settings')
  })
})
