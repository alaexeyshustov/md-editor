<template>
  <Page @navigating-from="onNavigatingFrom">
    <ActionBar title="">
      <NavigationButton text="Back" />
    </ActionBar>
    <TextView
      :text="content"
      hint="Start writing..."
      editable="true"
      class="editor-text"
      @text-change="onTextChange"
    />
  </Page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { NavigatedData, PropertyChangeData } from '@nativescript/core'

import { useEditor } from '../../hooks/use-editor/use-editor'

const props = defineProps<{ uri: string }>()
const { content, load, save } = useEditor()
let saving = false

onMounted(() => load(props.uri))

function onTextChange(args: PropertyChangeData) {
  content.value = String(args.value)
}

function onNavigatingFrom(args: NavigatedData) {
  if (!args.isBackNavigation || saving) return
  saving = true
  save().catch(() => {}).finally(() => { saving = false })
}
</script>

<style scoped>
.editor-text {
  width: 100%;
  height: 100%;
  font-family: monospace;
  font-size: 16;
  padding: 12;
  background-color: #ffffff;
  color: #1a1a1a;
}
</style>
