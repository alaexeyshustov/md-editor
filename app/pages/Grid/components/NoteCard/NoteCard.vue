<template>
  <StackLayout class="note-card">
    <Label
      :text="note.title"
      class="note-title"
      text-wrap="true"
    />
    <Label
      :text="note.preview"
      class="note-preview"
      text-wrap="true"
    />
  </StackLayout>
</template>

<script setup lang="ts">
import type { NoteMetadata } from '../../../../services/vault-service/vault-service'

defineProps<{ note: NoteMetadata }>()
</script>

<style scoped>
.note-card {
  background-color: #ffffff;
  border-radius: 8;
  padding: 12;
  margin: 6;
}

.note-title {
  font-size: 16;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 6;
}

.note-preview {
  font-size: 13;
  color: #666666;
}
</style>
