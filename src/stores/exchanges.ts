import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/db/database'
import type { CancellationReason, Exchange, StickerEntry } from '@/types/models'
import { useAlbumStore } from '@/stores/album'
import { useHaptics } from '@/composables/useHaptics'
import { computeTrustLevel, type TrustLevel } from '@/services/trustLevel'
import { stickerIdForEntry } from '@/services/stickerId'

export interface RestoreValidation {
  ok: boolean
  insufficientGiving: StickerEntry[]
  alreadyOwnedWanting: StickerEntry[]
}

export const useExchangesStore = defineStore('exchanges', () => {
  const exchanges = ref<Exchange[]>([])
  const loaded = ref(false)
  const { impact } = useHaptics()

  /** Pass `force: true` to re-read from Dexie even if already loaded — e.g. after a backup import. */
  async function load(force = false) {
    if (loaded.value && !force) return
    exchanges.value = await db.exchanges.toArray()
    loaded.value = true
  }

  const active = computed(() => exchanges.value.filter((e) => e.status === 'active'))
  const history = computed(() => exchanges.value.filter((e) => e.status !== 'active'))
  const partnerNames = computed(() =>
    Array.from(new Set(exchanges.value.map((e) => e.partner.trim()).filter(Boolean))),
  )

  function findExchange(id: string): Exchange | undefined {
    return exchanges.value.find((e) => e.id === id)
  }

  // `toRaw()` only strips the outer reactive proxy; giving/wanting arrays picked
  // via ExchangeStickerPicker's v-model stay deeply reactive, which IndexedDB's
  // structured-clone algorithm can't serialize. A JSON round-trip guarantees a
  // fully plain object regardless of nesting depth.
  function toPlainExchange(exchange: Exchange): Exchange {
    return JSON.parse(JSON.stringify(exchange))
  }

  async function persist(exchange: Exchange) {
    await db.exchanges.put(toPlainExchange(exchange))
  }

  // StickerCell calls reservedCount()/incomingCount() once per sticker per render, so with
  // hundreds of stickers on screen a per-call scan over every active exchange's entries
  // (repeated for every sticker) got expensive. Build the lookup once per `active` change instead.
  function countsByStickerId(pick: (e: Exchange) => StickerEntry[]) {
    const map = new Map<string, number>()
    for (const entry of active.value.flatMap(pick)) {
      const id = stickerIdForEntry(entry)
      map.set(id, (map.get(id) ?? 0) + entry.count)
    }
    return map
  }

  const reservedCounts = computed(() => countsByStickerId((e) => e.giving))
  const incomingCounts = computed(() => countsByStickerId((e) => e.wanting))

  function reservedCount(stickerId: string): number {
    return reservedCounts.value.get(stickerId) ?? 0
  }

  function incomingCount(stickerId: string): number {
    return incomingCounts.value.get(stickerId) ?? 0
  }

  /** How many currently-missing stickers will be pasted once active exchanges complete. */
  const pendingIncoming = computed(() => {
    const album = useAlbumStore()
    return active.value
      .flatMap((e) => e.wanting)
      .filter((entry) => album.stickers.get(stickerIdForEntry(entry))?.status === 'missing')
      .reduce((sum, entry) => sum + entry.count, 0)
  })

  /** How many duplicates are earmarked to be given away once active exchanges complete. */
  const pendingReserved = computed(() =>
    active.value.flatMap((e) => e.giving).reduce((sum, entry) => sum + entry.count, 0),
  )

  function trustLevel(partner: string): TrustLevel | null {
    return computeTrustLevel(partner, exchanges.value)
  }

  // --- CRUD -----------------------------------------------------------

  interface CreateOptions {
    giving: StickerEntry[]
    wanting: StickerEntry[]
    partner?: string
    meetingDate?: string
    /** Log a past exchange retroactively without touching current album state. */
    archived?: boolean
    archiveCancelled?: boolean
    archiveCancellationReason?: CancellationReason
  }

  async function create(options: CreateOptions): Promise<Exchange> {
    const now = new Date().toISOString()
    const exchange: Exchange = {
      id: crypto.randomUUID(),
      createdAt: now,
      meetingDate: options.meetingDate ?? now,
      giving: options.giving,
      wanting: options.wanting,
      status: 'active',
      partner: options.partner ?? '',
      isArchived: !!options.archived,
    }
    if (options.archived) {
      if (options.archiveCancelled) {
        exchange.status = 'cancelled'
        exchange.cancellationReason = options.archiveCancellationReason
      } else {
        exchange.status = 'completed'
      }
    }
    await db.exchanges.add(toPlainExchange(exchange))
    exchanges.value.push(exchange)
    impact('medium')
    return exchange
  }

  async function update(
    id: string,
    patch: Partial<Pick<Exchange, 'giving' | 'wanting' | 'partner' | 'meetingDate'>>,
  ) {
    const exchange = findExchange(id)
    if (!exchange) return
    Object.assign(exchange, patch)
    await persist(exchange)
  }

  /** Applies the trade to the album: consumes given duplicates, adds received stickers. */
  async function complete(id: string) {
    const exchange = findExchange(id)
    if (!exchange || exchange.status !== 'active') return
    const album = useAlbumStore()

    for (const entry of exchange.giving) {
      const stickerId = stickerIdForEntry(entry)
      for (let i = 0; i < entry.count; i++) {
        await album.removeDuplicate(stickerId)
      }
    }

    for (const entry of exchange.wanting) {
      const stickerId = stickerIdForEntry(entry)
      const sticker = album.stickers.get(stickerId)
      if (!sticker) continue
      const wasMissing = sticker.status === 'missing'
      if (wasMissing) await album.paste(stickerId)
      const remaining = wasMissing ? entry.count - 1 : entry.count
      for (let i = 0; i < remaining; i++) {
        await album.addDuplicate(stickerId)
      }
    }

    exchange.status = 'completed'
    await persist(exchange)
    impact('medium')
  }

  async function cancel(id: string, reason?: CancellationReason) {
    const exchange = findExchange(id)
    if (!exchange) return
    exchange.status = 'cancelled'
    exchange.cancellationReason = reason
    await persist(exchange)
    impact('light')
  }

  function validateRestore(id: string): RestoreValidation {
    const exchange = findExchange(id)
    const album = useAlbumStore()
    const insufficientGiving: StickerEntry[] = []
    const alreadyOwnedWanting: StickerEntry[] = []
    if (!exchange) return { ok: false, insufficientGiving, alreadyOwnedWanting }

    for (const entry of exchange.giving) {
      const sticker = album.stickers.get(stickerIdForEntry(entry))
      if (!sticker || sticker.duplicateCount < entry.count) insufficientGiving.push(entry)
    }
    for (const entry of exchange.wanting) {
      const sticker = album.stickers.get(stickerIdForEntry(entry))
      if (sticker && sticker.status !== 'missing') alreadyOwnedWanting.push(entry)
    }
    return { ok: insufficientGiving.length === 0, insufficientGiving, alreadyOwnedWanting }
  }

  async function restore(id: string) {
    const exchange = findExchange(id)
    if (!exchange) return
    exchange.status = 'active'
    exchange.cancellationReason = undefined
    await persist(exchange)
    impact('light')
  }

  return {
    exchanges,
    loaded,
    load,
    active,
    history,
    partnerNames,
    findExchange,
    reservedCount,
    incomingCount,
    pendingIncoming,
    pendingReserved,
    trustLevel,
    create,
    update,
    complete,
    cancel,
    validateRestore,
    restore,
  }
})
