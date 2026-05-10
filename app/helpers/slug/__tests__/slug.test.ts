import { describe, expect, it } from 'vitest'

import { slugify } from '../slug'

describe('slugify', () => {
  it('lowercases the input', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('my note title')).toBe('my-note-title')
  })

  it('strips non-alphanumeric characters', () => {
    expect(slugify('hello! world?')).toBe('hello-world')
  })

  it('collapses multiple hyphens into one', () => {
    expect(slugify('hello---world')).toBe('hello-world')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('!hello!')).toBe('hello')
  })

  it('truncates to 60 characters', () => {
    const long = 'a'.repeat(100)
    expect(slugify(long).length).toBe(60)
  })

  it('does not end with a hyphen after truncation', () => {
    const input = 'a'.repeat(58) + ' b'
    const result = slugify(input)
    expect(result.endsWith('-')).toBe(false)
  })

  it('returns empty string for blank input', () => {
    expect(slugify('')).toBe('')
    expect(slugify('   ')).toBe('')
  })

  it('returns empty string for input with only special characters', () => {
    expect(slugify('!@#$%')).toBe('')
  })

  it('handles unicode letters by stripping them', () => {
    expect(slugify('café')).toBe('caf')
  })

  it('preserves digits', () => {
    expect(slugify('note 2024')).toBe('note-2024')
  })
})
