import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NoteMetadata, VaultService } from '../../services/vault-service/vault-service'
import { configureVaultService, useVaultStore } from '../vault'

const mockGetStoredVaultUri = vi.fn<() => string | null>()
const mockSaveVaultUri = vi.fn<(uri: string) => void>()
const mockRequestVaultPermission = vi.fn<() => Promise<string | null>>()
const mockListNotes = vi.fn<(vaultUri: string) => NoteMetadata[]>()

const mockService: VaultService = {
  getStoredVaultUri: mockGetStoredVaultUri,
  saveVaultUri: mockSaveVaultUri,
  requestVaultPermission: mockRequestVaultPermission,
  listNotes: mockListNotes,
}

function makeNote(id: string, lastModified: number): NoteMetadata {
  return { id, title: id, preview: '', lastModified }
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
})
