import { ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import { useAlbumStore } from '@/stores/album'
import { fetchLastStickerCollection } from '@/services/lastStickerImport'

export interface UseLastStickerImportOptions {
  /**
   * When false, the profile's "need" list is ignored and only its "have" (spares)
   * list is applied — for the "I already own the whole album, just note my
   * duplicates" onboarding path, where the album should end up with zero missing
   * regardless of what the profile itself lists as needed.
   */
  applyNeed?: boolean
}

export function useLastStickerImport(t: ComposerTranslation, options: UseLastStickerImportOptions = {}) {
  const applyNeed = options.applyNeed ?? true
  const album = useAlbumStore()

  const url = ref('')
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const result = ref({ missing: 0, duplicates: 0, pasted: 0 })

  async function submit(): Promise<boolean> {
    status.value = 'loading'
    let entries: Awaited<ReturnType<typeof fetchLastStickerCollection>>
    try {
      entries = await fetchLastStickerCollection(url.value)
    } catch {
      // Whatever went wrong — bad link, no matching collection, the reader proxy being
      // unreachable — the manual list paste (useTradeListImport) still works as a fallback.
      status.value = 'error'
      return false
    }

    const need = applyNeed ? entries.need : []
    const confirmed = window.confirm(t('settings.lastStickerConfirm', { need: need.length, have: entries.have.length }))
    if (!confirmed) {
      status.value = 'idle'
      return false
    }

    result.value = await album.setCollectionFromLists(need, entries.have)
    status.value = 'success'
    setTimeout(() => (status.value = 'idle'), 5000)
    return true
  }

  return { url, status, result, submit }
}
