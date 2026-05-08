import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetStoredVaultUri = vi.fn<() => string | null>()
const mockSaveVaultUri = vi.fn<(uri: string) => void>()
const mockRequestVaultPermission = vi.fn<() => Promise<string | null>>()

vi.mock('../../services/vault-service/android-adapters', () => ({
  vaultService: {
    getStoredVaultUri: mockGetStoredVaultUri,
    saveVaultUri: mockSaveVaultUri,
    requestVaultPermission: mockRequestVaultPermission,
  },
}))

const { useVaultStore } = await import('../vault')

describe('useVaultStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
      mockGetStoredVaultUri.mockReturnValue(null)
      const store = useVaultStore()
      store.setVaultUri('content://new/uri')
      expect(store.vaultUri).toBe('content://new/uri')
    })

    it('persists the URI via vaultService', () => {
      mockGetStoredVaultUri.mockReturnValue(null)
      const store = useVaultStore()
      store.setVaultUri('content://new/uri')
      expect(mockSaveVaultUri).toHaveBeenCalledWith('content://new/uri')
    })
  })
})
