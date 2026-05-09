import { describe, expect, it } from 'vitest'

import { DATE_FORMAT, META_FILENAME, VAULT_URI_KEY } from '../constants'

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
