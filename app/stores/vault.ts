import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { NoteMetadata, NotesMeta, VaultService } from '../services/vault-service/vault-service'

let _service: VaultService | null = null

export function configureVaultService(service: VaultService): void {
  _service = service
}

function getService(): VaultService {
  if (!_service) throw new Error('VaultService not configured. Call configureVaultService() before using the store.')
  return _service
}

export const useVaultStore = defineStore('vault', () => {
  const vaultUri = ref<string | null>(null)
  const notes = ref<NoteMetadata[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const sortedNotes = computed(() => {
    const pinned = notes.value
      .filter(n => n.pinned)
      .sort((a, b) => b.lastModified - a.lastModified)
    const unpinned = notes.value
      .filter(n => !n.pinned)
      .sort((a, b) => b.lastModified - a.lastModified)
    return [...pinned, ...unpinned]
  })

  function init() {
    vaultUri.value = getService().getStoredVaultUri()
  }

  function setVaultUri(uri: string) {
    vaultUri.value = uri
    getService().saveVaultUri(uri)
  }

  async function pickAndSetVault(): Promise<string | null> {
    const uri = await getService().requestVaultPermission()
    if (uri) setVaultUri(uri)
    return uri
  }

  async function loadNotes(): Promise<void> {
    if (!vaultUri.value) return
    isLoading.value = true
    error.value = null
    try {
      const rawNotes = getService().listNotes(vaultUri.value)
      const meta: NotesMeta = getService().readMeta(vaultUri.value)
      const pinnedSet = new Set(meta.pinned)
      notes.value = rawNotes.map(n => ({ ...n, pinned: pinnedSet.has(n.uri) }))
    }
    catch (e) {
      notes.value = []
      error.value = e instanceof Error ? e : new Error(String(e))
    }
    finally {
      isLoading.value = false
    }
  }

  function createNote(): string {
    if (!vaultUri.value) throw new Error('No vault selected')
    return getService().createNote(vaultUri.value)
  }

  async function saveNote(uri: string, content: string): Promise<string> {
    const newUri = getService().saveNote(uri, content)
    await loadNotes()
    return newUri
  }

  function readNote(uri: string): string {
    return getService().readNote(uri)
  }

  async function pinNote(uri: string, pinned: boolean): Promise<void> {
    if (!vaultUri.value) throw new Error('No vault selected')
    const meta = getService().readMeta(vaultUri.value)
    const newPinned = pinned
      ? [...new Set([...meta.pinned, uri])]
      : meta.pinned.filter(id => id !== uri)
    getService().writeMeta(vaultUri.value, { pinned: newPinned })
    notes.value = notes.value.map(n => n.uri === uri ? { ...n, pinned } : n)
  }

  async function deleteNote(uri: string): Promise<void> {
    if (!vaultUri.value) throw new Error('No vault selected')
    getService().deleteNote(uri)
    const meta = getService().readMeta(vaultUri.value)
    if (meta.pinned.includes(uri)) {
      getService().writeMeta(vaultUri.value, { pinned: meta.pinned.filter(id => id !== uri) })
    }
    notes.value = notes.value.filter(n => n.uri !== uri)
  }

  return { vaultUri, notes, error, isLoading, sortedNotes, init, setVaultUri, pickAndSetVault, loadNotes, createNote, saveNote, readNote, pinNote, deleteNote }
})
