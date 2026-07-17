import type { CancellationReason, StickerEntry } from '@/types/models'

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
