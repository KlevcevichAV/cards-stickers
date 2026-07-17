import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, ensureSeeded } from '@/db/database'
import { exportBackup, importBackup, parseBackup } from '@/services/backupService'

describe('backupService', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureSeeded()
  })

  it('exports only non-default stickers and restores them on import', async () => {
    await db.stickers.update('ARG17', { status: 'pasted' })
    await db.stickers.update('BRA14', { status: 'duplicate', duplicateCount: 2 })
    await db.purchases.add({
      id: 'p1',
      kind: 'pack',
      quantity: 3,
      price: 4.99,
      date: new Date().toISOString(),
      stickerCount: 21,
    })
    await db.achievementRecords.add({ achievementID: 'first_sticker', unlockedAt: new Date().toISOString() })

    const backup = await exportBackup()
    expect(backup.stickers).toHaveLength(2)
    expect(backup.stickers.find((s) => s.id === 'BRA14')?.duplicateCount).toBe(2)
    expect(backup.purchases).toHaveLength(1)
    expect(backup.achievements).toHaveLength(1)

    // Wipe and re-seed to simulate a fresh browser profile, then restore.
    await db.delete()
    await db.open()
    await ensureSeeded()

    await importBackup(backup)

    const restoredMessi = await db.stickers.get('ARG17')
    const restoredVini = await db.stickers.get('BRA14')
    expect(restoredMessi?.status).toBe('pasted')
    expect(restoredVini?.status).toBe('duplicate')
    expect(restoredVini?.duplicateCount).toBe(2)
    expect(await db.purchases.count()).toBe(1)
    expect(await db.achievementRecords.count()).toBe(1)
  })

  it('rejects a file that is not a valid backup', () => {
    expect(() => parseBackup('{"foo": 1}')).toThrow()
    expect(() => parseBackup('not json at all')).toThrow()
  })

  it('round-trips through JSON serialization', async () => {
    await db.stickers.update('ARG17', { status: 'pasted' })
    const backup = await exportBackup()
    const serialized = JSON.stringify(backup)
    const parsed = parseBackup(serialized)
    expect(parsed.stickers).toEqual(backup.stickers)
  })
})
