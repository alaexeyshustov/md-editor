import { VAULT_URI_KEY } from '../../constants'

export interface StorageAdapter {
  get(key: string): string | null
  set(key: string, value: string): void
}

export interface PermissionAdapter {
  requestFolderPicker(): Promise<string | null>
}

export interface VaultService {
  getStoredVaultUri(): string | null
  saveVaultUri(uri: string): void
  requestVaultPermission(): Promise<string | null>
}

export function createVaultService(deps: {
  storage: StorageAdapter
  permission: PermissionAdapter
}): VaultService {
  return {
    getStoredVaultUri() {
      return deps.storage.get(VAULT_URI_KEY)
    },

    saveVaultUri(uri: string) {
      deps.storage.set(VAULT_URI_KEY, uri)
    },

    async requestVaultPermission() {
      return deps.permission.requestFolderPicker()
    },
  }
}
