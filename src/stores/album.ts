import { defineStore } from 'pinia'
import { computed, ref, toRaw } from 'vue'
import { db } from '@/db/database'
import type { Sticker, StickerEntry, Team } from '@/types/models'
import { useAchievementsStore } from '@/stores/achievements'
import { superstarStickerIDs } from '@/data/achievements'
import { useExchangesStore } from '@/stores/exchanges'
import { useHaptics } from '@/composables/useHaptics'
import { stickerIdForEntry } from '@/services/stickerId'

export interface GroupStat {
  letter: string
  pasted: number
  total: number
  teams: TeamStat[]
}

export interface TeamStat {
  code: string
  nameEN: string
  nameRU: string
  flagEmoji: string
  groupLetter: string
  orderIndex: number
  pasted: number
  total: number
  duplicates: number
}

/** Fixed group display order: the standalone "00" page first, then FWC, then A–L. */
const GROUP_ORDER = ['00', 'FWC', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export const useAlbumStore = defineStore('album', () => {
  const teams = ref<Team[]>([])
  const stickers = ref<Map<string, Sticker>>(new Map())
  const loaded = ref(false)

  /** Sticker id that should play the "paste" snap animation right now, if any. */
  const justPastedId = ref<string | null>(null)

  /** Pass `force: true` to re-read from Dexie even if already loaded — e.g. after a backup import. */
  async function load(force = false) {
    if (loaded.value && !force) return
    const [teamRows, stickerRows] = await Promise.all([
      db.teams.orderBy('orderIndex').toArray(),
      db.stickers.toArray(),
    ])
    teams.value = teamRows
    stickers.value = new Map(stickerRows.map((s) => [s.id, s]))
    loaded.value = true
  }

  const teamsByCode = computed(() => new Map(teams.value.map((t) => [t.code, t])))

  const stickersByTeam = computed(() => {
    const map = new Map<string, Sticker[]>()
    for (const sticker of stickers.value.values()) {
      const list = map.get(sticker.teamCode) ?? []
      list.push(sticker)
      map.set(sticker.teamCode, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.number - b.number)
    return map
  })

  interface AlbumPage {
    team: Team
    stickers: Sticker[]
  }

  const pages = computed<AlbumPage[]>(() =>
    teams.value.map((team) => ({ team, stickers: stickersByTeam.value.get(team.code) ?? [] })),
  )

  const pageIndexByCode = computed(() => {
    const map = new Map<string, number>()
    pages.value.forEach((page, i) => map.set(page.team.code, i))
    return map
  })

  const totalPasted = computed(
    () => Array.from(stickers.value.values()).filter((s) => s.status !== 'missing').length,
  )
  const totalStickers = computed(() => stickers.value.size)
  const totalDuplicates = computed(() =>
    Array.from(stickers.value.values())
      .filter((s) => s.status === 'duplicate')
      .reduce((sum, s) => sum + s.duplicateCount, 0),
  )
  const albumPercent = computed(() =>
    totalStickers.value > 0 ? totalPasted.value / totalStickers.value : 0,
  )

  function statFor(list: Sticker[]) {
    return {
      pasted: list.filter((s) => s.status !== 'missing').length,
      total: list.length,
      duplicates: list
        .filter((s) => s.status === 'duplicate')
        .reduce((sum, s) => sum + s.duplicateCount, 0),
    }
  }

  const teamStats = computed<TeamStat[]>(() =>
    teams.value.map((team) => {
      const list = stickersByTeam.value.get(team.code) ?? []
      const stat = statFor(list)
      return {
        code: team.code,
        nameEN: team.nameEN,
        nameRU: team.nameRU,
        flagEmoji: team.flagEmoji,
        groupLetter: team.groupLetter,
        orderIndex: team.orderIndex,
        ...stat,
      }
    }),
  )

  const groupStats = computed<GroupStat[]>(() => {
    const byLetter = new Map<string, TeamStat[]>()
    for (const stat of teamStats.value) {
      const list = byLetter.get(stat.groupLetter) ?? []
      list.push(stat)
      byLetter.set(stat.groupLetter, list)
    }
    return GROUP_ORDER.filter((letter) => byLetter.has(letter)).map((letter) => {
      const teamsInGroup = byLetter.get(letter)!
      return {
        letter,
        pasted: teamsInGroup.reduce((sum, t) => sum + t.pasted, 0),
        total: teamsInGroup.reduce((sum, t) => sum + t.total, 0),
        teams: teamsInGroup,
      }
    })
  })

  function teamStat(code: string): TeamStat | undefined {
    return teamStats.value.find((t) => t.code === code)
  }

  async function persist(sticker: Sticker) {
    await db.stickers.put(toRaw(sticker))
  }

  const { impact } = useHaptics()

  async function paste(stickerId: string) {
    const sticker = stickers.value.get(stickerId)
    if (!sticker) return
    sticker.status = 'pasted'
    sticker.duplicateCount = 0
    await persist(sticker)
    impact('medium')
    justPastedId.value = stickerId
    useAchievementsStore().checkAfterPaste(sticker)
  }

  async function remove(stickerId: string) {
    const sticker = stickers.value.get(stickerId)
    if (!sticker) return
    sticker.status = 'missing'
    sticker.duplicateCount = 0
    await persist(sticker)
    impact('light')
    useAchievementsStore().checkAfterRemove()
  }

  async function addDuplicate(stickerId: string) {
    const sticker = stickers.value.get(stickerId)
    if (!sticker) return
    sticker.duplicateCount += 1
    sticker.status = 'duplicate'
    await persist(sticker)
    impact('rigid')
    useAchievementsStore().checkAfterPaste(sticker)
  }

  /**
   * For collectors who already own every sticker but are just starting to use
   * the app: marks every not-yet-owned sticker as pasted in one shot, so they
   * don't have to tap through hundreds of stickers by hand. Once nothing is
   * "missing" anymore, the normal increment logic (see StickerCell/exchanges)
   * naturally routes every further addition into duplicates, since it only
   * pastes into the album when a sticker's current status is "missing".
   * Returns how many stickers were updated.
   */
  async function markAllCollected(): Promise<number> {
    const missing = Array.from(stickers.value.values()).filter((s) => s.status === 'missing')
    if (missing.length === 0) return 0
    for (const sticker of missing) {
      sticker.status = 'pasted'
      sticker.duplicateCount = 0
    }
    await db.stickers.bulkPut(missing.map((s) => toRaw(s)))

    // checkAfterPaste() re-scans the whole album for the global checks (World
    // Ruler, Star Hunter, milestones), so one representative sticker per
    // affected team is enough to catch those plus that team's completion —
    // no need to run the full scan once per sticker. The per-sticker superstar
    // easter eggs need their own pass since they match on the exact id.
    // Achievements still unlock (and remain visible in the Achievements tab)
    // but are marked `silent` so this one bulk action doesn't queue up a
    // banner for every single one.
    const achievements = useAchievementsStore()
    const seenTeams = new Set<string>()
    for (const sticker of missing) {
      if (seenTeams.has(sticker.teamCode)) continue
      seenTeams.add(sticker.teamCode)
      achievements.checkAfterPaste(sticker, { silent: true })
    }
    for (const sticker of missing) {
      if (superstarStickerIDs.includes(sticker.id)) achievements.checkAfterPaste(sticker, { silent: true })
    }
    return missing.length
  }

  /**
   * Bulk-populates the whole album from a "need"/"have" pair parsed out of a trade message
   * (see Settings' "populate from message" and tradeMessageParser): anything in `need` is
   * missing, anything in `have` becomes a duplicate with that many extra copies, and
   * everything else not mentioned is treated as already pasted — a collector who lists what
   * they're missing (and what's spare) implicitly means "I already own everything else".
   * This replaces the *entire* album's state, not just the mentioned stickers.
   */
  async function setCollectionFromLists(
    need: StickerEntry[],
    have: StickerEntry[],
  ): Promise<{ missing: number; duplicates: number; pasted: number }> {
    const needIds = new Set(need.map((e) => stickerIdForEntry(e)))
    const haveCounts = new Map<string, number>()
    for (const entry of have) {
      const id = stickerIdForEntry(entry)
      haveCounts.set(id, (haveCounts.get(id) ?? 0) + entry.count)
    }

    const changed: Sticker[] = []
    const newlyOwned: Sticker[] = []
    let missing = 0
    let duplicates = 0
    let pasted = 0

    for (const sticker of stickers.value.values()) {
      const wasMissing = sticker.status === 'missing'
      let nextStatus: Sticker['status']
      let nextDuplicateCount = 0

      if (needIds.has(sticker.id)) {
        nextStatus = 'missing'
        missing++
      } else if (haveCounts.has(sticker.id)) {
        nextStatus = 'duplicate'
        nextDuplicateCount = haveCounts.get(sticker.id)!
        duplicates++
      } else {
        nextStatus = 'pasted'
        pasted++
      }

      if (sticker.status !== nextStatus || sticker.duplicateCount !== nextDuplicateCount) {
        sticker.status = nextStatus
        sticker.duplicateCount = nextDuplicateCount
        changed.push(sticker)
        if (wasMissing && nextStatus !== 'missing') newlyOwned.push(sticker)
      }
    }

    if (changed.length > 0) {
      await db.stickers.bulkPut(changed.map((s) => toRaw(s)))
    }

    // Same silent-achievement-check approach as markAllCollected — one representative
    // sticker per newly-completed team (plus the global checks it triggers), and a
    // dedicated pass for the per-sticker superstar easter eggs.
    const achievements = useAchievementsStore()
    const seenTeams = new Set<string>()
    for (const sticker of newlyOwned) {
      if (seenTeams.has(sticker.teamCode)) continue
      seenTeams.add(sticker.teamCode)
      achievements.checkAfterPaste(sticker, { silent: true })
    }
    for (const sticker of newlyOwned) {
      if (superstarStickerIDs.includes(sticker.id)) achievements.checkAfterPaste(sticker, { silent: true })
    }

    return { missing, duplicates, pasted }
  }

  async function removeDuplicate(stickerId: string) {
    const sticker = stickers.value.get(stickerId)
    if (!sticker) return
    if (sticker.duplicateCount > 1) {
      sticker.duplicateCount -= 1
    } else {
      sticker.duplicateCount = 0
      sticker.status = 'pasted'
    }
    await persist(sticker)
    impact('light')
  }

  function reservedCount(stickerId: string): number {
    return useExchangesStore().reservedCount(stickerId)
  }

  function incomingCount(stickerId: string): number {
    return useExchangesStore().incomingCount(stickerId)
  }

  return {
    teams,
    stickers,
    loaded,
    justPastedId,
    load,
    teamsByCode,
    stickersByTeam,
    pages,
    pageIndexByCode,
    totalPasted,
    totalStickers,
    totalDuplicates,
    albumPercent,
    teamStats,
    groupStats,
    teamStat,
    paste,
    remove,
    addDuplicate,
    removeDuplicate,
    markAllCollected,
    setCollectionFromLists,
    reservedCount,
    incomingCount,
  }
})
