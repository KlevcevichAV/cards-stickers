import type { StickerEntry } from '@/types/models'

/**
 * Maps a (teamCode, number) pair — as used by StickerEntry throughout the
 * exchange/trade features — to the sticker's actual `id` in the album.
 *
 * Almost always just `${teamCode}${number}`, EXCEPT the standalone "Panini
 * Logo" sticker: it's its own one-sticker team (code "00", number 0), so
 * naive concatenation would give "000" instead of its real id "00". Any code
 * that reconstructs a sticker id from a StickerEntry must go through this
 * helper, not inline template-literal concatenation.
 */
const STANDALONE_LOGO_TEAM_CODE = '00'

export function stickerIdFor(teamCode: string, number: number): string {
  if (teamCode === STANDALONE_LOGO_TEAM_CODE) return STANDALONE_LOGO_TEAM_CODE
  return `${teamCode}${number}`
}

export function stickerIdForEntry(entry: Pick<StickerEntry, 'teamCode' | 'number'>): string {
  return stickerIdFor(entry.teamCode, entry.number)
}

/**
 * Human-readable label for a (teamCode, number) pair, e.g. "ARG #17". The
 * standalone "00" team has only one sticker, so its number is redundant —
 * just "00" on its own, never "00 #0".
 */
export function stickerLabelFor(teamCode: string, number: number): string {
  if (teamCode === STANDALONE_LOGO_TEAM_CODE) return teamCode
  return `${teamCode} #${number}`
}

/** Same as stickerLabelFor, plus a "×N" suffix when the entry's count is more than 1. */
export function stickerEntryLabel(entry: StickerEntry): string {
  const base = stickerLabelFor(entry.teamCode, entry.number)
  return entry.count > 1 ? `${base} ×${entry.count}` : base
}
