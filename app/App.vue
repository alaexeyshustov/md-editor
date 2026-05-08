<template>
  <Frame>
    <component :is="rootPage" />
  </Frame>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

import { useVaultStore } from './stores/vault'
import GridView from './pages/Grid/GridView.vue'
import VaultSetupView from './pages/VaultSetup/VaultSetupView.vue'

const vaultStore = useVaultStore()

onMounted(() => {
  vaultStore.init()
})

const rootPage = computed(() =>
  vaultStore.vaultUri ? GridView : VaultSetupView,
)
</script>
