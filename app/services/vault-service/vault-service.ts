import { generateHash } from '../../helpers/hash/hash'
import { slugify } from '../../helpers/slug/slug'
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
  uri: string
  lastModified: number
  readText(): string
}

export interface FileSystemAdapter {
  listFiles(vaultUri: string): FileEntry[]
}

export interface WriterAdapter {
  createDocument(vaultUri: string, name: string): string
  writeDocument(uri: string, content: string): void
  renameDocument(uri: string, newName: string): string
}

export interface ReaderAdapter {
  readFile(uri: string): string
}

export interface NoteMetadata {
  id: string
  uri: string
  title: string
  preview: string
  lastModified: number
}

export interface VaultService {
  getStoredVaultUri(): string | null
  saveVaultUri(uri: string): void
  requestVaultPermission(): Promise<string | null>
  listNotes(vaultUri: string): NoteMetadata[]
  createNote(vaultUri: string): string
  saveNote(uri: string, content: string): string
  readNote(uri: string): string
}

export function createVaultService(deps: {
  storage: StorageAdapter
  permission: PermissionAdapter
  fileSystem: FileSystemAdapter
  writer?: WriterAdapter
  reader?: ReaderAdapter
}): VaultService {
  const newNoteUris = new Set<string>()

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
          id: f.uri,
          uri: f.uri,
          title: f.name.replace(/\.md$/, ''),
          preview: f.readText().split(/\r?\n/).slice(0, 4).join('\n'),
          lastModified: f.lastModified,
        }))
    },

    createNote(vaultUri: string): string {
      if (!deps.writer) throw new Error('WriterAdapter not configured')
      const name = `${generateHash(Date.now().toString())}.md`
      const uri = deps.writer.createDocument(vaultUri, name)
      deps.writer.writeDocument(uri, '')
      newNoteUris.add(uri)
      return uri
    },

    saveNote(uri: string, content: string): string {
      if (!deps.writer) throw new Error('WriterAdapter not configured')
      deps.writer.writeDocument(uri, content)

      if (!newNoteUris.has(uri)) return uri

      newNoteUris.delete(uri)

      const firstLine = content.split(/\r?\n/)[0] ?? ''
      const slug = slugify(firstLine)
      if (!slug) return uri

      const newUri = deps.writer.renameDocument(uri, `${slug}.md`)
      return newUri
    },

    readNote(uri: string): string {
      if (!deps.reader) throw new Error('ReaderAdapter not configured')
      return deps.reader.readFile(uri)
    },
  }
}
