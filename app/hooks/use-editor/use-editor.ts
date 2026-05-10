import { ref } from 'vue'

import { useVaultStore } from '../../stores/vault'

export function useEditor() {
  const vaultStore = useVaultStore()
  const content = ref('')
  const currentUri = ref<string | null>(null)

  function load(uri: string) {
    currentUri.value = uri
    content.value = vaultStore.readNote(uri)
  }

  async function save() {
    if (!currentUri.value) return
    const newUri = await vaultStore.saveNote(currentUri.value, content.value)
    currentUri.value = newUri
  }

  return { content, currentUri, load, save }
}
