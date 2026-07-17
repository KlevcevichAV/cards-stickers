import Dexie, { type EntityTable } from 'dexie'
import type {
  Team,
  Sticker,
  Exchange,
  Purchase,
  Sale,
  AchievementRecord,
  SavedAnalysis,
} from '@/types/models'
import { seedTeams, seedStickers } from '@/data/seed'

interface MetaRow {
  key: string
  value: unknown
}

class StickerTrackerDB extends Dexie {
  teams!: EntityTable<Team, 'code'>
  stickers!: EntityTable<Sticker, 'id'>
  exchanges!: EntityTable<Exchange, 'id'>
  purchases!: EntityTable<Purchase, 'id'>
  sales!: EntityTable<Sale, 'id'>
  achievementRecords!: EntityTable<AchievementRecord, 'achievementID'>
  savedAnalyses!: EntityTable<SavedAnalysis, 'id'>
  meta!: EntityTable<MetaRow, 'key'>

  constructor() {
    super('StickerTrackerDB')
    this.version(1).stores({
      teams: 'code, orderIndex, groupLetter',
      stickers: 'id, teamCode, status',
      exchanges: 'id, status, partner, createdAt',
      purchases: 'id, date',
      sales: 'id, date',
      achievementRecords: 'achievementID, unlockedAt',
      savedAnalyses: 'id, createdAt',
      meta: 'key',
    })
  }
}

export const db = new StickerTrackerDB()

const SEEDED_KEY = 'seeded'

// The "Panini Logo" sticker's shape changed twice as the data model was
// corrected: originally seeded as id "FWC0" (teamCode "FWC"), then its id was
// fixed to "00" while still keeping teamCode "FWC", and finally split off
// into its own standalone one-sticker team (id "00", teamCode "00", its own
// page/group — see stickerIdFor). Browsers already seeded before either fix
// would otherwise be stuck on a stale shape forever, since normal seeding
// only ever runs once — so this migration runs unconditionally on every boot
// (a few cheap gets) to converge any of the older shapes onto the current one.
const STANDALONE_LOGO_TEAM_CODE = '00'
const LEGACY_LOGO_ID = 'FWC0'
const LOGO_ID = '00'

async function migrateStandaloneLogoSticker(): Promise<void> {
  // Always resync this one team row from the current seed (cheap: one row) —
  // covers both "team doesn't exist yet" and "exists with stale metadata"
  // (e.g. an older build's placeholder emoji), without needing a fresh
  // migration step every time this team's display details change.
  const seededLogoTeam = seedTeams.find((t) => t.code === STANDALONE_LOGO_TEAM_CODE)
  const currentLogoTeam = await db.teams.get(STANDALONE_LOGO_TEAM_CODE)
  if (seededLogoTeam && JSON.stringify(currentLogoTeam) !== JSON.stringify(seededLogoTeam)) {
    await db.teams.put(seededLogoTeam)
  }

  const legacyById = await db.stickers.get(LEGACY_LOGO_ID)
  const current = await db.stickers.get(LOGO_ID)
  const source = legacyById ?? current
  if (!source || source.teamCode === STANDALONE_LOGO_TEAM_CODE) return // already fully migrated

  await db.transaction('rw', db.stickers, async () => {
    if (legacyById) await db.stickers.delete(LEGACY_LOGO_ID)
    await db.stickers.put({ ...source, id: LOGO_ID, teamCode: STANDALONE_LOGO_TEAM_CODE })
  })
}

export async function ensureSeeded(): Promise<void> {
  const row = await db.meta.get(SEEDED_KEY)
  if (row?.value === true) {
    await migrateStandaloneLogoSticker()
    return
  }

  await db.transaction('rw', db.teams, db.stickers, db.meta, async () => {
    await db.teams.bulkPut(seedTeams)
    await db.stickers.bulkPut(seedStickers)
    await db.meta.put({ key: SEEDED_KEY, value: true })
  })

  try {
    await navigator.storage?.persist?.()
  } catch {
    // Best-effort — not all browsers support the Storage API.
  }
}
