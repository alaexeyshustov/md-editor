<template>
  <Page @navigating-from="onNavigatingFrom">
    <ActionBar title="">
      <NavigationButton text="Back" />
    </ActionBar>
    <TextView
      :text="editor.content.value"
      hint="Start writing..."
      editable="true"
      class="editor-text"
      @text-change="onTextChange"
    />
  </Page>
</template>

<script setup lang="ts">
import type { NavigatedData, PropertyChangeData } from '@nativescript/core'

import { useEditor } from '../../hooks/use-editor/use-editor'

const props = defineProps<{ uri: string }>()
const editor = useEditor()

editor.load(props.uri)

function onTextChange(args: PropertyChangeData) {
  editor.content.value = String(args.value)
}

function onNavigatingFrom(args: NavigatedData) {
  if (args.isBackNavigation) {
    void editor.save()
  }
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
