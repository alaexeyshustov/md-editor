import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NoteMetadata, VaultService } from '../../services/vault-service/vault-service'
import { configureVaultService, useVaultStore } from '../vault'

const mockGetStoredVaultUri = vi.fn<() => string | null>()
const mockSaveVaultUri = vi.fn<(uri: string) => void>()
const mockRequestVaultPermission = vi.fn<() => Promise<string | null>>()
const mockListNotes = vi.fn<(vaultUri: string) => NoteMetadata[]>()
const mockCreateNote = vi.fn<(vaultUri: string, initialContent?: string) => string>()
const mockSaveNote = vi.fn<(uri: string, content: string) => string>()
const mockReadNote = vi.fn<(uri: string) => string>()

const mockService: VaultService = {
  getStoredVaultUri: mockGetStoredVaultUri,
  saveVaultUri: mockSaveVaultUri,
  requestVaultPermission: mockRequestVaultPermission,
  listNotes: mockListNotes,
  createNote: mockCreateNote,
  saveNote: mockSaveNote,
  readNote: mockReadNote,
}

function makeNote(id: string, lastModified: number): NoteMetadata {
  return { id, uri: id, title: id, preview: '', lastModified }
}

describe('useVaultStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureVaultService(mockService)
    vi.clearAllMocks()
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
      expect(mockCreateNote).toHaveBeenCalledWith('content://vault', undefined)
    })

    it('passes initialContent to service.createNote when provided', () => {
      mockGetStoredVaultUri.mockReturnValue('content://vault')
      mockCreateNote.mockReturnValue('content://doc/new')
      const store = useVaultStore()
      store.init()
      store.createNote('hello world')
      expect(mockCreateNote).toHaveBeenCalledWith('content://vault', 'hello world')
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
})
