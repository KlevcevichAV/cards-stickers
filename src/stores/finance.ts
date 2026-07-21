import { defineStore } from 'pinia'
import { computed, ref, toRaw } from 'vue'
import { db } from '@/db/database'
import type { Purchase, PurchaseKind, Sale, StickerEntry } from '@/types/models'
import { purchaseKindsByKind } from '@/data/purchaseKinds'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'
import { stickerIdForEntry } from '@/services/stickerId'

export const useFinanceStore = defineStore('finance', () => {
  const purchases = ref<Purchase[]>([])
  const sales = ref<Sale[]>([])
  const loaded = ref(false)

  /** Pass `force: true` to re-read from Dexie even if already loaded — e.g. after a backup import. */
  async function load(force = false) {
    if (loaded.value && !force) return
    ;[purchases.value, sales.value] = await Promise.all([db.purchases.toArray(), db.sales.toArray()])
    // Sales predate the active/completed/cancelled lifecycle — they used to complete
    // instantly (duplicates removed, price counted) the moment they were logged. Treat
    // any sale saved before that field existed as already completed, so old data keeps
    // behaving exactly as it did before this feature.
    sales.value = sales.value.map((s) => (s.status ? s : { ...s, status: 'completed' }))
    loaded.value = true
  }

  async function addPurchase(kind: PurchaseKind, quantity: number, price: number, date: string) {
    const meta = purchaseKindsByKind.get(kind)!
    const purchase: Purchase = {
      id: crypto.randomUUID(),
      kind,
      quantity,
      price,
      date,
      stickerCount: meta.stickersPerUnit * quantity,
    }
    await db.purchases.add(purchase)
    purchases.value.push(purchase)
  }

  async function updatePurchase(
    id: string,
    patch: { kind: PurchaseKind; quantity: number; price: number; date: string },
  ) {
    const purchase = purchases.value.find((p) => p.id === id)
    if (!purchase) return
    const meta = purchaseKindsByKind.get(patch.kind)!
    Object.assign(purchase, patch, { stickerCount: meta.stickersPerUnit * patch.quantity })
    await db.purchases.put(toRaw(purchase))
  }

  async function removePurchase(id: string) {
    await db.purchases.delete(id)
    purchases.value = purchases.value.filter((p) => p.id !== id)
  }

  function findSale(id: string): Sale | undefined {
    return sales.value.find((s) => s.id === id)
  }

  /** Creates the sale as `active`: it reserves the stickers (see reservedForSaleCount) without
   * touching duplicate counts or earnings yet — those only happen once `completeSale` runs. */
  async function addSale(stickers: StickerEntry[], price: number, date: string, comment: string): Promise<Sale> {
    // `stickers` comes from ExchangeStickerPicker's v-model and stays deeply
    // reactive; IndexedDB's structured-clone can't serialize that (see the
    // same fix in exchanges.ts's toPlainExchange). A JSON round-trip strips it.
    const sale: Sale = JSON.parse(
      JSON.stringify({ id: crypto.randomUUID(), stickers, price, date, comment, status: 'active' }),
    )
    await db.sales.add(sale)
    sales.value.push(sale)
    return sale
  }

  /** Applies the sale to the album: consumes the sold duplicates and counts the price as earned. */
  async function completeSale(id: string) {
    const sale = findSale(id)
    if (!sale || sale.status !== 'active') return

    const album = useAlbumStore()
    for (const entry of sale.stickers) {
      const stickerId = stickerIdForEntry(entry)
      for (let i = 0; i < entry.count; i++) {
        await album.removeDuplicate(stickerId)
      }
    }

    sale.status = 'completed'
    await db.sales.put(toRaw(sale))
  }

  /** Lifts the reservation — the stickers were never removed from duplicates, so nothing more to undo. */
  async function cancelSale(id: string) {
    const sale = findSale(id)
    if (!sale || sale.status !== 'active') return
    sale.status = 'cancelled'
    await db.sales.put(toRaw(sale))
  }

  /** Only active sales can be edited — once completed the duplicates are already gone and the
   * price already counted, so rewriting the stickers/price afterwards would desync both. */
  async function updateSale(
    id: string,
    patch: { stickers: StickerEntry[]; price: number; date: string; comment: string },
  ) {
    const sale = findSale(id)
    if (!sale || sale.status !== 'active') return
    // Same reactivity/serialization concern as addSale's `stickers` — see its comment.
    Object.assign(sale, JSON.parse(JSON.stringify(patch)))
    await db.sales.put(toRaw(sale))
  }

  async function removeSale(id: string) {
    await db.sales.delete(id)
    sales.value = sales.value.filter((s) => s.id !== id)
  }

  // Mirrors exchanges.ts's reservedCounts: StickerCell/DuplicatesView/message builders
  // check this once per sticker, so precompute the lookup instead of rescanning every
  // active sale's entries on every single call.
  const reservedForSaleCounts = computed(() => {
    const map = new Map<string, number>()
    for (const sale of sales.value) {
      if (sale.status !== 'active') continue
      for (const entry of sale.stickers) {
        const id = stickerIdForEntry(entry)
        map.set(id, (map.get(id) ?? 0) + entry.count)
      }
    }
    return map
  })

  function reservedForSaleCount(stickerId: string): number {
    return reservedForSaleCounts.value.get(stickerId) ?? 0
  }

  const totalSpent = computed(() => purchases.value.reduce((sum, p) => sum + p.price * p.quantity, 0))
  const totalStickersBought = computed(() => purchases.value.reduce((sum, p) => sum + p.stickerCount, 0))
  const totalPacksBought = computed(() =>
    purchases.value.reduce((sum, p) => sum + (purchaseKindsByKind.get(p.kind)?.packsPerUnit ?? 0) * p.quantity, 0),
  )
  const costPerSticker = computed(() =>
    totalStickersBought.value > 0 ? totalSpent.value / totalStickersBought.value : 0,
  )
  const completedSales = computed(() => sales.value.filter((s) => s.status === 'completed'))
  const totalEarned = computed(() => completedSales.value.reduce((sum, s) => sum + s.price, 0))
  const balance = computed(() => totalEarned.value - totalSpent.value)

  /** Net sticker delta from completed trades: received − given, across all completed exchanges. */
  const netTradeDelta = computed(() => {
    const exchangesStore = useExchangesStore()
    return exchangesStore.exchanges
      .filter((e) => e.status === 'completed')
      .reduce((sum, e) => {
        const got = e.wanting.reduce((s, entry) => s + entry.count, 0)
        const gave = e.giving.reduce((s, entry) => s + entry.count, 0)
        return sum + (got - gave)
      }, 0)
  })

  /** Stickers that physically left the collection via a sale (only once it's completed —
   * an active sale hasn't touched duplicate counts yet, see completeSale). */
  const totalStickersSold = computed(() =>
    completedSales.value.reduce((sum, s) => sum + s.stickers.reduce((s2, entry) => s2 + entry.count, 0), 0),
  )

  const expectedStickerTotal = computed(
    () => totalStickersBought.value + netTradeDelta.value - totalStickersSold.value,
  )

  /** Physical cards actually on hand: one per collected sticker slot, plus extra duplicate copies. */
  const actualStickerTotal = computed(() => {
    const album = useAlbumStore()
    return album.totalPasted + album.totalDuplicates
  })

  const stickerCountDiff = computed(() => actualStickerTotal.value - expectedStickerTotal.value)

  return {
    purchases,
    sales,
    loaded,
    load,
    addPurchase,
    updatePurchase,
    removePurchase,
    addSale,
    updateSale,
    completeSale,
    cancelSale,
    removeSale,
    reservedForSaleCount,
    totalSpent,
    totalStickersBought,
    totalStickersSold,
    totalPacksBought,
    costPerSticker,
    totalEarned,
    balance,
    netTradeDelta,
    expectedStickerTotal,
    actualStickerTotal,
    stickerCountDiff,
  }
})
