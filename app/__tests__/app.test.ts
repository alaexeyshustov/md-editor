import { describe, expect, it } from 'vitest'

import { appInfo } from '../app'

describe('appInfo', () => {
  it('describes the offline markdown editor starter', () => {
    expect(appInfo.name).toBe('md-editor')
    expect(appInfo.tagline).toContain('offline markdown editor')
  })
})

