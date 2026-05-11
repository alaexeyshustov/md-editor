import { ref } from 'vue'

import { useClipboardService } from '../../services/clipboard-service/clipboard-service'
import { useVaultStore } from '../../stores/vault'

export type PasteNoteResult = { isEmpty: true } | { isEmpty: false; uri: string }

export function useFab() {
  const isExpanded = ref(false)

  function toggle() {
    isExpanded.value = !isExpanded.value
  }

  function collapse() {
    isExpanded.value = false
  }

  function pasteNote(): PasteNoteResult {
    collapse()
    const text = useClipboardService().getText()
    if (!text) return { isEmpty: true }
    const vaultStore = useVaultStore()
    const uri = vaultStore.createNote(text)
    return { isEmpty: false, uri }
  }

  return { isExpanded, toggle, collapse, pasteNote }
}
