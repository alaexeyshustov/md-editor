import { describe, expect, it, vi } from 'vitest'

import type { FileSystemAdapter, ReaderAdapter, WriterAdapter } from '../vault-service'
import { createVaultService } from '../vault-service'

function makeStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    get: (key: string) => store.get(key) ?? null,
    set: (key: string, value: string) => { store.set(key, value) },
  }
}

const neverPicker = { requestFolderPicker: async () => null as string | null }

function makeFS(files: Array<{ name: string; lastModified: number; content: string; uri?: string }>): FileSystemAdapter {
  return {
    listFiles: () => files.map(f => ({
      name: f.name,
      uri: f.uri ?? `content://doc/${f.name}`,
      lastModified: f.lastModified,
      readText: () => f.content,
    })),
  }
}

function makeWriter(overrides: Partial<WriterAdapter> = {}): WriterAdapter {
  return {
    createDocument: vi.fn(() => 'content://doc/new'),
    writeDocument: vi.fn(),
    renameDocument: vi.fn((uri: string) => `${uri}-renamed`),
    deleteDocument: vi.fn(),
    ...overrides,
  }
}

function makeReader(overrides: Partial<ReaderAdapter> = {}): ReaderAdapter {
  return {
    readFile: vi.fn(() => ''),
    ...overrides,
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
        { name: 'note.md', lastModified: 1000, content: 'hello', uri: 'content://doc/note.md' },
        { name: 'image.png', lastModified: 2000, content: '' },
        { name: 'README.txt', lastModified: 3000, content: 'text' },
      ]),
    })
    const notes = service.listNotes('content://vault')
    expect(notes).toHaveLength(1)
    expect(notes[0].id).toBe('content://doc/note.md')
  })

  it('uses file uri as note id', () => {
    const service = createVaultService({
      storage: makeStorage(),
      permission: neverPicker,
      fileSystem: makeFS([{ name: 'note.md', lastModified: 1000, content: '', uri: 'content://doc/abc123' }]),
    })
    expect(service.listNotes('content://vault')[0].id).toBe('content://doc/abc123')
  })

  it('includes uri in NoteMetadata', () => {
    const service = createVaultService({
      storage: makeStorage(),
      permission: neverPicker,
      fileSystem: makeFS([{ name: 'note.md', lastModified: 1000, content: '', uri: 'content://doc/abc123' }]),
    })
    expect(service.listNotes('content://vault')[0].uri).toBe('content://doc/abc123')
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

  it('handles CRLF line endings in preview', () => {
    const content = 'line1\r\nline2\r\nline3\r\nline4\r\nline5'
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
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: fs, writer: makeWriter() })
    service.listNotes('content://my-vault')
    expect(capturedUri).toBe('content://my-vault')
  })
})

describe('VaultService.createNote', () => {
  it('calls createDocument with vaultUri and a 16-char hex .md filename', () => {
    const writer = makeWriter()
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    service.createNote('content://vault')
    expect(writer.createDocument).toHaveBeenCalledWith('content://vault', expect.stringMatching(/^[0-9a-f]{16}\.md$/))
  })

  it('writes empty content to the new file', () => {
    const writer = makeWriter({ createDocument: vi.fn(() => 'content://doc/abc') })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    service.createNote('content://vault')
    expect(writer.writeDocument).toHaveBeenCalledWith('content://doc/abc', '')
  })

  it('returns the URI of the newly created document', () => {
    const writer = makeWriter({ createDocument: vi.fn(() => 'content://doc/new-note') })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    expect(service.createNote('content://vault')).toBe('content://doc/new-note')
  })
})

describe('VaultService.saveNote', () => {
  it('writes content to the file', () => {
    const writer = makeWriter()
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    service.saveNote('content://doc/xyz', 'hello world')
    expect(writer.writeDocument).toHaveBeenCalledWith('content://doc/xyz', 'hello world')
  })

  it('returns same URI when called on a note not created in this session', () => {
    const writer = makeWriter()
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    const result = service.saveNote('content://doc/xyz', 'hello')
    expect(result).toBe('content://doc/xyz')
    expect(writer.renameDocument).not.toHaveBeenCalled()
  })

  it('renames on first save when first line is non-empty', () => {
    const writer = makeWriter({ createDocument: vi.fn(() => 'content://doc/hash123') })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    const uri = service.createNote('content://vault')
    const newUri = service.saveNote(uri, 'My Great Note\nrest of content')
    expect(writer.renameDocument).toHaveBeenCalledWith('content://doc/hash123', 'my-great-note.md')
    expect(newUri).toBe('content://doc/hash123-renamed')
  })

  it('keeps hash name on first save when first line is blank', () => {
    const writer = makeWriter({ createDocument: vi.fn(() => 'content://doc/hash123') })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    const uri = service.createNote('content://vault')
    const newUri = service.saveNote(uri, '')
    expect(writer.renameDocument).not.toHaveBeenCalled()
    expect(newUri).toBe('content://doc/hash123')
  })

  it('keeps hash name on first save when first line is whitespace-only', () => {
    const writer = makeWriter({ createDocument: vi.fn(() => 'content://doc/hash123') })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    const uri = service.createNote('content://vault')
    const newUri = service.saveNote(uri, '   \nsome content')
    expect(writer.renameDocument).not.toHaveBeenCalled()
    expect(newUri).toBe('content://doc/hash123')
  })

  it('does not rename on second save even when first line is non-empty', () => {
    const writer = makeWriter({ createDocument: vi.fn(() => 'content://doc/hash123'), renameDocument: vi.fn(() => 'content://doc/renamed') })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    const uri = service.createNote('content://vault')
    const afterFirst = service.saveNote(uri, 'My Note')
    const afterSecond = service.saveNote(afterFirst, 'My Note updated')
    expect(writer.renameDocument).toHaveBeenCalledTimes(1)
    expect(afterSecond).toBe('content://doc/renamed')
  })
})

describe('VaultService.saveNote - slug collision', () => {
  it('appends -2 when slug name already exists in the vault', () => {
    const writer = makeWriter({
      createDocument: vi.fn(() => 'content://doc/hash123'),
      renameDocument: vi.fn((_uri: string, name: string) => `content://doc/${name}`),
    })
    const fs = makeFS([{ name: 'my-note.md', lastModified: 1000, content: '', uri: 'content://doc/my-note.md' }])
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: fs, writer })
    const uri = service.createNote('content://vault')
    service.saveNote(uri, 'My Note')
    expect(writer.renameDocument).toHaveBeenCalledWith('content://doc/hash123', 'my-note-2.md')
  })

  it('increments counter until finding a unique name', () => {
    const writer = makeWriter({
      createDocument: vi.fn(() => 'content://doc/hash123'),
      renameDocument: vi.fn((_uri: string, name: string) => `content://doc/${name}`),
    })
    const fs = makeFS([
      { name: 'my-note.md', lastModified: 1000, content: '', uri: 'content://doc/my-note.md' },
      { name: 'my-note-2.md', lastModified: 1001, content: '', uri: 'content://doc/my-note-2.md' },
    ])
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: fs, writer })
    const uri = service.createNote('content://vault')
    service.saveNote(uri, 'My Note')
    expect(writer.renameDocument).toHaveBeenCalledWith('content://doc/hash123', 'my-note-3.md')
  })
})

describe('VaultService.saveNote - rename failure recovery', () => {
  it('re-tracks URI as new when rename fails so a subsequent save retries the rename', () => {
    let shouldFail = true
    const renameDocument = vi.fn((_uri: string, name: string) => {
      if (shouldFail) throw new Error('Transient error')
      return `content://doc/${name}`
    })
    const writer = makeWriter({ createDocument: vi.fn(() => 'content://doc/hash123'), renameDocument })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    const uri = service.createNote('content://vault')

    expect(() => service.saveNote(uri, 'My Note')).toThrow('Transient error')

    shouldFail = false
    const newUri = service.saveNote(uri, 'My Note')
    expect(writer.renameDocument).toHaveBeenCalledTimes(2)
    expect(newUri).toBe('content://doc/my-note.md')
  })
})

describe('VaultService.readNote', () => {
  it('returns file content from the reader adapter', () => {
    const reader = makeReader({ readFile: vi.fn(() => 'hello world') })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), reader })
    expect(service.readNote('content://doc/note')).toBe('hello world')
  })

  it('passes the URI to the reader adapter', () => {
    const readFile = vi.fn(() => '')
    const reader = makeReader({ readFile })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), reader })
    service.readNote('content://doc/abc')
    expect(readFile).toHaveBeenCalledWith('content://doc/abc')
  })
})

function makeMetaAdapter(overrides: Partial<import('../vault-service').MetaAdapter> = {}): import('../vault-service').MetaAdapter {
  return {
    readMeta: vi.fn(() => null),
    writeMeta: vi.fn(),
    ...overrides,
  }
}

describe('VaultService.readMeta', () => {
  it('returns empty pinned array when meta adapter returns null', () => {
    const meta = makeMetaAdapter({ readMeta: vi.fn(() => null) })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), meta })
    expect(service.readMeta('content://vault')).toEqual({ pinned: [] })
  })

  it('returns parsed pinned array from JSON', () => {
    const meta = makeMetaAdapter({ readMeta: vi.fn(() => JSON.stringify({ pinned: ['content://a', 'content://b'] })) })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), meta })
    expect(service.readMeta('content://vault')).toEqual({ pinned: ['content://a', 'content://b'] })
  })

  it('returns empty pinned array when JSON is malformed', () => {
    const meta = makeMetaAdapter({ readMeta: vi.fn(() => 'not-json') })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), meta })
    expect(service.readMeta('content://vault')).toEqual({ pinned: [] })
  })

  it('passes vaultUri to the meta adapter', () => {
    const readMeta = vi.fn(() => null)
    const meta = makeMetaAdapter({ readMeta })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), meta })
    service.readMeta('content://my-vault')
    expect(readMeta).toHaveBeenCalledWith('content://my-vault')
  })
})

describe('VaultService.writeMeta', () => {
  it('serializes meta and writes via the adapter', () => {
    const writeMeta = vi.fn()
    const meta = makeMetaAdapter({ writeMeta })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), meta })
    service.writeMeta('content://vault', { pinned: ['content://a'] })
    expect(writeMeta).toHaveBeenCalledWith('content://vault', JSON.stringify({ pinned: ['content://a'] }))
  })

  it('passes vaultUri to the meta adapter', () => {
    const writeMeta = vi.fn()
    const meta = makeMetaAdapter({ writeMeta })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), meta })
    service.writeMeta('content://my-vault', { pinned: [] })
    expect(writeMeta).toHaveBeenCalledWith('content://my-vault', expect.any(String))
  })
})

describe('VaultService.deleteNote', () => {
  it('calls writer.deleteDocument with the note uri', () => {
    const deleteDocument = vi.fn()
    const writer = makeWriter({ deleteDocument })
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]), writer })
    service.deleteNote('content://doc/note')
    expect(deleteDocument).toHaveBeenCalledWith('content://doc/note')
  })

  it('throws when WriterAdapter not configured', () => {
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker, fileSystem: makeFS([]) })
    expect(() => service.deleteNote('content://doc/note')).toThrow('WriterAdapter not configured')
  })
})
