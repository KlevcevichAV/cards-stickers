import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'
import DuplicatesView from '@/views/DuplicatesView.vue'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  return { pinia, i18n }
}

describe('DuplicatesView', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('shows the empty state when there are no duplicates', async () => {
    const { pinia, i18n } = setup()
    await useAlbumStore().load()
    useExchangesStore()

    const wrapper = mount(DuplicatesView, { global: { plugins: [pinia, i18n] } })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No duplicates yet')
  })

  it('lists a duplicate, expands its team, and decrements it back to a single pasted sticker', async () => {
    const { pinia, i18n } = setup()
    const album = useAlbumStore()
    await album.load()
    useExchangesStore()
    await album.addDuplicate('ARG17')

    const wrapper = mount(DuplicatesView, { global: { plugins: [pinia, i18n] } })
    await wrapper.vm.$nextTick()

    const teamHeader = wrapper.find('button.team-header')
    expect(teamHeader.exists()).toBe(true)
    await teamHeader.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Lionel Messi')
    expect(wrapper.text()).toContain('×1')

    await wrapper.find('button.minus-btn').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const sticker = album.stickers.get('ARG17')
    expect(sticker?.status).toBe('pasted')
    expect(sticker?.duplicateCount).toBe(0)
    expect(wrapper.text()).toContain('No duplicates yet')
  })
})
