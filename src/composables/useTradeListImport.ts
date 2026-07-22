import { computed, ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import { useAlbumStore } from '@/stores/album'
import { parseTradeMessage } from '@/services/tradeMessageParser'

export interface UseTradeListImportOptions {
  /**
   * When false, anything parsed as "need" is ignored and only "have" (spares) is
   * applied — for the "I already own the whole album, just note my duplicates"
   * onboarding path, where the album should end up with zero missing regardless
   * of what the pasted text lists under a "need" section.
   */
  applyNeed?: boolean
}

export function useTradeListImport(t: ComposerTranslation, options: UseTradeListImportOptions = {}) {
  const applyNeed = options.applyNeed ?? true
  const album = useAlbumStore()

  const text = ref('')
  const status = ref<'idle' | 'success'>('idle')
  const result = ref({ missing: 0, duplicates: 0, pasted: 0 })

  const parsed = computed(() => parseTradeMessage(text.value))
  const canApply = computed(() => (applyNeed ? parsed.value.need.length : 0) + parsed.value.have.length > 0)

  async function submit(): Promise<boolean> {
    const need = applyNeed ? parsed.value.need : []
    const confirmed = window.confirm(t('settings.importCollectionConfirm', { need: need.length, have: parsed.value.have.length }))
    if (!confirmed) return false

    result.value = await album.setCollectionFromLists(need, parsed.value.have)
    status.value = 'success'
    text.value = ''
    setTimeout(() => (status.value = 'idle'), 5000)
    return true
  }

  return { text, status, result, parsed, canApply, submit }
}
