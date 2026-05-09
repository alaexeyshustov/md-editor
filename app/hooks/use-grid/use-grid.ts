import { onMounted } from 'vue'

import { useVaultStore } from '../../stores/vault'

export function useGrid() {
  const vaultStore = useVaultStore()

  onMounted(() => {
    vaultStore.loadNotes()
  })

  return {
    sortedNotes: vaultStore.sortedNotes,
    isLoading: vaultStore.isLoading,
  }
}
