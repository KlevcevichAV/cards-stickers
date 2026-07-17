import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db/database'
import type { SavedAnalysis } from '@/types/models'

export const useSavedAnalysesStore = defineStore('savedAnalyses', () => {
  const analyses = ref<SavedAnalysis[]>([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    analyses.value = (await db.savedAnalyses.toArray()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    loaded.value = true
  }

  /** No-op if the exact same message text was already saved. */
  async function save(messageText: string, note = ''): Promise<SavedAnalysis | null> {
    if (analyses.value.some((a) => a.messageText === messageText)) return null
    const record: SavedAnalysis = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      messageText,
      note,
    }
    await db.savedAnalyses.add(record)
    analyses.value.unshift(record)
    return record
  }

  async function remove(id: string) {
    await db.savedAnalyses.delete(id)
    analyses.value = analyses.value.filter((a) => a.id !== id)
  }

  return { analyses, loaded, load, save, remove }
})
