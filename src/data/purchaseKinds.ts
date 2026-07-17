import type { PurchaseKind } from '@/types/models'

export interface PurchaseKindMeta {
  kind: PurchaseKind
  nameEN: string
  nameRU: string
  defaultPrice: number
  stickersPerUnit: number
  packsPerUnit: number
  icon: string
}

export const purchaseKinds: PurchaseKindMeta[] = [
  { kind: 'album', nameEN: 'Album', nameRU: 'Журнал', defaultPrice: 17.99, stickersPerUnit: 0, packsPerUnit: 0, icon: 'book' },
  { kind: 'pack', nameEN: 'Pack', nameRU: 'Пак', defaultPrice: 4.99, stickersPerUnit: 7, packsPerUnit: 1, icon: 'envelope' },
  {
    kind: 'blister3',
    nameEN: 'Blister ×3',
    nameRU: 'Блистер ×3',
    defaultPrice: 15.99,
    stickersPerUnit: 21,
    packsPerUnit: 3,
    icon: 'stack',
  },
  {
    kind: 'blister8',
    nameEN: 'Blister ×8',
    nameRU: 'Блистер ×8',
    defaultPrice: 45.99,
    stickersPerUnit: 56,
    packsPerUnit: 8,
    icon: 'stack3d',
  },
]

export const purchaseKindsByKind: Map<PurchaseKind, PurchaseKindMeta> = new Map(
  purchaseKinds.map((k) => [k.kind, k]),
)
