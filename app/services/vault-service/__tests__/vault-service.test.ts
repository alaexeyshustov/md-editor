import { describe, expect, it } from 'vitest'

import type { FileSystemAdapter } from '../vault-service'
import { createVaultService } from '../vault-service'

function makeStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    get: (key: string) => store.get(key) ?? null,
    set: (key: string, value: string) => { store.set(key, value) },
  }
}

const neverPicker = { requestFolderPicker: async () => null as string | null }

function makeFS(files: Array<{ name: string; lastModified: number; content: string }>): FileSystemAdapter {
  return {
    listFiles: () => files.map(f => ({
      name: f.name,
      lastModified: f.lastModified,
      readText: () => f.content,
    })),
  }
}

describe('VaultService.getStoredVaultUri', () => {
  it('returns null when nothing is stored', () => {
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]) })
    expect(service.getStoredVaultUri()).toBeNull()
  })
})

describe('VaultService.saveVaultUri', () => {
  it('persists the URI so getStoredVaultUri returns it', () => {
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]) })
    service.saveVaultUri('content://com.example/vault')
    expect(service.getStoredVaultUri()).toBe('content://com.example/vault')
  })
})

describe('VaultService.requestVaultPermission', () => {
  it('returns the URI returned by the permission adapter', async () => {
    const picker = { requestFolderPicker: async () => 'content://picked/uri' as string | null }
    const service = createVaultService({ storage: makeStorage(), permission: picker, fileSystem: makeFS([]) })
    expect(await service.requestVaultPermission()).toBe('content://picked/uri')
  })

  it('returns null when the user cancels', async () => {
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]) })
    expect(await service.requestVaultPermission()).toBeNull()
  })
})

describe('VaultService.listNotes', () => {
  it('returns empty array when vault has no files', () => {
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]) })
    expect(service.listNotes('content://vault')).toEqual([])
  })

  it('returns only .md files', () => {
    const service = createVaultService({
      storage: makeStorage(),
      permission: neverPicker,
      fileSystem: makeFS([
        { name: 'note.md', lastModified: 1000, content: 'hello' },
        { name: 'image.png', lastModified: 2000, content: '' },
        { name: 'README.txt', lastModified: 3000, content: 'text' },
      ]),
    })
    const notes = service.listNotes('content://vault')
    expect(notes).toHaveLength(1)
    expect(notes[0].id).toBe('note.md')
  })

  it('extracts title as filename without .md extension', () => {
    const service = createVaultService({
      storage: makeStorage(),
      permission: neverPicker,
      fileSystem: makeFS([{ name: 'My Note.md', lastModified: 1000, content: '' }]),
    })
    expect(service.listNotes('content://vault')[0].title).toBe('My Note')
  })

  it('extracts preview as first 4 lines of content', () => {
    const content = 'line1\nline2\nline3\nline4\nline5\nline6'
    const service = createVaultService({
      storage: makeStorage(),
      permission: neverPicker,
      fileSystem: makeFS([{ name: 'note.md', lastModified: 1000, content }]),
    })
    expect(service.listNotes('content://vault')[0].preview).toBe('line1\nline2\nline3\nline4')
  })

  it('passes the vaultUri to the file system adapter', () => {
    let capturedUri = ''
    const fs: FileSystemAdapter = {
      listFiles(uri) {
        capturedUri = uri
        return []
      },
    }
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: fs })
    service.listNotes('content://my-vault')
    expect(capturedUri).toBe('content://my-vault')
  })
})
