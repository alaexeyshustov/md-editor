<template>
  <Page>
    <ActionBar title="Notes" />
    <GridLayout>
      <ScrollView>
        <StackLayout>
          <ActivityIndicator
            v-if="grid.isLoading"
            :busy="true"
            class="loader"
          />

          <Label
            v-else-if="grid.sortedNotes.length === 0"
            text="No notes yet. Tap + to create your first note."
            class="empty-state"
            text-wrap="true"
          />

          <GridLayout
            v-else
            columns="*, *"
            class="grid-container"
          >
            <StackLayout
              col="0"
              class="grid-column"
            >
              <NoteCard
                v-for="note in leftColumnNotes"
                :key="note.id"
                :note="note"
                @open="openNote"
              />
            </StackLayout>
            <StackLayout
              col="1"
              class="grid-column"
            >
              <NoteCard
                v-for="note in rightColumnNotes"
                :key="note.id"
                :note="note"
                @open="openNote"
              />
            </StackLayout>
          </GridLayout>
        </StackLayout>
      </ScrollView>

      <FabButton
        :is-expanded="fab.isExpanded.value"
        @toggle="onFabToggle"
        @paste="onPaste"
        @new-note="onNewNote"
        @collapse="fab.collapse()"
      />
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Toast } from '@nativescript/core'
import { $navigateTo } from 'nativescript-vue'

import { useGrid } from '../../hooks/use-grid/use-grid'
import { useFab } from '../../hooks/use-fab/use-fab'
import EditorView from '../Editor/EditorView.vue'
import FabButton from './components/FabButton/FabButton.vue'
import NoteCard from './components/NoteCard/NoteCard.vue'

const grid = useGrid()
const fab = useFab()

const leftColumnNotes = computed(() =>
  grid.sortedNotes.filter((_, i) => i % 2 === 0),
)

const rightColumnNotes = computed(() =>
  grid.sortedNotes.filter((_, i) => i % 2 !== 0),
)

async function openNote(uri: string) {
  await $navigateTo(EditorView, { props: { uri } })
}

function onFabToggle() {
  fab.toggle()
}

async function onNewNote() {
  fab.collapse()
  const uri = grid.newNote()
  await $navigateTo(EditorView, { props: { uri } })
}

async function onPaste() {
  const result = fab.pasteNote()
  if (result.isEmpty) {
    Toast.makeText('Clipboard is empty', 'short').show()
    return
  }
  await $navigateTo(EditorView, { props: { uri: result.uri } })
}
</script>

<style scoped>
.loader {
  margin: 40;
}

.empty-state {
  margin: 40 20;
  font-size: 16;
  color: #999999;
  text-align: center;
}

.grid-container {
  padding: 6;
}

.grid-column {
  padding: 0;
}
</style>

