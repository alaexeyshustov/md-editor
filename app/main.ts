import { createPinia } from 'pinia'
import { createApp } from 'nativescript-vue'

import App from './App.vue'
import { vaultService } from './services/vault-service/android-adapters'
import { configureVaultService } from './stores/vault'

configureVaultService(vaultService)
createApp(App).use(createPinia()).start()
