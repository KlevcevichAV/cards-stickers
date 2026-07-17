import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, ensureSeeded } from '@/db/database'

describe('database seeding', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('bulk-inserts all teams and stickers exactly once', async () => {
    await ensureSeeded()
    expect(await db.teams.count()).toBe(50)
    expect(await db.stickers.count()).toBe(980)

    // Mutate a sticker, then re-run ensureSeeded — it must be a no-op.
    await db.stickers.update('ARG17', { status: 'pasted' })
    await ensureSeeded()

    const messi = await db.stickers.get('ARG17')
    expect(messi?.status).toBe('pasted')
    expect(await db.stickers.count()).toBe(980)
  })

  it('every sticker references a seeded team', async () => {
    await ensureSeeded()
    const teamCodes = new Set((await db.teams.toArray()).map((t) => t.code))
    const stickers = await db.stickers.toArray()
    for (const sticker of stickers) {
      expect(teamCodes.has(sticker.teamCode)).toBe(true)
    }
  })

  it('migrates a browser from the very old state (sticker id "FWC0", no dedicated "00" team)', async () => {
    await ensureSeeded()

    const current = await db.stickers.get('00')
    expect(current).toBeDefined()
    await db.stickers.delete('00')
    await db.teams.delete('00')
    await db.stickers.put({ ...current!, id: 'FWC0', teamCode: 'FWC', status: 'duplicate', duplicateCount: 3 })

    await ensureSeeded()

    expect(await db.stickers.get('FWC0')).toBeUndefined()
    const migrated = await db.stickers.get('00')
    expect(migrated?.teamCode).toBe('00')
    expect(migrated?.status).toBe('duplicate')
    expect(migrated?.duplicateCount).toBe(3)
    expect(await db.teams.get('00')).toBeDefined()
    expect(await db.teams.count()).toBe(50)
    expect(await db.stickers.count()).toBe(980)
  })

  it('migrates a browser from the intermediate state (id "00" but teamCode still "FWC", no dedicated "00" team)', async () => {
    await ensureSeeded()

    await db.teams.delete('00')
    await db.stickers.update('00', { teamCode: 'FWC', status: 'pasted' })

    await ensureSeeded()

    const migrated = await db.stickers.get('00')
    expect(migrated?.teamCode).toBe('00')
    expect(migrated?.status).toBe('pasted')
    expect(await db.teams.get('00')).toBeDefined()
    expect(await db.teams.count()).toBe(50)
    expect(await db.stickers.count()).toBe(980)
  })

  it('re-syncs the "00" team row when its metadata (e.g. emoji) is stale, even if the team already exists', async () => {
    await ensureSeeded()
    await db.teams.update('00', { flagEmoji: '🎖️' })

    await ensureSeeded()

    const team = await db.teams.get('00')
    expect(team?.flagEmoji).toBe('✨')
  })

  it('is a no-op when the database is already fully on the current "00" team/id', async () => {
    await ensureSeeded()
    await db.stickers.update('00', { status: 'pasted' })

    await ensureSeeded()

    const sticker = await db.stickers.get('00')
    expect(sticker?.status).toBe('pasted')
    expect(sticker?.teamCode).toBe('00')
    expect(await db.teams.count()).toBe(50)
    expect(await db.stickers.count()).toBe(980)
  })
})

describe('Dexie import smoke', () => {
  it('exposes the expected table names', () => {
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      [
        'achievementRecords',
        'exchanges',
        'meta',
        'purchases',
        'sales',
        'savedAnalyses',
        'stickers',
        'teams',
      ].sort(),
    )
  })
})
