<template>
  <Frame>
    <component :is="rootPage" />
  </Frame>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Application } from '@nativescript/core'

import { useVaultStore } from './stores/vault'
import GridView from './pages/Grid/GridView.vue'
import VaultSetupView from './pages/VaultSetup/VaultSetupView.vue'

const vaultStore = useVaultStore()

try {
  vaultStore.init()
}
catch {
  // If SharedPreferences is corrupt, stay on VaultSetupView (vaultUri remains null)
}

Application.on('resume', () => {
  vaultStore.loadNotes()
})

const rootPage = computed(() =>
  vaultStore.vaultUri ? GridView : VaultSetupView,
)
</script>
