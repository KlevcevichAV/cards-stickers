import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { useAchievementsStore } from '@/stores/achievements'

describe('album store — markAllCollected', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.delete()
    await db.open()
    await ensureSeeded()
    await useAlbumStore().load()
    await useAchievementsStore().load()
  })

  it('marks every missing sticker as pasted and leaves already-owned stickers untouched', async () => {
    const album = useAlbumStore()
    await album.paste('ARG17')
    await album.addDuplicate('ARG17') // owned sticker with a spare copy — should be left alone

    const missingBefore = Array.from(album.stickers.values()).filter((s) => s.status === 'missing').length
    expect(missingBefore).toBeGreaterThan(0)

    const updatedCount = await album.markAllCollected()
    expect(updatedCount).toBe(missingBefore)

    expect(Array.from(album.stickers.values()).every((s) => s.status !== 'missing')).toBe(true)

    const messi = album.stickers.get('ARG17')!
    expect(messi.status).toBe('duplicate')
    expect(messi.duplicateCount).toBe(1) // untouched by the bulk mark

    const persisted = await db.stickers.toArray()
    expect(persisted.every((s) => s.status !== 'missing')).toBe(true)
  })

  it('routes every future addition straight into duplicates once nothing is missing', async () => {
    const album = useAlbumStore()
    await album.markAllCollected()

    const someSticker = Array.from(album.stickers.values())[0]
    expect(someSticker.status).not.toBe('missing')

    // Mirrors StickerCell's increment(): status !== 'missing' means addDuplicate, not paste.
    await album.addDuplicate(someSticker.id)
    expect(album.stickers.get(someSticker.id)!.duplicateCount).toBe(1)
  })

  it('is a no-op the second time it is run', async () => {
    const album = useAlbumStore()
    await album.markAllCollected()
    const secondRunCount = await album.markAllCollected()
    expect(secondRunCount).toBe(0)
  })

  it('unlocks achievements implied by a fully-owned album', async () => {
    const album = useAlbumStore()
    const achievementsStore = useAchievementsStore()

    await album.markAllCollected()

    expect(achievementsStore.isUnlocked('world_ruler')).toBe(true)
    expect(achievementsStore.isUnlocked('star_hunter')).toBe(true)
    expect(achievementsStore.isUnlocked('centurion')).toBe(true)
  })
})

describe('album store — setCollectionFromLists', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.delete()
    await db.open()
    await ensureSeeded()
    await useAlbumStore().load()
    await useAchievementsStore().load()
  })

  it('applies need → missing, have → duplicate (with count), and treats everything else as pasted', async () => {
    const album = useAlbumStore()

    const result = await album.setCollectionFromLists(
      [{ teamCode: 'MEX', number: 1, count: 1 }],
      [{ teamCode: 'ARG', number: 17, count: 2 }],
    )

    expect(album.stickers.get('MEX1')!.status).toBe('missing')
    expect(album.stickers.get('ARG17')!.status).toBe('duplicate')
    expect(album.stickers.get('ARG17')!.duplicateCount).toBe(2)
    // Not mentioned in either list — implicitly owned.
    expect(album.stickers.get('BRA1')!.status).toBe('pasted')
    expect(album.stickers.get('BRA1')!.duplicateCount).toBe(0)

    expect(result.missing).toBe(1)
    expect(result.duplicates).toBe(1)
    expect(result.pasted).toBe(album.totalStickers - 2)

    const persistedHave = await db.stickers.get('ARG17')
    expect(persistedHave?.status).toBe('duplicate')
    expect(persistedHave?.duplicateCount).toBe(2)
  })

  it('fully replaces prior state rather than merging with it', async () => {
    const album = useAlbumStore()
    await album.paste('ARG17')
    expect(album.stickers.get('ARG17')!.status).toBe('pasted')

    // Re-listing the same sticker as "needed" should override its previously-pasted state.
    await album.setCollectionFromLists([{ teamCode: 'ARG', number: 17, count: 1 }], [])
    expect(album.stickers.get('ARG17')!.status).toBe('missing')
  })

  it('unlocks achievements for stickers that newly become owned, silently', async () => {
    const album = useAlbumStore()
    const achievementsStore = useAchievementsStore()

    // ARG17 (Messi) is one of the per-sticker "superstar" easter eggs.
    await album.setCollectionFromLists([], [{ teamCode: 'ARG', number: 17, count: 1 }])

    expect(achievementsStore.isUnlocked('star_messi')).toBe(true)
  })
})
