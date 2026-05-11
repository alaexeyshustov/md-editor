import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NoteMetadata, NotesMeta, VaultService } from '../../services/vault-service/vault-service'
import { configureVaultService, useVaultStore } from '../vault'

const mockGetStoredVaultUri = vi.fn<() => string | null>()
const mockSaveVaultUri = vi.fn<(uri: string) => void>()
const mockRequestVaultPermission = vi.fn<() => Promise<string | null>>()
const mockListNotes = vi.fn<(vaultUri: string) => NoteMetadata[]>()
const mockCreateNote = vi.fn<(vaultUri: string) => string>()
const mockSaveNote = vi.fn<(uri: string, content: string) => string>()
const mockReadNote = vi.fn<(uri: string) => string>()
const mockReadMeta = vi.fn<(vaultUri: string) => NotesMeta>()
const mockWriteMeta = vi.fn<(vaultUri: string, meta: NotesMeta) => void>()
const mockDeleteNote = vi.fn<(uri: string) => void>()

const mockService: VaultService = {
  getStoredVaultUri: mockGetStoredVaultUri,
  saveVaultUri: mockSaveVaultUri,
  requestVaultPermission: mockRequestVaultPermission,
  listNotes: mockListNotes,
  createNote: mockCreateNote,
  saveNote: mockSaveNote,
  readNote: mockReadNote,
  readMeta: mockReadMeta,
  writeMeta: mockWriteMeta,
  deleteNote: mockDeleteNote,
}

function makeNote(id: string, lastModified: number): NoteMetadata {
  return { id, uri: id, title: id, preview: '', lastModified }
}

describe('useVaultStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureVaultService(mockService)
    vi.clearAllMocks()
    mockReadMeta.mockReturnValue({ pinned: [] })
  })

  describe('init()', () => {
    it('sets vaultUri to null when nothing is stored', () => {
      mockGetStoredVaultUri.mockReturnValue(null)
      const store = useVaultStore()
      store.init()
      expect(store.vaultUri).toBeNull()
    })

    it('loads the stored URI', () => {
      mockGetStoredVaultUri.mockReturnValue('content://stored/uri')
      const store = useVaultStore()
      store.init()
      expect(store.vaultUri).toBe('content://stored/uri')
    })
  })

  describe('setVaultUri()', () => {
    it('updates vaultUri in the store', () => {
      const store = useVaultStore()
      store.setVaultUri('content://new/uri')
      expect(store.vaultUri).toBe('content://new/uri')
    })

    it('persists the URI via vaultService', () => {
      const store = useVaultStore()
      store.setVaultUri('content://new/uri')
      expect(mockSaveVaultUri).toHaveBeenCalledWith('content://new/uri')
    })
  })

  describe('pickAndSetVault()', () => {
    it('returns the URI and sets state when permission granted', async () => {
      mockRequestVaultPermission.mockResolvedValue('content://picked/uri')
      const store = useVaultStore()
      const result = await store.pickAndSetVault()
      expect(result).toBe('content://picked/uri')
      expect(store.vaultUri).toBe('content://picked/uri')
      expect(mockSaveVaultUri).toHaveBeenCalledWith('content://picked/uri')
    })

    it('returns null and does not mutate state when user cancels', async () => {
      mockRequestVaultPermission.mockResolvedValue(null)
      const store = useVaultStore()
      const result = await store.pickAndSetVault()
      expect(result).toBeNull()
      expect(store.vaultUri).toBeNull()
      expect(mockSaveVaultUri).not.toHaveBeenCalled()
    })
  })

  describe('sortedNotes', () => {
    it('returns notes sorted by lastModified descending', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([
        makeNote('old.md', 1000),
        makeNote('new.md', 3000),
        makeNote('mid.md', 2000),
      ])
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      expect(store.sortedNotes.map(n => n.id)).toEqual(['new.md', 'mid.md', 'old.md'])
    })
  })

  describe('loadNotes()', () => {
    it('calls listNotes with the current vaultUri', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://my-vault')
      mockListNotes.mockReturnValue([])
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      expect(mockListNotes).toHaveBeenCalledWith('content://my-vault')
    })

    it('does nothing when vaultUri is null', async () => {
      mockGetStoredVaultUri.mockReturnValue(null)
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      expect(mockListNotes).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after completion', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([])
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('loadNotes() error handling', () => {
    it('sets error when listNotes throws', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockImplementation(() => { throw new Error('Permission denied') })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      expect(store.error).toBeInstanceOf(Error)
      expect((store.error as Error).message).toBe('Permission denied')
    })

    it('clears notes when listNotes throws', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([makeNote('old.md', 1000)])
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      mockListNotes.mockImplementation(() => { throw new Error('Permission denied') })
      await store.loadNotes()
      expect(store.notes).toEqual([])
    })

    it('clears error on successful load', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockImplementation(() => { throw new Error('Permission denied') })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      mockListNotes.mockReturnValue([])
      await store.loadNotes()
      expect(store.error).toBeNull()
    })

    it('sets isLoading to false even when listNotes throws', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockImplementation(() => { throw new Error('fail') })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('createNote()', () => {
    it('calls service.createNote with the current vaultUri', () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockCreateNote.mockReturnValue('content://doc/new')
      const store = useVaultStore()
      store.init()
      store.createNote()
      expect(mockCreateNote).toHaveBeenCalledWith('content://vault')
    })

    it('returns the URI from the service', () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockCreateNote.mockReturnValue('content://doc/abc')
      const store = useVaultStore()
      store.init()
      expect(store.createNote()).toBe('content://doc/abc')
    })

    it('throws when vaultUri is null', () => {
      const store = useVaultStore()
      expect(() => store.createNote()).toThrow()
    })
  })

  describe('saveNote()', () => {
    it('calls service.saveNote and returns the (possibly new) URI', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([])
      mockSaveNote.mockReturnValue('content://doc/renamed')
      const store = useVaultStore()
      store.init()
      const result = await store.saveNote('content://doc/old', 'my content')
      expect(mockSaveNote).toHaveBeenCalledWith('content://doc/old', 'my content')
      expect(result).toBe('content://doc/renamed')
    })

    it('refreshes the notes list after saving', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockSaveNote.mockReturnValue('content://doc/same')
      mockListNotes.mockReturnValue([makeNote('content://doc/same', 2000)])
      const store = useVaultStore()
      store.init()
      await store.saveNote('content://doc/same', 'updated')
      expect(mockListNotes).toHaveBeenCalled()
      expect(store.notes).toHaveLength(1)
    })
  })

  describe('readNote()', () => {
    it('delegates to service.readNote and returns content', () => {
      mockReadNote.mockReturnValue('note content here')
      const store = useVaultStore()
      expect(store.readNote('content://doc/note')).toBe('note content here')
      expect(mockReadNote).toHaveBeenCalledWith('content://doc/note')
    })
  })

  describe('sortedNotes with pinned', () => {
    it('puts pinned notes before unpinned', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([
        makeNote('a', 3000),
        makeNote('b', 2000),
        makeNote('c', 1000),
      ])
      mockReadMeta.mockReturnValue({ pinned: ['b'] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      expect(store.sortedNotes.map(n => n.id)).toEqual(['b', 'a', 'c'])
    })

    it('sorts each group by lastModified descending', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([
        makeNote('pin-old', 1000),
        makeNote('pin-new', 4000),
        makeNote('unpin-old', 500),
        makeNote('unpin-new', 2000),
      ])
      mockReadMeta.mockReturnValue({ pinned: ['pin-old', 'pin-new'] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      expect(store.sortedNotes.map(n => n.id)).toEqual(['pin-new', 'pin-old', 'unpin-new', 'unpin-old'])
    })

    it('marks pinned notes with pinned: true', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([makeNote('a', 1000)])
      mockReadMeta.mockReturnValue({ pinned: ['a'] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      expect(store.sortedNotes[0].pinned).toBe(true)
    })
  })

  describe('pinNote()', () => {
    it('updates the note in the store to pinned: true', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([makeNote('a', 1000)])
      mockReadMeta.mockReturnValue({ pinned: [] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      await store.pinNote('a', true)
      expect(store.notes.find(n => n.id === 'a')?.pinned).toBe(true)
    })

    it('updates the note in the store to pinned: false', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([makeNote('a', 1000)])
      mockReadMeta.mockReturnValue({ pinned: ['a'] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      await store.pinNote('a', false)
      expect(store.notes.find(n => n.id === 'a')?.pinned).toBe(false)
    })

    it('persists the pin state via service.writeMeta', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([makeNote('a', 1000)])
      mockReadMeta.mockReturnValue({ pinned: [] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      await store.pinNote('a', true)
      expect(mockWriteMeta).toHaveBeenCalledWith('content://vault', { pinned: ['a'] })
    })

    it('removes from pinned when unpinning', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([makeNote('a', 1000)])
      mockReadMeta.mockReturnValue({ pinned: ['a'] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      await store.pinNote('a', false)
      expect(mockWriteMeta).toHaveBeenCalledWith('content://vault', { pinned: [] })
    })

    it('throws when vaultUri is null', async () => {
      const store = useVaultStore()
      await expect(store.pinNote('a', true)).rejects.toThrow()
    })
  })

  describe('deleteNote()', () => {
    it('calls service.deleteNote with the uri', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([makeNote('a', 1000)])
      mockReadMeta.mockReturnValue({ pinned: [] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      await store.deleteNote('a')
      expect(mockDeleteNote).toHaveBeenCalledWith('a')
    })

    it('removes the note from the store', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([makeNote('a', 1000), makeNote('b', 2000)])
      mockReadMeta.mockReturnValue({ pinned: [] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      await store.deleteNote('a')
      expect(store.notes.find(n => n.id === 'a')).toBeUndefined()
    })

    it('removes the note from pinned list if it was pinned', async () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockListNotes.mockReturnValue([makeNote('a', 1000)])
      mockReadMeta.mockReturnValue({ pinned: ['a'] })
      const store = useVaultStore()
      store.init()
      await store.loadNotes()
      await store.deleteNote('a')
      expect(mockWriteMeta).toHaveBeenCalledWith('content://vault', { pinned: [] })
    })

    it('throws when vaultUri is null', async () => {
      const store = useVaultStore()
      await expect(store.deleteNote('a')).rejects.toThrow()
    })
  })
})
