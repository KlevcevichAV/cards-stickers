import { defineStore } from 'pinia'
import { computed, ref, toRaw } from 'vue'
import { db } from '@/db/database'
import type { Sticker, Team } from '@/types/models'
import { useAchievementsStore } from '@/stores/achievements'
import { useExchangesStore } from '@/stores/exchanges'
import { useHaptics } from '@/composables/useHaptics'

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

  async function load() {
    if (loaded.value) return
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
    reservedCount,
    incomingCount,
  }
})
