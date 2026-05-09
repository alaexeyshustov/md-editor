import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { VaultService } from '../services/vault-service/vault-service'

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

  return { vaultUri, init, setVaultUri, pickAndSetVault }
})
