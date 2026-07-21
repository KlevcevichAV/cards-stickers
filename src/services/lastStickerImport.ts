import type { StickerEntry } from '@/types/models'
import { parseTradeMessage } from '@/services/tradeMessageParser'

// LastSticker.ru doesn't send CORS headers, so a plain `fetch()` of a profile page from our
// origin would be silently blocked by the browser. r.jina.ai is a free reader proxy that fetches
// the page server-side and echoes back an `access-control-allow-origin` header for whatever
// origin asked — and, conveniently, its text extraction keeps the `display:none` sticker lists
// that LastSticker only reveals via JS, so no headless-browser step is needed on our end either.
const READER_PROXY_URL = 'https://r.jina.ai/'

const ALBUM_SLUG = 'panini_world_cup_2026'
const ALBUM_HEADING_LINK = `[PANINI Чемпионат мира 2026](https://www.laststicker.ru/cards/${ALBUM_SLUG}/)`
const HAVE_SECTION_MARK = 'На обмен('
const NEXT_HEADING_MARK = '### ['

const STICKER_CODE_LINK = new RegExp(
  `\\[([a-z0-9]{1,5})\\]\\(https://www\\.laststicker\\.ru/cards/${ALBUM_SLUG}/[a-z0-9]{1,5}/\\)`,
  'gi',
)

export interface LastStickerCollection {
  need: string[]
  have: string[]
}

function extractCodes(segment: string): string[] {
  return Array.from(segment.matchAll(STICKER_CODE_LINK)).map((m) => m[1])
}

/**
 * Pulls out this profile's "need"/"have" code lists for the Panini World Cup 2026 album
 * specifically, out of the full page text (which may also list other collections, e.g. a
 * different World Cup/Euro album this collector tracks — those must not leak in here).
 */
export function parseLastStickerPage(pageText: string): LastStickerCollection {
  const headingIndex = pageText.indexOf(ALBUM_HEADING_LINK)
  if (headingIndex === -1) {
    throw new Error('NO_ALBUM')
  }

  const fromHeading = pageText.slice(headingIndex + ALBUM_HEADING_LINK.length)
  const nextHeadingIndex = fromHeading.indexOf(NEXT_HEADING_MARK)
  const section = nextHeadingIndex === -1 ? fromHeading : fromHeading.slice(0, nextHeadingIndex)

  const haveIndex = section.indexOf(HAVE_SECTION_MARK)
  const needPart = haveIndex === -1 ? section : section.slice(0, haveIndex)
  const havePart = haveIndex === -1 ? '' : section.slice(haveIndex)

  return { need: extractCodes(needPart), have: extractCodes(havePart) }
}

/** Accepts a full profile URL (any of its sub-pages) or a bare numeric id. */
function extractUserId(profileUrlOrId: string): string {
  const match = profileUrlOrId.match(/(\d+)/)
  if (!match) throw new Error('NO_USER_ID')
  return match[1]
}

export interface LastStickerEntries {
  need: StickerEntry[]
  have: StickerEntry[]
}

/**
 * Fetches a LastSticker.ru collector's public "fond" page (no login required) and returns their
 * World Cup 2026 need/have lists as ready-to-apply sticker entries. The raw code lists are run
 * back through the plain-text list format (`parseTradeMessage`) rather than hand-rolling a second
 * "code string → StickerEntry" converter — one already exists and handles edge cases like the
 * standalone "00" logo sticker.
 */
export async function fetchLastStickerCollection(profileUrlOrId: string): Promise<LastStickerEntries> {
  const userId = extractUserId(profileUrlOrId)
  const targetUrl = `https://www.laststicker.ru/users/fond/${userId}/`

  const response = await fetch(READER_PROXY_URL + targetUrl)
  if (!response.ok) throw new Error('FETCH_FAILED')
  const pageText = await response.text()

  const { need, have } = parseLastStickerPage(pageText)
  const parsed = parseTradeMessage(`Ищу:\n${need.join(', ')}\nНа обмен:\n${have.join(', ')}`)
  return { need: parsed.need, have: parsed.have }
}
