import { defineStore } from 'pinia'
import { ref } from 'vue'

import { vaultService } from '../services/vault-service/android-adapters'

export const useVaultStore = defineStore('vault', () => {
  const vaultUri = ref<string | null>(null)

  function init() {
    vaultUri.value = vaultService.getStoredVaultUri()
  }

  function setVaultUri(uri: string) {
    vaultUri.value = uri
    vaultService.saveVaultUri(uri)
  }

  return { vaultUri, init, setVaultUri }
})
