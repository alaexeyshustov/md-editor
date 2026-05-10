import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isRef } from 'vue'

import type { NoteMetadata, VaultService } from '../../../services/vault-service/vault-service'
import { configureVaultService } from '../../../stores/vault'
import { useEditor } from '../use-editor'

const mockListNotes = vi.fn<(uri: string) => NoteMetadata[]>(() => [])
const mockCreateNote = vi.fn<(vaultUri: string) => string>(() => 'content://doc/new')
const mockSaveNote = vi.fn<(uri: string, content: string) => string>()
const mockReadNote = vi.fn<(uri: string) => string>(() => '')

const mockService: VaultService = {
  getStoredVaultUri: vi.fn(() => 'content://vault'),
  saveVaultUri: vi.fn(),
  requestVaultPermission: vi.fn(async () => null),
  listNotes: mockListNotes,
  createNote: mockCreateNote,
  saveNote: mockSaveNote,
  readNote: mockReadNote,
}

describe('useEditor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureVaultService(mockService)
    vi.clearAllMocks()
    mockSaveNote.mockImplementation((uri) => uri)
    mockReadNote.mockReturnValue('')
  })

  it('exposes a reactive content ref', () => {
    const editor = useEditor()
    expect(isRef(editor.content)).toBe(true)
  })

  it('exposes a reactive currentUri ref initialized to null', () => {
    const editor = useEditor()
    expect(isRef(editor.currentUri)).toBe(true)
    expect(editor.currentUri.value).toBeNull()
  })

  describe('load(uri)', () => {
    it('sets currentUri to the provided URI', () => {
      const editor = useEditor()
      editor.load('content://doc/note')
      expect(editor.currentUri.value).toBe('content://doc/note')
    })

    it('reads content from the store and sets content ref', () => {
      mockReadNote.mockReturnValue('# Hello\nworld')
      const editor = useEditor()
      editor.load('content://doc/note')
      expect(editor.content.value).toBe('# Hello\nworld')
    })

    it('calls store.readNote with the URI', () => {
      const editor = useEditor()
      editor.load('content://doc/xyz')
      expect(mockReadNote).toHaveBeenCalledWith('content://doc/xyz')
    })
  })

  describe('save()', () => {
    it('calls store.saveNote with current uri and content', async () => {
      mockSaveNote.mockReturnValue('content://doc/note')
      const editor = useEditor()
      editor.load('content://doc/note')
      editor.content.value = 'updated content'
      await editor.save()
      expect(mockSaveNote).toHaveBeenCalledWith('content://doc/note', 'updated content')
    })

    it('updates currentUri to the returned URI after save', async () => {
      mockSaveNote.mockReturnValue('content://doc/renamed')
      const editor = useEditor()
      editor.load('content://doc/hash123')
      await editor.save()
      expect(editor.currentUri.value).toBe('content://doc/renamed')
    })

    it('does nothing when currentUri is null', async () => {
      const editor = useEditor()
      await editor.save()
      expect(mockSaveNote).not.toHaveBeenCalled()
    })
  })
})
