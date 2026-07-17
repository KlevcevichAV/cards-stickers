import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/db/database'
import type { Purchase, PurchaseKind, Sale } from '@/types/models'
import { purchaseKindsByKind } from '@/data/purchaseKinds'
import { useAlbumStore } from '@/stores/album'
import { useExchangesStore } from '@/stores/exchanges'

export const useFinanceStore = defineStore('finance', () => {
  const purchases = ref<Purchase[]>([])
  const sales = ref<Sale[]>([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    ;[purchases.value, sales.value] = await Promise.all([db.purchases.toArray(), db.sales.toArray()])
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

  async function removePurchase(id: string) {
    await db.purchases.delete(id)
    purchases.value = purchases.value.filter((p) => p.id !== id)
  }

  async function addSale(price: number, date: string, comment: string) {
    const sale: Sale = { id: crypto.randomUUID(), price, date, comment }
    await db.sales.add(sale)
    sales.value.push(sale)
  }

  async function removeSale(id: string) {
    await db.sales.delete(id)
    sales.value = sales.value.filter((s) => s.id !== id)
  }

  const totalSpent = computed(() => purchases.value.reduce((sum, p) => sum + p.price * p.quantity, 0))
  const totalStickersBought = computed(() => purchases.value.reduce((sum, p) => sum + p.stickerCount, 0))
  const totalPacksBought = computed(() =>
    purchases.value.reduce((sum, p) => sum + (purchaseKindsByKind.get(p.kind)?.packsPerUnit ?? 0) * p.quantity, 0),
  )
  const costPerSticker = computed(() =>
    totalStickersBought.value > 0 ? totalSpent.value / totalStickersBought.value : 0,
  )
  const totalEarned = computed(() => sales.value.reduce((sum, s) => sum + s.price, 0))
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

  const expectedStickerTotal = computed(() => totalStickersBought.value + netTradeDelta.value)

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
    removePurchase,
    addSale,
    removeSale,
    totalSpent,
    totalStickersBought,
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
