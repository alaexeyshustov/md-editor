import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { ClipboardService } from '../../../services/clipboard-service/clipboard-service'
import { configureClipboardService } from '../../../services/clipboard-service/clipboard-service'
import { useToolbar } from '../use-toolbar'

const mockSetText = vi.fn()
const mockClipboard: ClipboardService = { setText: mockSetText }

describe('useToolbar', () => {
  beforeEach(() => {
    configureClipboardService(mockClipboard)
    vi.clearAllMocks()
  })

  // ─── onHeadline ──────────────────────────────────────────────────────────────

  describe('onHeadline()', () => {
    it('adds H1 to a plain line', () => {
      const content = ref('Hello world')
      const { onHeadline } = useToolbar(content, () => 5)
      onHeadline()
      expect(content.value).toBe('# Hello world')
    })

    it('advances H1 → H2', () => {
      const content = ref('# Hello')
      const { onHeadline } = useToolbar(content, () => 3)
      onHeadline()
      expect(content.value).toBe('## Hello')
    })

    it('advances H2 → H3', () => {
      const content = ref('## Hello')
      const { onHeadline } = useToolbar(content, () => 3)
      onHeadline()
      expect(content.value).toBe('### Hello')
    })

    it('removes H3', () => {
      const content = ref('### Hello')
      const { onHeadline } = useToolbar(content, () => 3)
      onHeadline()
      expect(content.value).toBe('Hello')
    })

    it('operates only on the current line when content is multi-line', () => {
      const content = ref('first\nsecond\nthird')
      const { onHeadline } = useToolbar(content, () => 8)
      onHeadline()
      expect(content.value).toBe('first\n# second\nthird')
    })

    it('returns the new cursor position (clamped to new line length)', () => {
      const content = ref('### Hi')
      const { onHeadline } = useToolbar(content, () => 6)
      const newCursor = onHeadline()
      expect(content.value).toBe('Hi')
      expect(newCursor).toBe(2)
    })
  })

  // ─── onList ──────────────────────────────────────────────────────────────────

  describe('onList()', () => {
    it('inserts "- " at start of current line', () => {
      const content = ref('Buy milk')
      const { onList } = useToolbar(content, () => 0)
      onList()
      expect(content.value).toBe('- Buy milk')
    })

    it('does not double-prefix an already-list line', () => {
      const content = ref('- Buy milk')
      const { onList } = useToolbar(content, () => 5)
      onList()
      expect(content.value).toBe('- Buy milk')
    })

    it('activates isListActive', () => {
      const content = ref('item')
      const { onList, isListActive } = useToolbar(content, () => 0)
      expect(isListActive.value).toBe(false)
      onList()
      expect(isListActive.value).toBe(true)
    })

    it('returns cursor advanced by 2 (the "- " prefix)', () => {
      const content = ref('Buy milk')
      const { onList } = useToolbar(content, () => 0)
      const newCursor = onList()
      expect(newCursor).toBe(2)
    })
  })

  // ─── onEnter ─────────────────────────────────────────────────────────────────

  describe('onEnter()', () => {
    it('prepends "- " on the new line when list is active', () => {
      const content = ref('- item')
      const cursorPos = ref(6)
      const { onList, onEnter } = useToolbar(content, () => cursorPos.value)
      onList() // activate list
      cursorPos.value = content.value.length
      const newCursor = onEnter()
      expect(content.value).toBe('- item\n- ')
      expect(newCursor).toBe(content.value.length)
    })

    it('exits list mode and inserts plain newline on empty list item', () => {
      const content = ref('- ')
      const cursorPos = ref(2)
      const { onList, onEnter, isListActive } = useToolbar(content, () => cursorPos.value)
      onList()
      const newCursor = onEnter()
      expect(isListActive.value).toBe(false)
      expect(content.value).toBe('- \n')
      expect(newCursor).toBe(3)
    })

    it('does nothing special when list is not active', () => {
      const content = ref('Hello')
      const cursorPos = ref(5)
      const { onEnter } = useToolbar(content, () => cursorPos.value)
      const newCursor = onEnter()
      expect(newCursor).toBe(5)
    })
  })

  // ─── onCheckbox ──────────────────────────────────────────────────────────────

  describe('onCheckbox()', () => {
    it('inserts "- [ ] " on a blank line', () => {
      const content = ref('')
      const { onCheckbox } = useToolbar(content, () => 0)
      onCheckbox()
      expect(content.value).toBe('- [ ] ')
    })

    it('toggles [ ] to [x]', () => {
      const content = ref('- [ ] Buy milk')
      const { onCheckbox } = useToolbar(content, () => 5)
      onCheckbox()
      expect(content.value).toBe('- [x] Buy milk')
    })

    it('toggles [x] to [ ]', () => {
      const content = ref('- [x] Buy milk')
      const { onCheckbox } = useToolbar(content, () => 5)
      onCheckbox()
      expect(content.value).toBe('- [ ] Buy milk')
    })
  })

  // ─── onCopyRaw ───────────────────────────────────────────────────────────────

  describe('onCopyRaw()', () => {
    it('copies full content to clipboard', () => {
      const content = ref('# My note\nSome text')
      const { onCopyRaw } = useToolbar(content, () => 0)
      onCopyRaw()
      expect(mockSetText).toHaveBeenCalledWith('# My note\nSome text')
    })
  })

  // ─── resetHeadlineState ──────────────────────────────────────────────────────

  describe('resetHeadlineState()', () => {
    it('deactivates list mode', () => {
      const content = ref('- item')
      const { onList, resetHeadlineState, isListActive } = useToolbar(content, () => 0)
      onList()
      expect(isListActive.value).toBe(true)
      resetHeadlineState()
      expect(isListActive.value).toBe(false)
    })
  })
})
