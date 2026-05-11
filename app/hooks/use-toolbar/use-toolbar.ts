import { ref } from 'vue'
import type { Ref } from 'vue'

import {
  continueList,
  cycleHeadline,
  getLineRange,
  insertCheckbox,
  toggleCheckbox,
} from '../../helpers/toolbar/toolbar'
import { useClipboardService } from '../../services/clipboard-service/clipboard-service'

export interface ToolbarActions {
  /** Cycles heading level on the current line. Returns new cursor position. */
  onHeadline(): number
  /** Inserts `- ` prefix on the current line. Returns new cursor position. */
  onList(): number
  /**
   * Handles Enter while in list mode.
   * Continues list or exits list mode. Returns new cursor position.
   */
  onEnter(): number
  /**
   * Called after Android inserts a newline natively (via TextWatcher).
   * Inserts the list-continuation prefix right after the newline.
   * Returns the number of characters inserted (0 when nothing was added).
   */
  handleNativeEnter(cursorAfterNewline: number): number
  /** Inserts / toggles checkbox on the current line. Returns new cursor position. */
  onCheckbox(): number
  /** Copies full content to clipboard. */
  onCopyRaw(): void
  /** Resets list-mode state (call on navigation away). */
  resetHeadlineState(): void
  /** True while the auto-list mode is active. */
  isListActive: Ref<boolean>
}

export function useToolbar(
  contentRef: Ref<string>,
  getCursorPos: () => number,
): ToolbarActions {
  const isListActive = ref(false)

  function replaceLine(newLineText: string, lineStart: number, lineEnd: number): void {
    contentRef.value =
      contentRef.value.slice(0, lineStart) +
      newLineText +
      contentRef.value.slice(lineEnd)
  }

  function onHeadline(): number {
    const cursor = getCursorPos()
    const { start, end } = getLineRange(contentRef.value, cursor)
    const lineText = contentRef.value.slice(start, end)
    const newLine = cycleHeadline(lineText)
    replaceLine(newLine, start, end)
    return Math.min(cursor, start + newLine.length)
  }

  function onList(): number {
    const cursor = getCursorPos()
    const { start, end } = getLineRange(contentRef.value, cursor)
    const lineText = contentRef.value.slice(start, end)
    const prefix = '- '
    isListActive.value = true
    if (!lineText.startsWith(prefix)) {
      replaceLine(prefix + lineText, start, end)
      return cursor + prefix.length
    }
    return cursor
  }

  function onEnter(): number {
    if (!isListActive.value) return getCursorPos()
    const cursor = getCursorPos()
    const { start, end } = getLineRange(contentRef.value, cursor)
    const lineText = contentRef.value.slice(start, end)
    const continuation = continueList(lineText)
    if (continuation === '') {
      isListActive.value = false
      const insert = '\n'
      contentRef.value =
        contentRef.value.slice(0, cursor) + insert + contentRef.value.slice(cursor)
      return cursor + insert.length
    }
    const insert = '\n' + continuation
    contentRef.value =
      contentRef.value.slice(0, cursor) + insert + contentRef.value.slice(cursor)
    return cursor + insert.length
  }

  function handleNativeEnter(cursorAfterNewline: number): number {
    if (!isListActive.value) return 0
    const text = contentRef.value
    const newlinePos = cursorAfterNewline - 1
    const lineStart = text.lastIndexOf('\n', newlinePos - 1) + 1
    const prevLine = text.slice(lineStart, newlinePos)
    const prefix = continueList(prevLine)
    if (prefix === '') {
      isListActive.value = false
      return 0
    }
    contentRef.value =
      text.slice(0, cursorAfterNewline) + prefix + text.slice(cursorAfterNewline)
    return prefix.length
  }

  function onCheckbox(): number {
    const cursor = getCursorPos()
    const { start, end } = getLineRange(contentRef.value, cursor)
    const lineText = contentRef.value.slice(start, end)
    const newLine =
      lineText.trim() === '' ? insertCheckbox() : toggleCheckbox(lineText)
    replaceLine(newLine, start, end)
    return start + newLine.length
  }

  function onCopyRaw(): void {
    useClipboardService().setText(contentRef.value)
  }

  function resetHeadlineState(): void {
    isListActive.value = false
  }

  return {
    onHeadline,
    onList,
    onEnter,
    handleNativeEnter,
    onCheckbox,
    onCopyRaw,
    resetHeadlineState,
    isListActive,
  }
}
