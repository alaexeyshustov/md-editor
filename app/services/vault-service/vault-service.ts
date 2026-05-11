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
  createNote(vaultUri: string, initialContent?: string): string
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
  const newNoteUris = new Map<string, string>() // documentUri → vaultUri

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

    createNote(vaultUri: string, initialContent?: string): string {
      if (!deps.writer) throw new Error('WriterAdapter not configured')
      const bytes = crypto.getRandomValues(new Uint8Array(8))
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
      const name = `${hex}.md`
      const uri = deps.writer.createDocument(vaultUri, name)
      deps.writer.writeDocument(uri, initialContent ?? '')
      newNoteUris.set(uri, vaultUri)
      return uri
    },

    saveNote(uri: string, content: string): string {
      if (!deps.writer) throw new Error('WriterAdapter not configured')
      deps.writer.writeDocument(uri, content)

      if (!newNoteUris.has(uri)) return uri

      const vaultUri = newNoteUris.get(uri)!
      newNoteUris.delete(uri)

      const firstLine = (content.split(/\r?\n/)[0] ?? '').trim()
      const slug = slugify(firstLine)
      if (!slug) return uri

      const existing = new Set(
        deps.fileSystem.listFiles(vaultUri)
          .filter(f => f.name.endsWith('.md'))
          .map(f => f.name),
      )
      let targetName = `${slug}.md`
      let counter = 2
      while (existing.has(targetName)) {
        targetName = `${slug}-${counter}.md`
        counter++
      }

      try {
        return deps.writer.renameDocument(uri, targetName)
      }
      catch (err) {
        newNoteUris.set(uri, vaultUri)
        throw err
      }
    },

    readNote(uri: string): string {
      if (!deps.reader) throw new Error('ReaderAdapter not configured')
      return deps.reader.readFile(uri)
    },
  }
}
