<template>
  <Page @navigating-from="onNavigatingFrom">
    <ActionBar title="">
      <NavigationButton text="Back" />
    </ActionBar>
    <GridLayout rows="*, auto">
      <TextView
        row="0"
        :text="content"
        hint="Start writing..."
        editable="true"
        class="editor-text"
        @text-change="onTextChange"
        @loaded="onTextViewLoaded"
      />
      <MarkdownToolbar
        row="1"
        @headline="onHeadline"
        @list="onList"
        @checkbox="onCheckbox"
        @copy-raw="onCopyRaw"
      />
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { NavigatedData, PropertyChangeData } from '@nativescript/core'

import { useEditor } from '../../hooks/use-editor/use-editor'
import { useToolbar } from '../../hooks/use-toolbar/use-toolbar'
import MarkdownToolbar from './components/MarkdownToolbar/MarkdownToolbar.vue'

const props = defineProps<{ uri: string }>()
const editor = useEditor()
let saving = false

// NativeScript TextView native reference for reading cursor position
let textViewNative: android.widget.EditText | null = null

function getCursorPos(): number {
  return textViewNative?.getSelectionStart() ?? editor.content.value.length
}

const toolbar = useToolbar(editor.content, getCursorPos)

onMounted(() => editor.load(props.uri))

function onTextViewLoaded(args: { object: { nativeView: android.widget.EditText } }) {
  textViewNative = args.object.nativeView
}

function onTextChange(args: PropertyChangeData) {
  editor.content.value = String(args.value)
}

function onNavigatingFrom(args: NavigatedData) {
  toolbar.resetHeadlineState()
  if (!args.isBackNavigation || saving) return
  saving = true
  editor.save().catch(() => {}).finally(() => { saving = false })
}

function onHeadline() {
  toolbar.onHeadline()
}

function onList() {
  toolbar.onList()
}

function onCheckbox() {
  toolbar.onCheckbox()
}

function onCopyRaw() {
  toolbar.onCopyRaw()
}

const { content } = editor
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

