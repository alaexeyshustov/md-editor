import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClipboardService } from '../../../services/clipboard-service/clipboard-service'
import { configureClipboardService } from '../../../services/clipboard-service/clipboard-service'
import type { NoteMetadata, VaultService } from '../../../services/vault-service/vault-service'
import { configureVaultService, useVaultStore } from '../../../stores/vault'
import { useFab } from '../use-fab'

const mockGetText = vi.fn<() => string | null>()
const mockCreateNote = vi.fn<(vaultUri: string, initialContent?: string) => string>(
  () => 'content://doc/new',
)
const mockClipboard: ClipboardService = { getText: mockGetText }

const mockVaultService: VaultService = {
  getStoredVaultUri: vi.fn(() => 'content://vault'),
  saveVaultUri: vi.fn(),
  requestVaultPermission: vi.fn(async () => null),
  listNotes: vi.fn<(uri: string) => NoteMetadata[]>(() => []),
  createNote: mockCreateNote,
  saveNote: vi.fn((uri) => uri),
  readNote: vi.fn(() => ''),
}

describe('useFab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureClipboardService(mockClipboard)
    configureVaultService(mockVaultService)
    // initialise vaultUri so createNote() doesn't throw
    useVaultStore().init()
    vi.clearAllMocks()
    mockCreateNote.mockReturnValue('content://doc/new')
  })

  // ─── expanded state ────────────────────────────────────────────────────────

  it('starts collapsed', () => {
    const fab = useFab()
    expect(fab.isExpanded.value).toBe(false)
  })

  describe('toggle()', () => {
    it('expands when collapsed', () => {
      const fab = useFab()
      fab.toggle()
      expect(fab.isExpanded.value).toBe(true)
    })

    it('collapses when expanded', () => {
      const fab = useFab()
      fab.toggle()
      fab.toggle()
      expect(fab.isExpanded.value).toBe(false)
    })
  })

  describe('collapse()', () => {
    it('collapses the FAB', () => {
      const fab = useFab()
      fab.toggle() // expand
      fab.collapse()
      expect(fab.isExpanded.value).toBe(false)
    })
  })

  // ─── pasteNote ─────────────────────────────────────────────────────────────

  describe('pasteNote()', () => {
    it('returns isEmpty:true and creates no note when clipboard is empty', () => {
      mockGetText.mockReturnValue(null)
      const fab = useFab()
      const result = fab.pasteNote()
      expect(result).toEqual({ isEmpty: true })
      expect(mockCreateNote).not.toHaveBeenCalled()
    })

    it('returns isEmpty:true and creates no note when clipboard is an empty string', () => {
      mockGetText.mockReturnValue('')
      const fab = useFab()
      const result = fab.pasteNote()
      expect(result).toEqual({ isEmpty: true })
      expect(mockCreateNote).not.toHaveBeenCalled()
    })

    it('creates a note with clipboard content and returns its URI', () => {
      mockGetText.mockReturnValue('clipboard text')
      const fab = useFab()
      const result = fab.pasteNote()
      expect(result).toEqual({ isEmpty: false, uri: 'content://doc/new' })
      expect(mockCreateNote).toHaveBeenCalledWith('content://vault', 'clipboard text')
    })

    it('collapses the FAB after paste regardless of outcome', () => {
      mockGetText.mockReturnValue('some text')
      const fab = useFab()
      fab.toggle() // expand
      fab.pasteNote()
      expect(fab.isExpanded.value).toBe(false)
    })

    it('collapses the FAB even when clipboard is empty', () => {
      mockGetText.mockReturnValue(null)
      const fab = useFab()
      fab.toggle() // expand
      fab.pasteNote()
      expect(fab.isExpanded.value).toBe(false)
    })
  })
})
