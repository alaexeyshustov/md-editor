import { Dialogs } from '@nativescript/core'

import type { NoteMetadata } from '../../services/vault-service/vault-service'
import { useVaultStore } from '../../stores/vault'

export interface NoteActions {
  showActions(note: NoteMetadata): Promise<void>
}

export function useNoteActions(): NoteActions {
  const vault = useVaultStore()

  async function showActions(note: NoteMetadata): Promise<void> {
    const pinLabel = note.pinned ? 'Unpin' : 'Pin'
    const choice = await Dialogs.action(note.title, 'Cancel', [pinLabel, 'Delete'])

    if (choice === 'Pin') {
      await vault.pinNote(note.uri, true)
    }
    else if (choice === 'Unpin') {
      await vault.pinNote(note.uri, false)
    }
    else if (choice === 'Delete') {
      const confirmed = await Dialogs.confirm(`Delete "${note.title}"? This cannot be undone.`)
      if (confirmed) {
        await vault.deleteNote(note.uri)
      }
    }
  }

  return { showActions }
}
