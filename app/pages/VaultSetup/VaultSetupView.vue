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
import { useVaultStore } from '../../stores/vault'

const vaultStore = useVaultStore()

async function onChooseVault() {
  await vaultStore.pickAndSetVault()
}
</script>
