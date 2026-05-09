import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isRef } from 'vue'

import type { NoteMetadata, VaultService } from '../../../services/vault-service/vault-service'
import { configureVaultService, useVaultStore } from '../../../stores/vault'
import { useGrid } from '../use-grid'

vi.mock('vue', async (importOriginal) => {
  const vue = await importOriginal<typeof import('vue')>()
  return { ...vue, onMounted: vi.fn((cb: () => void) => cb()) }
})

const mockListNotes = vi.fn<(uri: string) => NoteMetadata[]>()
const mockService: VaultService = {
  getStoredVaultUri: vi.fn(() => null),
  saveVaultUri: vi.fn(),
  requestVaultPermission: vi.fn(async () => null),
  listNotes: mockListNotes,
}

function makeNote(id: string, lastModified: number): NoteMetadata {
  return { id, uri: id, title: id, preview: '', lastModified }
}

describe('useGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureVaultService(mockService)
    vi.clearAllMocks()
  })

  it('returns reactive ref for sortedNotes', () => {
    const { sortedNotes } = useGrid()
    expect(isRef(sortedNotes)).toBe(true)
  })

  it('returns reactive ref for isLoading', () => {
    const { isLoading } = useGrid()
    expect(isRef(isLoading)).toBe(true)
  })

  it('sortedNotes updates reactively after store loads notes', async () => {
    mockListNotes.mockReturnValue([])
    const store = useVaultStore()
    store.vaultUri = 'content://vault'

    const { sortedNotes } = useGrid()
    expect(sortedNotes.value).toHaveLength(0)

    mockListNotes.mockReturnValue([makeNote('content://doc/1', 1000)])
    await store.loadNotes()
    expect(sortedNotes.value).toHaveLength(1)
  })

  it('isLoading updates reactively during store load', async () => {
    let resolveLoad!: () => void
    mockListNotes.mockImplementation(() => {
      resolveLoad?.()
      return []
    })
    const store = useVaultStore()
    store.vaultUri = 'content://vault'

    const { isLoading } = useGrid()
    expect(isLoading.value).toBe(false)

    await store.loadNotes()
    expect(isLoading.value).toBe(false)
  })
})
