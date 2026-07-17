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

  it('computes balance from sales minus purchases, and consumes the sold duplicate', async () => {
    const album = useAlbumStore()
    const finance = useFinanceStore()
    await finance.addPurchase('pack', 2, 5, new Date().toISOString())

    await album.paste('ARG17')
    await album.addDuplicate('ARG17')
    expect(album.stickers.get('ARG17')?.duplicateCount).toBe(1)

    await finance.addSale([{ teamCode: 'ARG', number: 17, count: 1 }], 3, new Date().toISOString(), 'sold a dupe')

    expect(finance.totalEarned).toBe(3)
    expect(finance.balance).toBeCloseTo(3 - 10)
    expect(finance.totalStickersSold).toBe(1)
    expect(album.stickers.get('ARG17')?.duplicateCount).toBe(0)
    expect(album.stickers.get('ARG17')?.status).toBe('pasted')
  })

  it('folds sold stickers into the expected total, so selling owned stock stays balanced', async () => {
    const album = useAlbumStore()
    const finance = useFinanceStore()

    // Buy one pack (7 physical stickers): 6 come out unique, the 7th duplicates one of them.
    await finance.addPurchase('pack', 1, 4.99, new Date().toISOString())
    const ids = Array.from(album.stickers.keys()).slice(0, 7)
    for (const id of ids.slice(0, 6)) await album.paste(id)
    await album.addDuplicate(ids[0]) // the 7th physical card

    expect(finance.actualStickerTotal).toBe(7)
    expect(finance.expectedStickerTotal).toBe(7)
    expect(finance.stickerCountDiff).toBe(0)

    // Sell that spare duplicate — expected and actual should drop together, no phantom drift.
    const sticker = album.stickers.get(ids[0])!
    await finance.addSale(
      [{ teamCode: sticker.teamCode, number: sticker.number, count: 1 }],
      2,
      new Date().toISOString(),
      '',
    )

    expect(finance.actualStickerTotal).toBe(6)
    expect(finance.expectedStickerTotal).toBe(6)
    expect(finance.stickerCountDiff).toBe(0)
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
