<template>
  <Page>
    <ActionBar title="Set Up Vault" />
    <StackLayout class="p-6">
      <Label
        text="Choose your Obsidian vault folder. The app will read and write Markdown files directly to that folder."
        text-wrap="true"
        class="mb-4"
      />
      <Button
        text="Choose Obsidian Vault Folder"
        @tap="onChooseVault"
      />
    </StackLayout>
  </Page>
</template>

<script setup lang="ts">
import { Frame } from '@nativescript/core'

import { vaultService } from '../../services/vault-service/android-adapters'
import { useVaultStore } from '../../stores/vault'
import GridView from '../Grid/GridView.vue'

const vaultStore = useVaultStore()

async function onChooseVault() {
  const uri = await vaultService.requestVaultPermission()
  if (uri) {
    vaultStore.setVaultUri(uri)
    Frame.topmost().navigate({ create: () => new (GridView as never)() })
  }
}
</script>
