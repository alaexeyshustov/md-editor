<template>
  <Page>
    <ActionBar title="Notes" />
    <ScrollView>
      <StackLayout>
        <ActivityIndicator
          v-if="grid.isLoading"
          :busy="true"
          class="loader"
        />

        <Label
          v-else-if="grid.sortedNotes.length === 0"
          text="No notes yet. Open Obsidian to create your first note."
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
            />
          </StackLayout>
        </GridLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useGrid } from '../../hooks/use-grid/use-grid'
import NoteCard from './components/NoteCard/NoteCard.vue'

const grid = useGrid()

const leftColumnNotes = computed(() =>
  grid.sortedNotes.filter((_, i) => i % 2 === 0),
)

const rightColumnNotes = computed(() =>
  grid.sortedNotes.filter((_, i) => i % 2 !== 0),
)
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
