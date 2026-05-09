import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { NoteMetadata, VaultService } from '../services/vault-service/vault-service'

let _service: VaultService | null = null

export function configureVaultService(service: VaultService): void {
  _service = service
}

function getService(): VaultService {
  if (!_service) throw new Error('VaultService not configured. Call configureVaultService() before using the store.')
  return _service
}

export const useVaultStore = defineStore('vault', () => {
  const vaultUri = ref<string | null>(null)
  const notes = ref<NoteMetadata[]>([])
  const isLoading = ref(false)

  const sortedNotes = computed(() =>
    [...notes.value].sort((a, b) => b.lastModified - a.lastModified),
  )

  function init() {
    vaultUri.value = getService().getStoredVaultUri()
  }

  function setVaultUri(uri: string) {
    vaultUri.value = uri
    getService().saveVaultUri(uri)
  }

  async function pickAndSetVault(): Promise<string | null> {
    const uri = await getService().requestVaultPermission()
    if (uri) setVaultUri(uri)
    return uri
  }

  async function loadNotes(): Promise<void> {
    if (!vaultUri.value) return
    isLoading.value = true
    try {
      notes.value = getService().listNotes(vaultUri.value)
    }
    finally {
      isLoading.value = false
    }
  }

  return { vaultUri, notes, isLoading, sortedNotes, init, setVaultUri, pickAndSetVault, loadNotes }
})
