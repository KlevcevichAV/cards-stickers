import type { CancellationReason, PurchaseKind, StickerEntry } from '@/types/models'

export interface SheetAction {
  label: string
  style?: 'default' | 'destructive'
  onSelect: () => void
}

export interface ExchangeFormPayload {
  giving: StickerEntry[]
  wanting: StickerEntry[]
  partner: string
  meetingDate: string
  archived: boolean
  archiveCancelled: boolean
  archiveCancellationReason?: CancellationReason
}

export interface PurchaseFormPayload {
  kind: PurchaseKind
  quantity: number
  price: number
  date: string
}

export interface SaleFormPayload {
  stickers: StickerEntry[]
  price: number
  date: string
  comment: string
}
