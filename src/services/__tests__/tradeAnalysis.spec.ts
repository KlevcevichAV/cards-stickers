import { describe, it, expect } from 'vitest'
import { analyzeTrade, tradeMessageType, withoutConflicts } from '@/services/tradeAnalysis'
import type { Sticker } from '@/types/models'

function sticker(overrides: Partial<Sticker> & Pick<Sticker, 'id' | 'teamCode' | 'number'>): Sticker {
  return {
    type: 'player',
    nameEN: '',
    nameRU: '',
    status: 'missing',
    duplicateCount: 0,
    isFoil: false,
    ...overrides,
  }
}

describe('tradeMessageType', () => {
  it('classifies have-only, need-only, and both', () => {
    expect(tradeMessageType({ have: [], need: [] })).toBe('haveOnly')
    expect(tradeMessageType({ have: [{ teamCode: 'A', number: 1, count: 1 }], need: [] })).toBe('haveOnly')
    expect(tradeMessageType({ have: [], need: [{ teamCode: 'A', number: 1, count: 1 }] })).toBe('needOnly')
    expect(
      tradeMessageType({
        have: [{ teamCode: 'A', number: 1, count: 1 }],
        need: [{ teamCode: 'B', number: 2, count: 1 }],
      }),
    ).toBe('both')
  })
})

describe('analyzeTrade', () => {
  const stickers = new Map<string, Sticker>([
    ['ARG17', sticker({ id: 'ARG17', teamCode: 'ARG', number: 17, status: 'missing' })],
    ['BRA14', sticker({ id: 'BRA14', teamCode: 'BRA', number: 14, status: 'duplicate', duplicateCount: 2 })],
    ['FRA20', sticker({ id: 'FRA20', teamCode: 'FRA', number: 20, status: 'pasted' })],
    ['ESP15', sticker({ id: 'ESP15', teamCode: 'ESP', number: 15, status: 'missing' })],
    ['EGY17', sticker({ id: 'EGY17', teamCode: 'EGY', number: 17, status: 'duplicate', duplicateCount: 1 })],
  ])

  it('finds what they have that we need', () => {
    const result = analyzeTrade(
      { have: [{ teamCode: 'ARG', number: 17, count: 1 }, { teamCode: 'FRA', number: 20, count: 1 }], need: [] },
      stickers,
    )
    // ARG17 is missing for us → a real opportunity. FRA20 we already have → not.
    expect(result.theyHaveWeNeed).toEqual([{ teamCode: 'ARG', number: 17, count: 1 }])
  })

  it('finds what they need that we have spare', () => {
    const result = analyzeTrade(
      { have: [], need: [{ teamCode: 'BRA', number: 14, count: 1 }, { teamCode: 'ARG', number: 17, count: 1 }] },
      stickers,
    )
    // BRA14 we have as a duplicate → we can give it. ARG17 is missing for us too → can't give.
    expect(result.weHaveTheyNeed).toEqual([{ teamCode: 'BRA', number: 14, count: 1 }])
  })

  it('flags informational-only overlaps (both missing it, or both have spares)', () => {
    const result = analyzeTrade(
      {
        have: [{ teamCode: 'EGY', number: 17, count: 1 }],
        need: [{ teamCode: 'ESP', number: 15, count: 1 }],
      },
      stickers,
    )
    // They have a spare EGY17 and we also have a spare EGY17 — no trade possible.
    expect(result.weHaveButTheyDontNeed).toEqual([{ teamCode: 'EGY', number: 17, count: 1 }])
    // They need ESP15 and we also don't have it — no trade possible.
    expect(result.weNeedButTheyDontHave).toEqual([{ teamCode: 'ESP', number: 15, count: 1 }])
  })

  it('treats an unknown sticker id as neither owned nor missing-tradeable', () => {
    const result = analyzeTrade({ have: [{ teamCode: 'ZZZ', number: 99, count: 1 }], need: [] }, stickers)
    expect(result.theyHaveWeNeed).toEqual([])
    expect(result.weHaveButTheyDontNeed).toEqual([])
  })
})

describe('withoutConflicts', () => {
  it('excludes entries already reserved or incoming elsewhere', () => {
    const entries = [
      { teamCode: 'ARG', number: 17, count: 1 },
      { teamCode: 'BRA', number: 14, count: 1 },
    ]
    const conflictCount = (id: string) => (id === 'ARG17' ? 1 : 0)
    expect(withoutConflicts(entries, conflictCount)).toEqual([{ teamCode: 'BRA', number: 14, count: 1 }])
  })
})
