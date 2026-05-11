import { createPinia } from 'pinia'
import { createApp } from 'nativescript-vue'

import App from './App.vue'
import { configureClipboardService } from './services/clipboard-service/clipboard-service'
import { vaultService } from './services/vault-service/android-adapters'
import { configureVaultService } from './stores/vault'

configureVaultService(vaultService)
configureClipboardService({
  setText: (text: string) => {
    // Use Android native clipboard directly
    const context = (global as { android?: { app?: { Application?: { getInstance?: () => android.content.Context } } } })
      .android?.app?.Application?.getInstance?.()
    if (!context) return
    const cm = context.getSystemService(
      android.content.Context.CLIPBOARD_SERVICE,
    ) as android.content.ClipboardManager
    cm.setPrimaryClip(
      android.content.ClipData.newPlainText('md-editor', text),
    )
  },
})
createApp(App).use(createPinia()).start()

