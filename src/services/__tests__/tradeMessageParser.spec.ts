import { describe, it, expect } from 'vitest'
import { parseTradeMessage } from '@/services/tradeMessageParser'

describe('parseTradeMessage', () => {
  it('parses "CODE emoji: nums" format with a multiplier', () => {
    const result = parseTradeMessage('ARG 🇦🇷: 1(x2), 5, 8')
    expect(result.have).toEqual([
      { teamCode: 'ARG', number: 1, count: 2 },
      { teamCode: 'ARG', number: 5, count: 1 },
      { teamCode: 'ARG', number: 8, count: 1 },
    ])
    expect(result.need).toEqual([])
  })

  it('parses the compact multi-team format without spaces', () => {
    const result = parseTradeMessage('FWC1, FWC2, KOR8, KOR11(2)')
    expect(result.have).toEqual([
      { teamCode: 'FWC', number: 1, count: 1 },
      { teamCode: 'FWC', number: 2, count: 1 },
      { teamCode: 'KOR', number: 8, count: 1 },
      { teamCode: 'KOR', number: 11, count: 2 },
    ])
  })

  it('splits have/need sections using Russian keywords', () => {
    // Each team gets its own line — "format 1" only recognizes a single team
    // code per line, so mixing two codes on one line is a "compact format"
    // case (covered separately below), not a have/need-splitting scenario.
    const text = ['Повторки', 'ARG 1, 5', 'Ищу', 'BRA 14', 'FRA 20'].join('\n')
    const result = parseTradeMessage(text)
    expect(result.have).toEqual([
      { teamCode: 'ARG', number: 1, count: 1 },
      { teamCode: 'ARG', number: 5, count: 1 },
    ])
    expect(result.need).toEqual([
      { teamCode: 'BRA', number: 14, count: 1 },
      { teamCode: 'FRA', number: 20, count: 1 },
    ])
  })

  it('treats lines before any section header as "have"', () => {
    const result = parseTradeMessage('MEX 1, 2')
    expect(result.have).toEqual([
      { teamCode: 'MEX', number: 1, count: 1 },
      { teamCode: 'MEX', number: 2, count: 1 },
    ])
    expect(result.need).toEqual([])
  })

  it('sums repeated numbers within a "format 1" line, e.g. "PAR 1,1,1" → count 3', () => {
    const result = parseTradeMessage('PAR 1,1,1')
    expect(result.have).toEqual([{ teamCode: 'PAR', number: 1, count: 3 }])
  })

  it('a no-space "PAR1,1,1" instead matches the compact format on just the first token', () => {
    // Without a space, "PAR1" alone satisfies the compact CODE+number pattern,
    // so parseTeamLine takes that branch and the trailing ",1,1" is never
    // reached by the format-1 number-list parser. This mirrors the original
    // Swift algorithm's actual (not just documented) behavior.
    const result = parseTradeMessage('PAR1,1,1')
    expect(result.have).toEqual([{ teamCode: 'PAR', number: 1, count: 1 }])
  })

  it('ignores betting-odds notation like "5(2на3)"', () => {
    const result = parseTradeMessage('5(2на3)\nARG 1')
    expect(result.have).toEqual([{ teamCode: 'ARG', number: 1, count: 1 }])
  })

  it('treats a bare "00" line as the standalone Panini Logo sticker, not a section divider', () => {
    // The original app treated a lone "00" line as a visual divider to skip.
    // Now that "00" is a real, standalone sticker (its own team/page, entirely
    // separate from FWC), that convention is retired in favor of recognizing it.
    // Entries are concatenated in line order (each line is sorted on its own,
    // but there's no global re-sort across lines), so "00" lands between the
    // lines that surround it.
    const result = parseTradeMessage('ARG 1\n00\nBRA 2')
    expect(result.have).toEqual([
      { teamCode: 'ARG', number: 1, count: 1 },
      { teamCode: '00', number: 0, count: 1 },
      { teamCode: 'BRA', number: 2, count: 1 },
    ])
  })

  it('treats a lone dash after the team code as "no stickers"', () => {
    expect(parseTradeMessage('ARG -').have).toEqual([])
    expect(parseTradeMessage('ARG —').have).toEqual([])
  })

  it('parses "*N" as an alternate multiplier syntax', () => {
    const result = parseTradeMessage('ARG 1*3, 5')
    expect(result.have).toEqual([
      { teamCode: 'ARG', number: 1, count: 3 },
      { teamCode: 'ARG', number: 5, count: 1 },
    ])
  })

  it('handles a full two-section real-world message', () => {
    const text = [
      'Обмен',
      'ПОВТОРЫ (Есть)',
      'ARG 1, 5, 8(x2)',
      'FWC3, FWC4',
      'ИЩУ (Нужно)',
      'BRA 14',
      'FRA 20, 1',
    ].join('\n')
    const result = parseTradeMessage(text)
    expect(result.have).toEqual([
      { teamCode: 'ARG', number: 1, count: 1 },
      { teamCode: 'ARG', number: 5, count: 1 },
      { teamCode: 'ARG', number: 8, count: 2 },
      { teamCode: 'FWC', number: 3, count: 1 },
      { teamCode: 'FWC', number: 4, count: 1 },
    ])
    expect(result.need).toEqual([
      { teamCode: 'BRA', number: 14, count: 1 },
      { teamCode: 'FRA', number: 1, count: 1 },
      { teamCode: 'FRA', number: 20, count: 1 },
    ])
  })

  it('ignores lines with no team code at all', () => {
    const result = parseTradeMessage('hello there\nno codes here either')
    expect(result.have).toEqual([])
    expect(result.need).toEqual([])
  })

  it('does not misdetect a header keyword line that also contains a team code as a header', () => {
    // "ищу ARG 1" contains both a need-keyword and a team code — Swift's rule
    // treats it as a data line (not a header) because containsTeamCode is true.
    const result = parseTradeMessage('ищу ARG 1')
    expect(result.have).toEqual([{ teamCode: 'ARG', number: 1, count: 1 }])
    expect(result.need).toEqual([])
  })

  describe('standalone "00" (its own team/page, entirely separate from FWC)', () => {
    it('recognizes a bare "00" preceding a coded segment on the same line', () => {
      // The exact case reported by the user: "00" typed before "FWC 1,2,3".
      const result = parseTradeMessage('Повторки: 00, FWC 1,2,3')
      expect(result.have).toEqual([
        { teamCode: '00', number: 0, count: 1 },
        { teamCode: 'FWC', number: 1, count: 1 },
        { teamCode: 'FWC', number: 2, count: 1 },
        { teamCode: 'FWC', number: 3, count: 1 },
      ])
    })

    it('recognizes a bare "00" on its own line, mixed with header keywords and other codes', () => {
      // The user's second report: "00" alone on its own line, under a
      // "Повторки:" header, followed by a separate "FWC 1,2,3" line.
      const result = parseTradeMessage('Повторки:\n00\nFWC 1,2,3')
      expect(result.have).toEqual([
        { teamCode: '00', number: 0, count: 1 },
        { teamCode: 'FWC', number: 1, count: 1 },
        { teamCode: 'FWC', number: 2, count: 1 },
        { teamCode: 'FWC', number: 3, count: 1 },
      ])
    })

    it('supports a multiplier on the standalone token, e.g. "00(x2)"', () => {
      const result = parseTradeMessage('ARG 1, 00(x2)')
      expect(result.have).toEqual([
        { teamCode: '00', number: 0, count: 2 },
        { teamCode: 'ARG', number: 1, count: 1 },
      ])
    })

    it('works in the compact multi-code format too', () => {
      const result = parseTradeMessage('00, KOR8')
      expect(result.have).toEqual([
        { teamCode: '00', number: 0, count: 1 },
        { teamCode: 'KOR', number: 8, count: 1 },
      ])
    })

    it('does not confuse a 3+ digit number containing "00" for the standalone sticker', () => {
      const result = parseTradeMessage('ARG 100, 200')
      expect(result.have).toEqual([
        { teamCode: 'ARG', number: 100, count: 1 },
        { teamCode: 'ARG', number: 200, count: 1 },
      ])
    })

    it('is no longer aliased by "FWC 0" / "FWC0" — those now parse as plain (and non-existent) FWC entries', () => {
      // Now that "00" is its own standalone team, FWC's own roster no longer
      // includes a number-0 sticker at all, so these forms don't refer to the
      // Panini Logo anymore — they're just ordinary (unmatched) FWC entries.
      expect(parseTradeMessage('FWC 0').have).toEqual([{ teamCode: 'FWC', number: 0, count: 1 }])
      expect(parseTradeMessage('FWC0').have).toEqual([{ teamCode: 'FWC', number: 0, count: 1 }])
    })
  })
})
