import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
  packageManager?: string
}

const ciWorkflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8')

describe('CI pnpm setup', () => {
  it('relies on packageManager instead of duplicating the pnpm version in GitHub Actions', () => {
    expect(packageJson.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/)
    expect(ciWorkflow).not.toMatch(/uses:\s*pnpm\/action-setup@v4\s*\n\s*with:\s*\n\s*version:/)
  })
})

