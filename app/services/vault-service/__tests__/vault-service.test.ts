import { describe, expect, it } from 'vitest'

import { createVaultService } from '../vault-service'

function makeStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    get: (key: string) => store.get(key) ?? null,
    set: (key: string, value: string) => { store.set(key, value) },
  }
}

const neverPicker = { requestFolderPicker: async () => null as string | null }

describe('VaultService.getStoredVaultUri', () => {
  it('returns null when nothing is stored', () => {
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker })
    expect(service.getStoredVaultUri()).toBeNull()
  })
})

describe('VaultService.saveVaultUri', () => {
  it('persists the URI so getStoredVaultUri returns it', () => {
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker })
    service.saveVaultUri('content://com.example/vault')
    expect(service.getStoredVaultUri()).toBe('content://com.example/vault')
  })
})

describe('VaultService.requestVaultPermission', () => {
  it('returns the URI returned by the permission adapter', async () => {
    const picker = { requestFolderPicker: async () => 'content://picked/uri' as string | null }
    const service = createVaultService({ storage: makeStorage(), permission: picker })
    expect(await service.requestVaultPermission()).toBe('content://picked/uri')
  })

  it('returns null when the user cancels', async () => {
    const service = createVaultService({ storage: makeStorage(), permission: neverPicker })
    expect(await service.requestVaultPermission()).toBeNull()
  })
})
