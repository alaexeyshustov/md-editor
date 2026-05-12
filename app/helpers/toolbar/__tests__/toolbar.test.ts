import { describe, expect, it } from 'vitest'

import {
  continueList,
  cycleHeadline,
  getLineRange,
  insertCheckbox,
  toggleCheckbox,
} from '../toolbar'

describe('getLineRange', () => {
  it('returns full text range when there are no newlines', () => {
    expect(getLineRange('hello', 2)).toEqual({ start: 0, end: 5 })
  })

  it('returns range of the first line when cursor is on it', () => {
    expect(getLineRange('first\nsecond', 3)).toEqual({ start: 0, end: 5 })
  })

  it('returns range of the second line when cursor is on it', () => {
    expect(getLineRange('first\nsecond', 7)).toEqual({ start: 6, end: 12 })
  })

  it('treats cursor at the newline as still on the previous line', () => {
    // cursor = 5 which is the '\n' character itself
    expect(getLineRange('first\nsecond', 5)).toEqual({ start: 0, end: 5 })
  })
})

describe('cycleHeadline', () => {
  it('adds H1 prefix to a plain line', () => {
    expect(cycleHeadline('Hello world')).toBe('# Hello world')
  })

  it('adds H1 prefix to a blank line', () => {
    expect(cycleHeadline('')).toBe('# ')
  })

  it('advances H1 to H2', () => {
    expect(cycleHeadline('# Hello')).toBe('## Hello')
  })

  it('advances H2 to H3', () => {
    expect(cycleHeadline('## Hello')).toBe('### Hello')
  })

  it('removes H3 to restore plain text', () => {
    expect(cycleHeadline('### Hello')).toBe('Hello')
  })

  it('treats H4+ as a plain line and adds H1', () => {
    expect(cycleHeadline('#### Deep')).toBe('# #### Deep')
  })
})

describe('continueList', () => {
  it('returns "- " when the current line is a non-empty list item', () => {
    expect(continueList('- Some item')).toBe('- ')
  })

  it('returns "" when the current line is an empty list item (exit list mode)', () => {
    expect(continueList('- ')).toBe('')
  })

  it('returns "" for a plain line (not in list mode)', () => {
    expect(continueList('Hello')).toBe('')
  })

  it('returns "- " for a list item with extra spaces', () => {
    expect(continueList('-   text')).toBe('- ')
  })
})

describe('toggleCheckbox', () => {
  it('toggles unchecked to checked', () => {
    expect(toggleCheckbox('- [ ] Buy milk')).toBe('- [x] Buy milk')
  })

  it('toggles checked to unchecked', () => {
    expect(toggleCheckbox('- [x] Buy milk')).toBe('- [ ] Buy milk')
  })

  it('adds unchecked checkbox prefix to a plain list item', () => {
    expect(toggleCheckbox('- Buy milk')).toBe('- [ ] Buy milk')
  })
})

describe('insertCheckbox', () => {
  it('inserts "- [ ] " on any line', () => {
    expect(insertCheckbox()).toBe('- [ ] ')
  })
})
