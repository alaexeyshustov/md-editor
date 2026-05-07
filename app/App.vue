<template>
  <Page>
    <ActionBar :title="appInfo.name" />

    <ScrollView>
      <StackLayout class="p-6">
        <Label
          :text="appInfo.tagline"
          text-wrap="true"
        />
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { appInfo } from './app'
</script>

