import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { useAchievementsStore } from '@/stores/achievements'

describe('achievements engine', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.delete()
    await db.open()
    await ensureSeeded()
    await useAlbumStore().load()
    await useAchievementsStore().load()
  })

  it('unlocks the superstar easter egg when Messi is pasted', async () => {
    const album = useAlbumStore()
    const achievementsStore = useAchievementsStore()

    await album.paste('ARG17')

    expect(achievementsStore.isUnlocked('star_messi')).toBe(true)
    expect(achievementsStore.isUnlocked('first_sticker')).toBe(true)
    expect(achievementsStore.isUnlocked('star_ronaldo')).toBe(false)
  })

  it('unlocks Star Hunter only once all 10 superstars are pasted', async () => {
    const album = useAlbumStore()
    const achievementsStore = useAchievementsStore()
    const superstars = ['ARG17', 'POR15', 'FRA20', 'NOR15', 'ENG11', 'BRA14', 'CRO9', 'ESP15', 'EGY17']

    for (const id of superstars) {
      await album.paste(id)
    }
    expect(achievementsStore.isUnlocked('star_hunter')).toBe(false)

    await album.paste('KOR18')
    expect(achievementsStore.isUnlocked('star_hunter')).toBe(true)
  })

  it('unlocks a team-completion achievement once every sticker of that team is pasted', async () => {
    const album = useAlbumStore()
    const achievementsStore = useAchievementsStore()
    const argStickers = (album.stickersByTeam.get('ARG') ?? []).map((s) => s.id)
    expect(argStickers).toHaveLength(20)

    for (const id of argStickers.slice(0, -1)) {
      await album.paste(id)
    }
    expect(achievementsStore.isUnlocked('team_arg')).toBe(false)

    await album.paste(argStickers[argStickers.length - 1])
    expect(achievementsStore.isUnlocked('team_arg')).toBe(true)
  })

  it('unlocks the centurion achievement at exactly 100 pasted stickers', async () => {
    const album = useAlbumStore()
    const achievementsStore = useAchievementsStore()
    const ids = Array.from(album.stickers.keys()).slice(0, 100)

    for (const id of ids.slice(0, 99)) {
      await album.paste(id)
    }
    expect(achievementsStore.isUnlocked('centurion')).toBe(false)

    await album.paste(ids[99])
    expect(achievementsStore.isUnlocked('centurion')).toBe(true)
  })

  it('does not revoke achievements when a sticker is later removed', async () => {
    const album = useAlbumStore()
    const achievementsStore = useAchievementsStore()

    await album.paste('ARG17')
    expect(achievementsStore.isUnlocked('star_messi')).toBe(true)

    await album.remove('ARG17')
    expect(achievementsStore.isUnlocked('star_messi')).toBe(true)
  })

  it('unlocks the 25% milestone once a quarter of the album is pasted', async () => {
    const album = useAlbumStore()
    const achievementsStore = useAchievementsStore()
    const quarter = Math.ceil(album.stickers.size * 0.25)
    const ids = Array.from(album.stickers.keys()).slice(0, quarter)

    for (const id of ids) {
      await album.paste(id)
    }
    expect(achievementsStore.isUnlocked('milestone_25')).toBe(true)
    expect(achievementsStore.isUnlocked('milestone_50')).toBe(false)
  })
})
