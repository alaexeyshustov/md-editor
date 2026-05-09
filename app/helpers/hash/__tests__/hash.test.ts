import { describe, expect, it } from 'vitest'

import { generateHash } from '../hash'

describe('generateHash', () => {
  it('returns a non-empty string', () => {
    expect(generateHash('hello')).toBeTruthy()
    expect(typeof generateHash('hello')).toBe('string')
  })

  it('is deterministic', () => {
    expect(generateHash('abc')).toBe(generateHash('abc'))
  })

  it('produces different hashes for different inputs', () => {
    expect(generateHash('foo')).not.toBe(generateHash('bar'))
  })
})
