import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db/database'
import { achievements, superstarStickerIDs } from '@/data/achievements'
import type { AchievementDefinition, Sticker } from '@/types/models'
import { useAlbumStore } from '@/stores/album'

const BANNER_GAP_MS = 400

export const useAchievementsStore = defineStore('achievements', () => {
  const unlockedIds = ref<Set<string>>(new Set())
  const unlockedAt = ref<Map<string, string>>(new Map())
  const loaded = ref(false)

  const currentBanner = ref<AchievementDefinition | null>(null)
  const bannerQueue: AchievementDefinition[] = []

  async function load() {
    if (loaded.value) return
    const records = await db.achievementRecords.toArray()
    unlockedIds.value = new Set(records.map((r) => r.achievementID))
    unlockedAt.value = new Map(records.map((r) => [r.achievementID, r.unlockedAt]))
    loaded.value = true
  }

  function isUnlocked(id: string): boolean {
    return unlockedIds.value.has(id)
  }

  function unlockedDate(id: string): string | undefined {
    return unlockedAt.value.get(id)
  }

  async function unlock(def: AchievementDefinition, options?: { silent?: boolean }) {
    if (unlockedIds.value.has(def.id)) return
    unlockedIds.value.add(def.id)
    const now = new Date().toISOString()
    unlockedAt.value.set(def.id, now)
    // Show the banner immediately; persistence finishes in the background and
    // is not awaited by callers, so a late/failed write must not surface as
    // an unhandled rejection.
    if (!options?.silent) enqueueBanner(def)
    try {
      await db.achievementRecords.put({ achievementID: def.id, unlockedAt: now })
    } catch (error) {
      console.error('Failed to persist achievement unlock', def.id, error)
    }
  }

  function enqueueBanner(def: AchievementDefinition) {
    if (currentBanner.value === null) {
      currentBanner.value = def
    } else {
      bannerQueue.push(def)
    }
  }

  function dismissBanner() {
    currentBanner.value = null
    if (bannerQueue.length > 0) {
      setTimeout(() => {
        currentBanner.value = bannerQueue.shift() ?? null
      }, BANNER_GAP_MS)
    }
  }

  /**
   * Call right after a sticker is pasted or a duplicate is added.
   * Pass `{ silent: true }` for bulk operations (e.g. marking the whole
   * collection complete at once) so achievements still unlock but don't
   * flood the screen with a banner per achievement.
   */
  function checkAfterPaste(sticker: Sticker, options?: { silent?: boolean }) {
    const album = useAlbumStore()
    const allStickers = Array.from(album.stickers.values())

    // 1. Superstar easter eggs.
    for (const def of achievements) {
      if (def.trigger.kind === 'stickerPasted' && def.trigger.id === sticker.id) {
        unlock(def, options)
      }
    }

    // 2. Star Hunter — all 10 superstars pasted.
    const allStarsPasted = superstarStickerIDs.every((id) => {
      const s = album.stickers.get(id)
      return s !== undefined && s.status !== 'missing'
    })
    if (allStarsPasted) {
      const def = achievements.find((a) => a.trigger.kind === 'allStarsPasted')
      if (def) unlock(def, options)
    }

    // 3. Team completed.
    const teamStickers = allStickers.filter((s) => s.teamCode === sticker.teamCode)
    if (teamStickers.length > 0 && teamStickers.every((s) => s.status !== 'missing')) {
      const def = achievements.find((a) => a.id === `team_${sticker.teamCode.toLowerCase()}`)
      if (def) unlock(def, options)
    }

    // 4. World Ruler — every team complete.
    const allTeamsComplete = album.teams.every((team) => {
      const list = allStickers.filter((s) => s.teamCode === team.code)
      return list.length > 0 && list.every((s) => s.status !== 'missing')
    })
    if (allTeamsComplete) {
      const def = achievements.find((a) => a.trigger.kind === 'allTeamsCompleted')
      if (def) unlock(def, options)
    }

    // 5. Total pasted thresholds (first sticker, centurion, ...).
    const pastedCount = allStickers.filter((s) => s.status !== 'missing').length
    for (const def of achievements) {
      if (def.trigger.kind === 'totalPasted' && pastedCount >= def.trigger.count) {
        unlock(def, options)
      }
    }

    // 6. Album-percent milestones.
    const ratio = allStickers.length > 0 ? pastedCount / allStickers.length : 0
    for (const def of achievements) {
      if (def.category === 'milestone' && def.trigger.kind === 'albumPercent' && ratio >= def.trigger.threshold) {
        unlock(def, options)
      }
    }
  }

  /** Achievements are never revoked once unlocked — mirrors the iOS app. */
  function checkAfterRemove() {
    // Intentionally a no-op.
  }

  return {
    unlockedIds,
    loaded,
    currentBanner,
    load,
    isUnlocked,
    unlockedDate,
    checkAfterPaste,
    checkAfterRemove,
    dismissBanner,
  }
})
