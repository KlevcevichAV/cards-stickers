import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { router as appRouter } from '@/router'
import GroupsView from '@/views/GroupsView.vue'

describe('GroupsView', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('shows the standalone "00" sticker as its own group, separate from FWC', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
    const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
    await useAlbumStore().load()
    await router.push('/groups')
    await router.isReady()

    const wrapper = mount(GroupsView, { global: { plugins: [pinia, router, i18n] } })
    await wrapper.vm.$nextTick()

    const groupTitles = wrapper.findAll('.group-title').map((n) => n.text())
    expect(groupTitles).toContain('Panini Logo')
    expect(groupTitles).toContain('FIFA World Cup')

    const groupProgress = wrapper.findAll('.group-progress').map((n) => n.text())
    expect(groupProgress).toContain('0/1') // the "00" group has exactly 1 sticker
    expect(groupProgress).toContain('0/19') // FWC now has 19, not 20
  })
})
