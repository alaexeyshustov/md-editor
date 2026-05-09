import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useVaultStore } from '../../stores/vault'

export function useGrid() {
  const vaultStore = useVaultStore()
  const { sortedNotes, isLoading } = storeToRefs(vaultStore)

  onMounted(() => {
    void vaultStore.loadNotes()
  })

  return { sortedNotes, isLoading }
}
