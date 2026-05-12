import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NoteMetadata } from '../../../services/vault-service/vault-service'
import { useNoteActions } from '../use-note-actions'

// ── Dialogs mock ──────────────────────────────────────────────────────────────
const mockAction = vi.fn<(message: string, cancelButtonText: string, actions: string[]) => Promise<string>>()
const mockConfirm = vi.fn<(message: string) => Promise<boolean>>()

vi.mock('@nativescript/core', () => ({
  Dialogs: {
    action: (...args: Parameters<typeof mockAction>) => mockAction(...args),
    confirm: (...args: Parameters<typeof mockConfirm>) => mockConfirm(...args),
  },
}))

// ── Vault service mock ────────────────────────────────────────────────────────
const mockPinNote = vi.fn<(uri: string, pinned: boolean) => Promise<void>>()
const mockDeleteNote = vi.fn<(uri: string) => Promise<void>>()

vi.mock('../../../stores/vault', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../stores/vault')>()
  return {
    ...actual,
    useVaultStore: () => ({
      pinNote: mockPinNote,
      deleteNote: mockDeleteNote,
    }),
  }
})

function makeNote(overrides: Partial<NoteMetadata> = {}): NoteMetadata {
  return { id: 'a', uri: 'a', title: 'My Note', preview: '', lastModified: 1000, ...overrides }
}

describe('useNoteActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('showActions on an unpinned note', () => {
    it('shows "Pin" and "Delete" options', async () => {
      mockAction.mockResolvedValue('Cancel')
      const { showActions } = useNoteActions()
      await showActions(makeNote({ pinned: false }))
      expect(mockAction).toHaveBeenCalledWith(
        'My Note',
        'Cancel',
        expect.arrayContaining(['Pin', 'Delete']),
      )
    })

    it('pins the note when "Pin" is selected', async () => {
      mockAction.mockResolvedValue('Pin')
      const { showActions } = useNoteActions()
      await showActions(makeNote({ uri: 'a', pinned: false }))
      expect(mockPinNote).toHaveBeenCalledWith('a', true)
    })
  })

  describe('showActions on a pinned note', () => {
    it('shows "Unpin" and "Delete" options', async () => {
      mockAction.mockResolvedValue('Cancel')
      const { showActions } = useNoteActions()
      await showActions(makeNote({ pinned: true }))
      expect(mockAction).toHaveBeenCalledWith(
        'My Note',
        'Cancel',
        expect.arrayContaining(['Unpin', 'Delete']),
      )
    })

    it('unpins the note when "Unpin" is selected', async () => {
      mockAction.mockResolvedValue('Unpin')
      const { showActions } = useNoteActions()
      await showActions(makeNote({ uri: 'a', pinned: true }))
      expect(mockPinNote).toHaveBeenCalledWith('a', false)
    })
  })

  describe('Delete action', () => {
    it('shows confirmation dialog when "Delete" is selected', async () => {
      mockAction.mockResolvedValue('Delete')
      mockConfirm.mockResolvedValue(false)
      const { showActions } = useNoteActions()
      await showActions(makeNote())
      expect(mockConfirm).toHaveBeenCalled()
    })

    it('deletes the note when confirmed', async () => {
      mockAction.mockResolvedValue('Delete')
      mockConfirm.mockResolvedValue(true)
      const { showActions } = useNoteActions()
      await showActions(makeNote({ uri: 'a' }))
      expect(mockDeleteNote).toHaveBeenCalledWith('a')
    })

    it('does not delete the note when confirmation cancelled', async () => {
      mockAction.mockResolvedValue('Delete')
      mockConfirm.mockResolvedValue(false)
      const { showActions } = useNoteActions()
      await showActions(makeNote({ uri: 'a' }))
      expect(mockDeleteNote).not.toHaveBeenCalled()
    })
  })

  describe('Cancel / dismiss', () => {
    it('does nothing when "Cancel" is selected', async () => {
      mockAction.mockResolvedValue('Cancel')
      const { showActions } = useNoteActions()
      await showActions(makeNote())
      expect(mockPinNote).not.toHaveBeenCalled()
      expect(mockDeleteNote).not.toHaveBeenCalled()
    })
  })
})
