import { createPinia } from 'pinia'
import { createApp } from 'nativescript-vue'

import App from './App.vue'
import { configureClipboardService } from './services/clipboard-service/clipboard-service'
import { vaultService } from './services/vault-service/android-adapters'
import { configureVaultService } from './stores/vault'

configureVaultService(vaultService)
configureClipboardService({
  getText: (): string | null => {
    // Access Android clipboard via the global android.content.Context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (global as any).android?.context as android.content.Context | undefined
    if (!ctx) return null
    const cm = ctx.getSystemService(
      android.content.Context.CLIPBOARD_SERVICE,
    ) as android.content.ClipboardManager
    const clip = cm.getPrimaryClip()
    if (!clip || clip.getItemCount() === 0) return null
    const text = clip.getItemAt(0).getText()?.toString() ?? null
    return text || null
  },
})
createApp(App).use(createPinia()).start()

