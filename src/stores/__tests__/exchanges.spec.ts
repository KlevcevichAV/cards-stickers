import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'
import type { Exchange } from '@/types/models'

function makeExchange(overrides: Partial<Exchange> = {}): Exchange {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    meetingDate: new Date().toISOString(),
    giving: [],
    wanting: [],
    status: 'active',
    partner: '',
    isArchived: false,
    ...overrides,
  }
}

describe('exchanges store pending aggregates', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.delete()
    await db.open()
    await ensureSeeded()
    await useAlbumStore().load()
  })

  it('counts pending incoming only for currently-missing stickers', async () => {
    const album = useAlbumStore()
    const exchangesStore = useExchangesStore()

    // ARG1 stays missing; ARG2 is already pasted, so it should not count as "incoming".
    await album.paste('ARG2')

    const exchange = makeExchange({
      wanting: [
        { teamCode: 'ARG', number: 1, count: 1 },
        { teamCode: 'ARG', number: 2, count: 1 },
      ],
    })
    await db.exchanges.add(exchange)
    exchangesStore.exchanges = [exchange]

    expect(exchangesStore.pendingIncoming).toBe(1)
  })

  it('sums pending reserved across all active exchanges giving lists', () => {
    const exchangesStore = useExchangesStore()
    const active = makeExchange({ giving: [{ teamCode: 'BRA', number: 14, count: 2 }] })
    const cancelled = makeExchange({
      status: 'cancelled',
      giving: [{ teamCode: 'FRA', number: 20, count: 5 }],
    })
    exchangesStore.exchanges = [active, cancelled]

    expect(exchangesStore.pendingReserved).toBe(2)
  })

  it('reservedCount/incomingCount only consider active exchanges', () => {
    const exchangesStore = useExchangesStore()
    const active = makeExchange({ giving: [{ teamCode: 'BRA', number: 14, count: 3 }] })
    const completed = makeExchange({
      status: 'completed',
      giving: [{ teamCode: 'BRA', number: 14, count: 9 }],
    })
    exchangesStore.exchanges = [active, completed]

    expect(exchangesStore.reservedCount('BRA14')).toBe(3)
  })
})

describe('exchanges store CRUD', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.delete()
    await db.open()
    await ensureSeeded()
    await useAlbumStore().load()
  })

  it('completes a trade: consumes given duplicates and adds received stickers', async () => {
    const album = useAlbumStore()
    const exchangesStore = useExchangesStore()

    // We have 2 spare ARG17 (Messi) duplicates and want BRA14 (Vinícius), which is missing.
    await album.paste('ARG17')
    await album.addDuplicate('ARG17')
    await album.addDuplicate('ARG17')
    expect(album.stickers.get('ARG17')?.duplicateCount).toBe(2)

    const exchange = await exchangesStore.create({
      giving: [{ teamCode: 'ARG', number: 17, count: 2 }],
      wanting: [{ teamCode: 'BRA', number: 14, count: 1 }],
      partner: 'alex',
    })

    await exchangesStore.complete(exchange.id)

    expect(album.stickers.get('ARG17')?.duplicateCount).toBe(0)
    expect(album.stickers.get('ARG17')?.status).toBe('pasted')
    expect(album.stickers.get('BRA14')?.status).toBe('pasted')
    expect(exchangesStore.findExchange(exchange.id)?.status).toBe('completed')
  })

  it('adds a duplicate when the received sticker is already owned', async () => {
    const album = useAlbumStore()
    const exchangesStore = useExchangesStore()
    await album.paste('BRA14')

    const exchange = await exchangesStore.create({
      giving: [],
      wanting: [{ teamCode: 'BRA', number: 14, count: 1 }],
    })
    await exchangesStore.complete(exchange.id)

    expect(album.stickers.get('BRA14')?.status).toBe('duplicate')
    expect(album.stickers.get('BRA14')?.duplicateCount).toBe(1)
  })

  it('cancel records a reason and restore validates duplicates are still available', async () => {
    const album = useAlbumStore()
    const exchangesStore = useExchangesStore()
    await album.paste('ARG17')
    await album.addDuplicate('ARG17')

    const exchange = await exchangesStore.create({
      giving: [{ teamCode: 'ARG', number: 17, count: 1 }],
      wanting: [],
    })

    await exchangesStore.cancel(exchange.id, 'noShow')
    expect(exchangesStore.findExchange(exchange.id)?.status).toBe('cancelled')
    expect(exchangesStore.findExchange(exchange.id)?.cancellationReason).toBe('noShow')

    // Still have the duplicate — restore should be valid.
    let validation = exchangesStore.validateRestore(exchange.id)
    expect(validation.ok).toBe(true)

    // Give the duplicate away elsewhere, then restoring should be blocked.
    await album.removeDuplicate('ARG17')
    validation = exchangesStore.validateRestore(exchange.id)
    expect(validation.ok).toBe(false)
    expect(validation.insufficientGiving).toHaveLength(1)
  })

  it('computes trust level from exchange history with a partner', async () => {
    const exchangesStore = useExchangesStore()

    expect(exchangesStore.trustLevel('unknown')).toBeNull()

    const e1 = await exchangesStore.create({ giving: [], wanting: [], partner: 'sam' })
    await exchangesStore.cancel(e1.id, 'noAgreement')
    expect(exchangesStore.trustLevel('sam')).toBe('medium')

    const e2 = await exchangesStore.create({ giving: [], wanting: [], partner: 'sam' })
    await exchangesStore.cancel(e2.id, 'noShow')
    expect(exchangesStore.trustLevel('sam')).toBe('bad')

    const e3 = await exchangesStore.create({ giving: [], wanting: [], partner: 'sam' })
    await exchangesStore.complete(e3.id)
    expect(exchangesStore.trustLevel('sam')).toBe('good')
  })

  it('completes a trade involving the standalone "Panini Logo" sticker (its own team "00", entry teamCode "00"/number 0)', async () => {
    const album = useAlbumStore()
    const exchangesStore = useExchangesStore()

    // Sanity: this sticker's id is "00", not "000" a naive teamCode+number
    // concatenation would produce, and it belongs to its own team, not FWC.
    expect(album.stickers.get('00')?.teamCode).toBe('00')
    expect(album.stickers.has('FWC0')).toBe(false)
    expect(album.stickers.has('000')).toBe(false)

    const exchange = await exchangesStore.create({
      giving: [],
      wanting: [{ teamCode: '00', number: 0, count: 1 }],
    })
    await exchangesStore.complete(exchange.id)

    expect(album.stickers.get('00')?.status).toBe('pasted')
    expect(exchangesStore.findExchange(exchange.id)?.status).toBe('completed')
  })
})
