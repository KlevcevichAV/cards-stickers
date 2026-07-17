import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import SettingsView from '@/views/SettingsView.vue'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  return { pinia, i18n }
}

describe('SettingsView', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('imports a backup file and restores the sticker state via the file input', async () => {
    const { pinia, i18n } = setup()
    const album = useAlbumStore()
    await album.load()

    const backupJson = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      stickers: [{ id: 'ARG17', status: 'pasted', duplicateCount: 0 }],
      exchanges: [],
      purchases: [],
      sales: [],
      achievements: [],
      savedAnalyses: [],
    })
    const file = new File([backupJson], 'backup.json', { type: 'application/json' })

    const wrapper = mount(SettingsView, { global: { plugins: [pinia, i18n] } })
    const input = wrapper.find('input[type="file"]')

    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Backup restored successfully.'))

    const restored = await db.stickers.get('ARG17')
    expect(restored?.status).toBe('pasted')
  })

  it('rejects a malformed backup file with an error message', async () => {
    const { pinia, i18n } = setup()
    const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })

    const wrapper = mount(SettingsView, { global: { plugins: [pinia, i18n] } })
    const input = wrapper.find('input[type="file"]')

    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await vi.waitFor(() => expect(wrapper.text()).toContain('That file could not be read as a backup.'))
  })
})
