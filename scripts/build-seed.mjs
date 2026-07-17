// One-off build script: merges the Panini sticker source data with team
// metadata (both transcribed from the original iOS app's SeedDataService.swift)
// into a single typed seed file consumed at runtime by src/db/database.ts.
//
// Run with: node scripts/build-seed.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(__dirname, 'source', 'stickers_db.json')
const outPath = path.join(__dirname, '..', 'src', 'data', 'seed.ts')

/** @type {{ sectionName: string, stickers: { stickerNumber: string, fullName: string, isShiny: boolean }[] }[]} */
const sections = JSON.parse(readFileSync(sourcePath, 'utf-8'))

// "We Are Panini" holds a single sticker — the "Panini Logo" — which is its
// own standalone page/team ("00"), NOT part of FWC: no shared group, no
// shared page, its own line everywhere (album, trade message, trade analysis).
const STANDALONE_LOGO_CODE = '00'
const STANDALONE_LOGO_SECTION = 'We Are Panini'

const fwcSectionNames = new Set([
  'FIFA World Cup 2026',
  'Host Countries and Cities',
  'FIFA World Cup History',
])

const sectionToCode = {
  Mexico: 'MEX',
  'South Korea': 'KOR',
  Czechia: 'CZE',
  'South Africa': 'RSA',
  Canada: 'CAN',
  'Bosnia and Herzegovina': 'BIH',
  Qatar: 'QAT',
  Switzerland: 'SUI',
  Brazil: 'BRA',
  Morocco: 'MAR',
  Haiti: 'HAI',
  Scotland: 'SCO',
  USA: 'USA',
  Paraguay: 'PAR',
  Australia: 'AUS',
  Türkiye: 'TUR',
  Germany: 'GER',
  Curaçao: 'CUW',
  'Ivory Coast': 'CIV',
  Ecuador: 'ECU',
  Netherlands: 'NED',
  Japan: 'JPN',
  Sweden: 'SWE',
  Tunisia: 'TUN',
  Belgium: 'BEL',
  Egypt: 'EGY',
  Iran: 'IRN',
  'New Zealand': 'NZL',
  Spain: 'ESP',
  'Cape Verde': 'CPV',
  'Saudi Arabia': 'KSA',
  Uruguay: 'URU',
  France: 'FRA',
  Senegal: 'SEN',
  Iraq: 'IRQ',
  Norway: 'NOR',
  Argentina: 'ARG',
  Algeria: 'ALG',
  Austria: 'AUT',
  Jordan: 'JOR',
  Portugal: 'POR',
  'Congo DR': 'COD',
  Uzbekistan: 'UZB',
  Colombia: 'COL',
  England: 'ENG',
  Croatia: 'CRO',
  Ghana: 'GHA',
  Panama: 'PAN',
}

const allTeamMeta = {
  [STANDALONE_LOGO_CODE]: { nameEN: 'Panini Logo', nameRU: 'Логотип Panini', group: '00', flag: '✨' },
  FWC: { nameEN: 'FIFA World Cup 2026', nameRU: 'ЧМ ФИФА 2026', group: 'FWC', flag: '🏆' },
  MEX: { nameEN: 'Mexico', nameRU: 'Мексика', group: 'A', flag: '🇲🇽' },
  KOR: { nameEN: 'South Korea', nameRU: 'Южная Корея', group: 'A', flag: '🇰🇷' },
  CZE: { nameEN: 'Czechia', nameRU: 'Чехия', group: 'A', flag: '🇨🇿' },
  RSA: { nameEN: 'South Africa', nameRU: 'ЮАР', group: 'A', flag: '🇿🇦' },
  CAN: { nameEN: 'Canada', nameRU: 'Канада', group: 'B', flag: '🇨🇦' },
  BIH: { nameEN: 'Bosnia & Herzegovina', nameRU: 'Босния и Герцеговина', group: 'B', flag: '🇧🇦' },
  QAT: { nameEN: 'Qatar', nameRU: 'Катар', group: 'B', flag: '🇶🇦' },
  SUI: { nameEN: 'Switzerland', nameRU: 'Швейцария', group: 'B', flag: '🇨🇭' },
  BRA: { nameEN: 'Brazil', nameRU: 'Бразилия', group: 'C', flag: '🇧🇷' },
  MAR: { nameEN: 'Morocco', nameRU: 'Марокко', group: 'C', flag: '🇲🇦' },
  HAI: { nameEN: 'Haiti', nameRU: 'Гаити', group: 'C', flag: '🇭🇹' },
  SCO: { nameEN: 'Scotland', nameRU: 'Шотландия', group: 'C', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  USA: { nameEN: 'USA', nameRU: 'США', group: 'D', flag: '🇺🇸' },
  PAR: { nameEN: 'Paraguay', nameRU: 'Парагвай', group: 'D', flag: '🇵🇾' },
  AUS: { nameEN: 'Australia', nameRU: 'Австралия', group: 'D', flag: '🇦🇺' },
  TUR: { nameEN: 'Türkiye', nameRU: 'Турция', group: 'D', flag: '🇹🇷' },
  GER: { nameEN: 'Germany', nameRU: 'Германия', group: 'E', flag: '🇩🇪' },
  CUW: { nameEN: 'Curaçao', nameRU: 'Кюрасао', group: 'E', flag: '🇨🇼' },
  CIV: { nameEN: 'Ivory Coast', nameRU: "Кот-д'Ивуар", group: 'E', flag: '🇨🇮' },
  ECU: { nameEN: 'Ecuador', nameRU: 'Эквадор', group: 'E', flag: '🇪🇨' },
  NED: { nameEN: 'Netherlands', nameRU: 'Нидерланды', group: 'F', flag: '🇳🇱' },
  JPN: { nameEN: 'Japan', nameRU: 'Япония', group: 'F', flag: '🇯🇵' },
  SWE: { nameEN: 'Sweden', nameRU: 'Швеция', group: 'F', flag: '🇸🇪' },
  TUN: { nameEN: 'Tunisia', nameRU: 'Тунис', group: 'F', flag: '🇹🇳' },
  BEL: { nameEN: 'Belgium', nameRU: 'Бельгия', group: 'G', flag: '🇧🇪' },
  EGY: { nameEN: 'Egypt', nameRU: 'Египет', group: 'G', flag: '🇪🇬' },
  IRN: { nameEN: 'Iran', nameRU: 'Иран', group: 'G', flag: '🇮🇷' },
  NZL: { nameEN: 'New Zealand', nameRU: 'Новая Зеландия', group: 'G', flag: '🇳🇿' },
  ESP: { nameEN: 'Spain', nameRU: 'Испания', group: 'H', flag: '🇪🇸' },
  CPV: { nameEN: 'Cape Verde', nameRU: 'Кабо-Верде', group: 'H', flag: '🇨🇻' },
  KSA: { nameEN: 'Saudi Arabia', nameRU: 'Саудовская Аравия', group: 'H', flag: '🇸🇦' },
  URU: { nameEN: 'Uruguay', nameRU: 'Уругвай', group: 'H', flag: '🇺🇾' },
  FRA: { nameEN: 'France', nameRU: 'Франция', group: 'I', flag: '🇫🇷' },
  SEN: { nameEN: 'Senegal', nameRU: 'Сенегал', group: 'I', flag: '🇸🇳' },
  IRQ: { nameEN: 'Iraq', nameRU: 'Ирак', group: 'I', flag: '🇮🇶' },
  NOR: { nameEN: 'Norway', nameRU: 'Норвегия', group: 'I', flag: '🇳🇴' },
  ARG: { nameEN: 'Argentina', nameRU: 'Аргентина', group: 'J', flag: '🇦🇷' },
  ALG: { nameEN: 'Algeria', nameRU: 'Алжир', group: 'J', flag: '🇩🇿' },
  AUT: { nameEN: 'Austria', nameRU: 'Австрия', group: 'J', flag: '🇦🇹' },
  JOR: { nameEN: 'Jordan', nameRU: 'Иордания', group: 'J', flag: '🇯🇴' },
  POR: { nameEN: 'Portugal', nameRU: 'Португалия', group: 'K', flag: '🇵🇹' },
  COD: { nameEN: 'Congo DR', nameRU: 'ДР Конго', group: 'K', flag: '🇨🇩' },
  UZB: { nameEN: 'Uzbekistan', nameRU: 'Узбекистан', group: 'K', flag: '🇺🇿' },
  COL: { nameEN: 'Colombia', nameRU: 'Колумбия', group: 'K', flag: '🇨🇴' },
  ENG: { nameEN: 'England', nameRU: 'Англия', group: 'L', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  CRO: { nameEN: 'Croatia', nameRU: 'Хорватия', group: 'L', flag: '🇭🇷' },
  GHA: { nameEN: 'Ghana', nameRU: 'Гана', group: 'L', flag: '🇬🇭' },
  PAN: { nameEN: 'Panama', nameRU: 'Панама', group: 'L', flag: '🇵🇦' },
}

function extractNumber(id) {
  const match = id.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

function resolveType(number, name) {
  const lower = name.toLowerCase()
  if (number === 1 || lower.includes('emblem') || lower === 'panini logo') return 'logo'
  if (lower.includes('team photo')) return 'teamPhoto'
  return 'player'
}

const order = []
const stickersByCode = new Map()

for (const section of sections) {
  const code =
    section.sectionName === STANDALONE_LOGO_SECTION
      ? STANDALONE_LOGO_CODE
      : fwcSectionNames.has(section.sectionName)
        ? 'FWC'
        : (sectionToCode[section.sectionName] ?? section.sectionName.toUpperCase())

  if (!stickersByCode.has(code)) {
    order.push(code)
    stickersByCode.set(code, [])
  }
  stickersByCode.get(code).push(...section.stickers)
}

/** @type {import('../src/types/models').Team[]} */
const teams = []
/** @type {import('../src/types/models').Sticker[]} */
const stickers = []

order.forEach((code, orderIndex) => {
  const meta = allTeamMeta[code]
  if (!meta) {
    throw new Error(`No team metadata for code "${code}" — check sectionToCode/allTeamMeta.`)
  }

  teams.push({
    code,
    nameEN: meta.nameEN,
    nameRU: meta.nameRU,
    groupLetter: meta.group,
    orderIndex,
    flagEmoji: meta.flag,
  })

  for (const dbSticker of stickersByCode.get(code)) {
    const number = extractNumber(dbSticker.stickerNumber)
    // The standalone "00" team has exactly one sticker, printed with its own
    // id "00" (not "000" from naively concatenating code+number).
    const id =
      code === STANDALONE_LOGO_CODE
        ? STANDALONE_LOGO_CODE
        : /^[A-Za-z]/.test(dbSticker.stickerNumber)
          ? dbSticker.stickerNumber
          : `${code}${dbSticker.stickerNumber}`
    stickers.push({
      id,
      teamCode: code,
      number,
      type: resolveType(number, dbSticker.fullName),
      nameEN: dbSticker.fullName,
      nameRU: dbSticker.fullName,
      status: 'missing',
      duplicateCount: 0,
      isFoil: dbSticker.isShiny,
    })
  }
})

if (teams.length !== 50) {
  throw new Error(`Expected 50 teams (48 + FWC + standalone "00"), got ${teams.length}`)
}
if (stickers.length !== 980) {
  throw new Error(`Expected 980 stickers, got ${stickers.length}`)
}

const banner = `// GENERATED FILE — do not edit by hand.
// Produced by scripts/build-seed.mjs from scripts/source/stickers_db.json
// plus team metadata transcribed from the original iOS app's SeedDataService.swift.
// Re-run \`node scripts/build-seed.mjs\` after changing either input.

import type { Team, Sticker } from '@/types/models'

export const seedTeams: Team[] = ${JSON.stringify(teams, null, 2)}

export const seedStickers: Sticker[] = ${JSON.stringify(stickers, null, 2)}
`

writeFileSync(outPath, banner, 'utf-8')
console.log(`Wrote ${teams.length} teams and ${stickers.length} stickers to ${path.relative(process.cwd(), outPath)}`)
