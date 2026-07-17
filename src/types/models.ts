export type StickerStatus = 'missing' | 'pasted' | 'duplicate'
export type StickerType = 'logo' | 'teamPhoto' | 'player'

export interface Team {
  code: string
  nameEN: string
  nameRU: string
  groupLetter: string
  orderIndex: number
  flagEmoji: string
}

export interface Sticker {
  id: string
  teamCode: string
  number: number
  type: StickerType
  nameEN: string
  nameRU: string
  status: StickerStatus
  duplicateCount: number
  isFoil: boolean
}

export interface StickerEntry {
  teamCode: string
  number: number
  count: number
}

export type ExchangeStatus = 'active' | 'completed' | 'cancelled'
export type CancellationReason = 'noShow' | 'noResponse' | 'noAgreement'

export interface Exchange {
  id: string
  createdAt: string
  meetingDate: string
  giving: StickerEntry[]
  wanting: StickerEntry[]
  status: ExchangeStatus
  partner: string
  cancellationReason?: CancellationReason
  isArchived: boolean
}

export type PurchaseKind = 'album' | 'pack' | 'blister3' | 'blister8'

export interface Purchase {
  id: string
  kind: PurchaseKind
  quantity: number
  price: number
  date: string
  stickerCount: number
}

export interface Sale {
  id: string
  stickers: StickerEntry[]
  price: number
  date: string
  comment: string
}

export interface AchievementRecord {
  achievementID: string
  unlockedAt: string
}

export interface SavedAnalysis {
  id: string
  createdAt: string
  messageText: string
  note: string
}

export type AchievementCategory =
  | 'superstar'
  | 'starHunter'
  | 'team'
  | 'worldRuler'
  | 'centurion'
  | 'milestone'

export type AchievementTrigger =
  | { kind: 'stickerPasted'; id: string }
  | { kind: 'allStarsPasted' }
  | { kind: 'teamCompleted'; code: string }
  | { kind: 'allTeamsCompleted' }
  | { kind: 'totalPasted'; count: number }
  | { kind: 'albumPercent'; threshold: number }

export interface AchievementDefinition {
  id: string
  titleEN: string
  titleRU: string
  descEN: string
  descRU: string
  icon: string
  category: AchievementCategory
  trigger: AchievementTrigger
}
