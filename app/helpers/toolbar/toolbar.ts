/**
 * Pure toolbar logic helpers — independently testable, no UI dependencies.
 */

/**
 * Returns the zero-based start and end character offsets of the line that
 * contains `cursor`.  `end` points at the newline character (or end-of-string)
 * so `text.slice(start, end)` gives the line text without the newline.
 */
export function getLineRange(
  text: string,
  cursor: number,
): { start: number; end: number } {
  const start = text.lastIndexOf('\n', cursor - 1) + 1
  const rawEnd = text.indexOf('\n', cursor)
  const end = rawEnd === -1 ? text.length : rawEnd
  return { start, end }
}

/**
 * Cycles heading level on a single line:
 *   plain  →  # (H1)
 *   # H1   →  ## (H2)
 *   ## H2  →  ### (H3)
 *   ### H3 →  plain (removes heading)
 *
 * Only exact H1/H2/H3 prefixes are recognised. H4+ is treated as plain text.
 */
export function cycleHeadline(line: string): string {
  if (line.startsWith('### ')) {
    return line.slice(4)
  }
  if (line.startsWith('## ')) {
    return `#${line}`
  }
  if (line.startsWith('# ')) {
    return `#${line}`
  }
  return `# ${line}`
}

/**
 * Decides what prefix to add to a new line when the user presses Enter
 * while in list mode.
 *
 * Returns:
 *   "- "  — the current line is a non-empty list item   → continue list
 *   ""    — the current line is an empty list item (`- ` only) → exit list mode
 *   ""    — the current line is not a list item
 */
export function continueList(line: string): string {
  if (!line.startsWith('- ')) return ''
  const body = line.slice(2).trim()
  return body.length > 0 ? '- ' : ''
}

/**
 * Toggles the checkbox state on a line:
 *   `- [ ] text`  →  `- [x] text`
 *   `- [x] text`  →  `- [ ] text`
 *   `- text`      →  `- [ ] text`  (promotes a plain list item)
 */
export function toggleCheckbox(line: string): string {
  if (line.startsWith('- [ ] ')) {
    return `- [x] ${line.slice(6)}`
  }
  if (line.startsWith('- [x] ')) {
    return `- [ ] ${line.slice(6)}`
  }
  if (line.startsWith('- ')) {
    return `- [ ] ${line.slice(2)}`
  }
  return line
}

/**
 * Returns the checkbox prefix to insert on a blank (or whitespace-only) line.
 * Call this when the Checkbox button is tapped and the current line is blank.
 */
export function insertCheckbox(): string {
  return '- [ ] '
}
