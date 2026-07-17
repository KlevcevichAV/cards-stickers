import type { Sticker, StickerEntry } from '@/types/models'
import type { ParsedTradeMessage } from '@/services/tradeMessageParser'
import { stickerIdForEntry } from '@/services/stickerId'

export type TradeMessageType = 'haveOnly' | 'needOnly' | 'both'

export function tradeMessageType(parsed: ParsedTradeMessage): TradeMessageType {
  const hasHave = parsed.have.length > 0
  const hasNeed = parsed.need.length > 0
  if (hasHave && hasNeed) return 'both'
  if (hasNeed) return 'needOnly'
  return 'haveOnly'
}

export interface TradeAnalysisResult {
  /** Stickers they listed as spare that we're currently missing — the core trade opportunity. */
  theyHaveWeNeed: StickerEntry[]
  /** Stickers they're looking for that we have spare — the other half of the trade. */
  weHaveTheyNeed: StickerEntry[]
  /** They're looking for these too — informational only, no trade possible. */
  weNeedButTheyDontHave: StickerEntry[]
  /** They also have spares of these — informational only, no trade possible. */
  weHaveButTheyDontNeed: StickerEntry[]
}

export function analyzeTrade(
  parsed: ParsedTradeMessage,
  stickers: Map<string, Sticker>,
): TradeAnalysisResult {
  const stickerFor = (entry: StickerEntry) => stickers.get(stickerIdForEntry(entry))

  return {
    theyHaveWeNeed: parsed.have.filter((e) => stickerFor(e)?.status === 'missing'),
    weHaveTheyNeed: parsed.need.filter((e) => (stickerFor(e)?.duplicateCount ?? 0) > 0),
    weNeedButTheyDontHave: parsed.need.filter((e) => stickerFor(e)?.status === 'missing'),
    weHaveButTheyDontNeed: parsed.have.filter((e) => (stickerFor(e)?.duplicateCount ?? 0) > 0),
  }
}

/** Filters out entries already reserved/incoming via another active exchange. */
export function withoutConflicts(
  entries: StickerEntry[],
  conflictCount: (stickerIdStr: string) => number,
): StickerEntry[] {
  return entries.filter((e) => conflictCount(stickerIdForEntry(e)) === 0)
}
