import { VAULT_URI_KEY } from '../../constants'

export interface StorageAdapter {
  get(key: string): string | null
  set(key: string, value: string): void
}

export interface PermissionAdapter {
  requestFolderPicker(): Promise<string | null>
}

export interface FileEntry {
  name: string
  lastModified: number
  readText(): string
}

export interface FileSystemAdapter {
  listFiles(vaultUri: string): FileEntry[]
}

export interface NoteMetadata {
  id: string
  title: string
  preview: string
  lastModified: number
}

export interface VaultService {
  getStoredVaultUri(): string | null
  saveVaultUri(uri: string): void
  requestVaultPermission(): Promise<string | null>
  listNotes(vaultUri: string): NoteMetadata[]
}

export function createVaultService(deps: {
  storage: StorageAdapter
  permission: PermissionAdapter
  fileSystem: FileSystemAdapter
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

    listNotes(vaultUri: string): NoteMetadata[] {
      return deps.fileSystem.listFiles(vaultUri)
        .filter(f => f.name.endsWith('.md'))
        .map(f => ({
          id: f.name,
          title: f.name.replace(/\.md$/, ''),
          preview: f.readText().split('\n').slice(0, 4).join('\n'),
          lastModified: f.lastModified,
        }))
    },
  }
}
