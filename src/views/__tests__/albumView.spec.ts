import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { useAchievementsStore } from '@/stores/achievements'
import AlbumView from '@/views/AlbumView.vue'
import AchievementBanner from '@/components/AchievementBanner.vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { router as appRouter } from '@/router'

function mountWithProviders(component: Parameters<typeof mount>[0]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
  return { wrapper: mount(component, { global: { plugins: [pinia, router, i18n] } }), router, pinia }
}

describe('AlbumView interaction', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('pastes a sticker via the "+" button and updates the progress footer; tapping the card itself does nothing', async () => {
    const { wrapper, router } = mountWithProviders(AlbumView)
    await router.push('/album')
    await router.isReady()

    const album = useAlbumStore()
    await album.load()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('0 / 980')

    // Tapping the card itself (the standalone "00" page's only sticker, "Panini Logo") does nothing.
    const cell = wrapper.find('.cell')
    expect(cell.exists()).toBe(true)
    await cell.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('0 / 980')
    expect(album.stickers.get('00')?.status).toBe('missing')

    // The "+" button underneath it pastes the sticker.
    const plusButton = wrapper.find('button.qty-btn.plus')
    expect(plusButton.exists()).toBe(true)
    await plusButton.trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('1 / 980')
    expect(album.stickers.get('00')?.status).toBe('pasted')

    // The "-" button removes it again.
    const minusButton = wrapper.find('button.qty-btn.minus')
    expect(minusButton.exists()).toBe(true)
    await minusButton.trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('0 / 980')
    expect(album.stickers.get('00')?.status).toBe('missing')
  })

  it('unlocking an achievement shows the banner overlay', async () => {
    const { wrapper } = mountWithProviders(AchievementBanner)

    const album = useAlbumStore()
    const achievements = useAchievementsStore()
    await album.load()
    await achievements.load()

    await album.paste('ARG17')
    await wrapper.vm.$nextTick()

    expect(achievements.isUnlocked('star_messi')).toBe(true)
    // AchievementBanner is teleported to <body>.
    expect(document.body.textContent).toContain('Achievement unlocked!')
    expect(document.body.textContent).toContain('El Capitán / GOAT')
  })
})
