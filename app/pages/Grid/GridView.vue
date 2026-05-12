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
                @long-press="noteActions.showActions"
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
                @long-press="noteActions.showActions"
              />
            </StackLayout>
          </GridLayout>
        </StackLayout>
      </ScrollView>

      <Button
        text="+"
        class="fab"
        horizontal-alignment="right"
        vertical-alignment="bottom"
        @tap="onNewNote"
      />
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { $navigateTo } from 'nativescript-vue'

import { useGrid } from '../../hooks/use-grid/use-grid'
import { useNoteActions } from '../../hooks/use-note-actions/use-note-actions'
import EditorView from '../Editor/EditorView.vue'
import NoteCard from './components/NoteCard/NoteCard.vue'

const grid = useGrid()
const noteActions = useNoteActions()

const leftColumnNotes = computed(() =>
  grid.sortedNotes.filter((_, i) => i % 2 === 0),
)

const rightColumnNotes = computed(() =>
  grid.sortedNotes.filter((_, i) => i % 2 !== 0),
)

async function openNote(uri: string) {
  await $navigateTo(EditorView, { props: { uri } })
}

async function onNewNote() {
  const uri = grid.newNote()
  await $navigateTo(EditorView, { props: { uri } })
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

.fab {
  width: 56;
  height: 56;
  border-radius: 28;
  font-size: 24;
  background-color: #007AFF;
  color: #ffffff;
  margin: 16;
  elevation: 6;
}
</style>

