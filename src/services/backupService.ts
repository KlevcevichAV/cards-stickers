// Backup/restore, mirroring the iOS app's BackupService.swift: stickers are
// exported sparsely (only ones that aren't in their default "missing" state)
// and merge-applied on import; every other table is fully replaced.
import { db } from '@/db/database'
import type {
  Exchange,
  Purchase,
  Sale,
  AchievementRecord,
  SavedAnalysis,
  StickerStatus,
} from '@/types/models'

const BACKUP_VERSION = 1

interface StickerBackup {
  id: string
  status: StickerStatus
  duplicateCount: number
}

export interface AlbumBackup {
  version: number
  exportedAt: string
  stickers: StickerBackup[]
  exchanges: Exchange[]
  purchases: Purchase[]
  sales: Sale[]
  achievements: AchievementRecord[]
  savedAnalyses: SavedAnalysis[]
}

export async function exportBackup(): Promise<AlbumBackup> {
  const [stickers, exchanges, purchases, sales, achievements, savedAnalyses] = await Promise.all([
    db.stickers.toArray(),
    db.exchanges.toArray(),
    db.purchases.toArray(),
    db.sales.toArray(),
    db.achievementRecords.toArray(),
    db.savedAnalyses.toArray(),
  ])

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    stickers: stickers
      .filter((s) => s.status !== 'missing' || s.duplicateCount > 0)
      .map((s) => ({ id: s.id, status: s.status, duplicateCount: s.duplicateCount })),
    exchanges,
    purchases,
    sales,
    achievements,
    savedAnalyses,
  }
}

export function downloadBackup(backup: AlbumBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = backup.exportedAt.slice(0, 10)
  a.href = url
  a.download = `sticker-tracker-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseBackup(text: string): AlbumBackup {
  const data = JSON.parse(text) as Partial<AlbumBackup>
  if (!data || typeof data !== 'object' || !Array.isArray(data.stickers)) {
    throw new Error('Not a valid Sticker Tracker backup file.')
  }
  return {
    version: data.version ?? BACKUP_VERSION,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    stickers: data.stickers ?? [],
    exchanges: data.exchanges ?? [],
    purchases: data.purchases ?? [],
    sales: data.sales ?? [],
    achievements: data.achievements ?? [],
    savedAnalyses: data.savedAnalyses ?? [],
  }
}

export async function importBackup(backup: AlbumBackup): Promise<void> {
  await db.transaction(
    'rw',
    [db.stickers, db.exchanges, db.purchases, db.sales, db.achievementRecords, db.savedAnalyses],
    async () => {
      for (const b of backup.stickers) {
        await db.stickers.update(b.id, { status: b.status, duplicateCount: b.duplicateCount })
      }

      await db.exchanges.clear()
      await db.exchanges.bulkPut(backup.exchanges)

      await db.purchases.clear()
      await db.purchases.bulkPut(backup.purchases)

      await db.sales.clear()
      await db.sales.bulkPut(backup.sales)

      await db.achievementRecords.clear()
      await db.achievementRecords.bulkPut(backup.achievements)

      await db.savedAnalyses.clear()
      await db.savedAnalyses.bulkPut(backup.savedAnalyses)
    },
  )
}
