import type { StickerEntry } from '@/types/models'

export interface ParsedTradeMessage {
  have: StickerEntry[]
  need: StickerEntry[]
}

/**
 * Direct TypeScript port of TradeMessageParser.swift. Parses free-text sticker
 * trade messages from real-world chats: with/without emoji flags, with/without
 * colons, multipliers (x2)/(2)/*2, repeated numbers, and both "CODE: 1, 5, 8"
 * and compact "FWC0, FWC1, KOR8, KOR11(2)" formats.
 */
export function parseTradeMessage(text: string): ParsedTradeMessage {
  const lines = text.split(/\r\n|\r|\n/)

  const haveKeywords = ['повторки', 'в наличии', 'все повторки', 'есть на обмен', 'на обмен', 'повторы (есть)']
  const needKeywords = ['ищу', 'нужны', 'нужно', 'ищу (нужно)']

  type Section = 'have' | 'need' | 'unknown'
  let currentSection: Section = 'unknown'

  const haveLines: string[] = []
  const needLines: string[] = []

  const bettingNotationPattern = /\d+\(\d+на\d+\)/

  for (const raw of lines) {
    const line = raw.trim()
    const lower = line.toLowerCase()

    if (line.length === 0) continue
    if (bettingNotationPattern.test(line)) continue

    if (haveKeywords.some((k) => lower.includes(k)) && !hasParseableContent(line)) {
      currentSection = 'have'
      continue
    }
    if (needKeywords.some((k) => lower.includes(k)) && !hasParseableContent(line)) {
      currentSection = 'need'
      continue
    }

    if (currentSection === 'unknown' && hasParseableContent(line)) {
      currentSection = 'have'
    }

    if (!hasParseableContent(line)) continue

    if (currentSection === 'need') {
      needLines.push(line)
    } else {
      haveLines.push(line)
    }
  }

  return {
    have: haveLines.flatMap(parseTeamLine),
    need: needLines.flatMap(parseTeamLine),
  }
}

const TEAM_CODE_PATTERN = /(?<![A-Za-z])[A-Za-z]{3,4}(?![A-Za-z])/

function containsTeamCode(line: string): boolean {
  return TEAM_CODE_PATTERN.test(line)
}

/** A data line either names a team code, or references the standalone "00" (Panini Logo) sticker. */
function hasParseableContent(line: string): boolean {
  return containsTeamCode(line) || STANDALONE_LOGO_TEST_PATTERN.test(line)
}

const COMPACT_PATTERN = /([A-Za-z]{3,4})(\d+)\s*(?:\([xхх×]?(\d+)\)|\*(\d+))?/g

/**
 * A bare "00" (no letter code) refers to the standalone "Panini Logo" sticker
 * — its own one-sticker team ("00"), entirely separate from FWC or any other
 * team/page. Since it has no letter code, neither the compact nor the
 * "CODE: numbers" format can ever match it on their own — it has to be
 * pulled out separately.
 */
const STANDALONE_LOGO_TEAM_CODE = '00'
const STANDALONE_LOGO_PATTERN = /(?<!\d)00(?:\s*(?:\([xхх×]?(\d+)\)|\*(\d+)))?(?!\d)/g
/** Non-global sibling of STANDALONE_LOGO_PATTERN for plain boolean containment checks. */
const STANDALONE_LOGO_TEST_PATTERN = /(?<!\d)00(?!\d)/

function extractStandaloneLogoEntries(segment: string): StickerEntry[] {
  const matches = Array.from(segment.matchAll(STANDALONE_LOGO_PATTERN))
  if (matches.length === 0) return []
  const count = matches.reduce((sum, m) => sum + Number(m[1] ?? m[2] ?? 1), 0)
  return [{ teamCode: STANDALONE_LOGO_TEAM_CODE, number: 0, count }]
}

/** Merges entries sharing the same teamCode+number (summing counts) and sorts the result. */
function mergeAndSort(entries: StickerEntry[]): StickerEntry[] {
  const byKey = new Map<string, StickerEntry>()
  for (const entry of entries) {
    const key = `${entry.teamCode} ${entry.number}`
    const existing = byKey.get(key)
    if (existing) {
      existing.count += entry.count
    } else {
      byKey.set(key, { ...entry })
    }
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.teamCode === b.teamCode ? a.number - b.number : a.teamCode.localeCompare(b.teamCode),
  )
}

/**
 * Parses one line into sticker entries. Tries the compact "CODE1, CODE2(2)"
 * format first (multiple teams without spaces); falls back to the
 * "CODE [emoji] [:] 1, 5, 8" format (one team, a number list).
 *
 * A standalone "00" is extracted up front and stripped from the line before
 * either branch runs — it belongs to no team code, and "00" written after
 * some OTHER code's own number list (e.g. "ARG 1, 00") must not be
 * misattributed to that team (no team has a real "00" sticker; only the
 * Panini Logo does).
 */
function parseTeamLine(line: string): StickerEntry[] {
  const standalone = extractStandaloneLogoEntries(line)
  const cleanedLine = line.replace(STANDALONE_LOGO_PATTERN, '')

  const compactMatches = Array.from(cleanedLine.matchAll(COMPACT_PATTERN))

  if (compactMatches.length > 0) {
    const compactEntries = compactMatches.map((m) => ({
      teamCode: m[1].toUpperCase(),
      number: Number(m[2]),
      count: Number(m[3] ?? m[4] ?? 1),
    }))
    return mergeAndSort([...standalone, ...compactEntries])
  }

  const codeMatch = cleanedLine.match(TEAM_CODE_PATTERN)
  if (!codeMatch || codeMatch.index === undefined) {
    return mergeAndSort(standalone)
  }

  const teamCode = codeMatch[0].toUpperCase()
  const afterCode = cleanedLine.slice(codeMatch.index + codeMatch[0].length)
  const stripped = stripFlagsAndColon(afterCode).trim()
  if (stripped.length === 0 || stripped === '-' || stripped === '—') return mergeAndSort(standalone)

  return mergeAndSort([...standalone, ...parseNumbers(stripped, teamCode)])
}

const REGIONAL_INDICATOR_MIN = 0x1f1e0
const REGIONAL_INDICATOR_MAX = 0x1f1ff
const FLAG_SYMBOL_MIN = 0x1f3f3
const FLAG_SYMBOL_MAX = 0x1f3ff
const VARIATION_SELECTOR = 0xfe0f
const TAG_MIN = 0xe0000
const TAG_MAX = 0xe007f

/** Strips emoji flags (regional indicators, tag sequences) and a leading colon. */
function stripFlagsAndColon(s: string): string {
  let result = ''
  let sawNonWhitespace = false
  for (const char of s) {
    const scalar = char.codePointAt(0) ?? 0
    const isFlagPart =
      (scalar >= REGIONAL_INDICATOR_MIN && scalar <= REGIONAL_INDICATOR_MAX) ||
      (scalar >= FLAG_SYMBOL_MIN && scalar <= FLAG_SYMBOL_MAX) ||
      scalar === VARIATION_SELECTOR ||
      (scalar >= TAG_MIN && scalar <= TAG_MAX)
    if (isFlagPart) continue
    if (char === ':' && !sawNonWhitespace) continue
    if (char.trim().length > 0) sawNonWhitespace = true
    result += char
  }
  return result.replace(/^[:\s]+/, '').trim()
}

const NUMBER_PATTERN = /(\d+)\s*(?:\([xхх×]?(\d+)\)|\*(\d+))?/

/** Parses "1(x2), 5, 8(x3), 14 (2)" into sticker entries, summing repeated numbers. */
function parseNumbers(s: string, teamCode: string): StickerEntry[] {
  const tokens = s.split(/[,/]/)
  const countByNumber = new Map<number, number>()

  for (const token of tokens) {
    const t = token.trim()
    if (t.length === 0) continue

    const match = t.match(NUMBER_PATTERN)
    if (!match) continue

    const num = Number(match[1])
    const qty = Number(match[2] ?? match[3] ?? 1)
    countByNumber.set(num, (countByNumber.get(num) ?? 0) + qty)
  }

  return Array.from(countByNumber.entries())
    .map(([number, count]) => ({ teamCode, number, count }))
    .sort((a, b) => a.number - b.number)
}
