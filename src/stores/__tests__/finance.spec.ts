import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { db, ensureSeeded } from '@/db/database'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'
import { useFinanceStore } from '@/stores/finance'

describe('finance store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.delete()
    await db.open()
    await ensureSeeded()
    await useAlbumStore().load()
    await useExchangesStore().load()
    await useFinanceStore().load()
  })

  it('computes total spent, stickers bought, and cost per sticker', async () => {
    const finance = useFinanceStore()
    await finance.addPurchase('pack', 5, 4.99, new Date().toISOString())
    await finance.addPurchase('album', 1, 17.99, new Date().toISOString())

    expect(finance.totalSpent).toBeCloseTo(5 * 4.99 + 17.99)
    expect(finance.totalStickersBought).toBe(5 * 7)
    expect(finance.totalPacksBought).toBe(5)
    expect(finance.costPerSticker).toBeCloseTo(finance.totalSpent / 35)
  })

  it('computes balance from sales minus purchases', async () => {
    const finance = useFinanceStore()
    await finance.addPurchase('pack', 2, 5, new Date().toISOString())
    await finance.addSale(3, new Date().toISOString(), 'sold a dupe')

    expect(finance.totalEarned).toBe(3)
    expect(finance.balance).toBeCloseTo(3 - 10)
  })

  it('matches expected vs actual sticker count when purchases and album state agree', async () => {
    const album = useAlbumStore()
    const finance = useFinanceStore()

    // Buy one pack (7 stickers) and paste exactly 7 — books balance perfectly.
    await finance.addPurchase('pack', 1, 4.99, new Date().toISOString())
    const ids = Array.from(album.stickers.keys()).slice(0, 7)
    for (const id of ids) await album.paste(id)

    expect(finance.expectedStickerTotal).toBe(7)
    expect(finance.actualStickerTotal).toBe(7)
    expect(finance.stickerCountDiff).toBe(0)
  })

  it('folds completed-trade deltas into the expected total, and flags unexplained duplicates', async () => {
    const album = useAlbumStore()
    const exchangesStore = useExchangesStore()
    const finance = useFinanceStore()

    await finance.addPurchase('pack', 1, 4.99, new Date().toISOString())
    const ids = Array.from(album.stickers.keys()).slice(0, 7)
    for (const id of ids) await album.paste(id)

    // Getting a duplicate "for free" (no purchase behind it) is exactly the
    // kind of drift this cross-check exists to surface.
    await album.addDuplicate(ids[0])
    expect(finance.stickerCountDiff).toBe(1) // 8 actual vs. 7 expected

    // Trade that unaccounted duplicate away for a brand-new sticker — a
    // like-for-like swap (net trade delta 0), so expected doesn't move, but
    // actual stays at 8 (the duplicate became a new distinct sticker instead
    // of vanishing) — the +1 drift persists, which is the correct outcome:
    // the original "free" duplicate was never explained by a purchase.
    const missingId = Array.from(album.stickers.keys())[7]
    const missingSticker = album.stickers.get(missingId)!
    const givingSticker = album.stickers.get(ids[0])!

    const exchange = await exchangesStore.create({
      giving: [{ teamCode: givingSticker.teamCode, number: givingSticker.number, count: 1 }],
      wanting: [{ teamCode: missingSticker.teamCode, number: missingSticker.number, count: 1 }],
    })
    await exchangesStore.complete(exchange.id)

    expect(finance.netTradeDelta).toBe(0) // received 1, gave 1
    expect(finance.expectedStickerTotal).toBe(7)
    expect(finance.actualStickerTotal).toBe(8)
    expect(finance.stickerCountDiff).toBe(1)
  })
})
