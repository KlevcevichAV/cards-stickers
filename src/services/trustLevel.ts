import type { Exchange } from '@/types/models'

export type TrustLevel = 'good' | 'medium' | 'bad'

const BAD_REASONS = new Set(['noShow', 'noResponse'])

/**
 * Ported from ExchangeModel.swift's TrustLevel.compute: "good" if any completed
 * exchange exists with this partner, "bad" if any cancellation was a no-show/no-response,
 * otherwise "medium". Returns null for an empty/unknown partner with no history.
 */
export function computeTrustLevel(partner: string, exchanges: Exchange[]): TrustLevel | null {
  const trimmed = partner.trim()
  if (!trimmed) return null

  const history = exchanges.filter((e) => e.partner === partner)
  if (history.length === 0) return null

  if (history.some((e) => e.status === 'completed')) return 'good'
  if (history.some((e) => e.cancellationReason && BAD_REASONS.has(e.cancellationReason))) return 'bad'
  return 'medium'
}
