import { describe, expect, it } from 'vitest'

import { DATE_FORMAT, generateHash, META_FILENAME, VAULT_URI_KEY } from '../constants'

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

describe('constants', () => {
  it('VAULT_URI_KEY is defined', () => {
    expect(VAULT_URI_KEY).toBe('vault_uri')
  })

  it('META_FILENAME is defined', () => {
    expect(META_FILENAME).toBe('.md-editor-meta.json')
  })

  it('DATE_FORMAT is defined', () => {
    expect(DATE_FORMAT).toBe('YYYY-MM-DD')
  })
})
