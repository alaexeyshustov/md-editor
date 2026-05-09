<template>
  <Frame>
    <component :is="rootPage" />
  </Frame>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
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

const rootPage = computed(() =>
  vaultStore.vaultUri ? GridView : VaultSetupView,
)

function handleResume() {
  void vaultStore.loadNotes()
}

onMounted(() => {
  Application.on('resume', handleResume)
})

onUnmounted(() => {
  Application.off('resume', handleResume)
})
</script>
