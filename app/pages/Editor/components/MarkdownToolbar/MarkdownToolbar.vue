<template>
  <ScrollView
    orientation="horizontal"
    class="toolbar"
  >
    <StackLayout orientation="horizontal">
      <Button
        text="#"
        class="toolbar-btn"
        @tap="emit('headline')"
      />
      <Button
        text="-"
        class="toolbar-btn"
        @tap="emit('list')"
      />
      <Button
        text="☑"
        class="toolbar-btn"
        @tap="emit('checkbox')"
      />
      <Button
        text="⧉"
        class="toolbar-btn"
        @tap="emit('copy-raw')"
      />
    </StackLayout>
  </ScrollView>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  headline: []
  list: []
  checkbox: []
  'copy-raw': []
}>()
</script>

<style scoped>
.toolbar {
  background-color: #f5f5f5;
  border-top-color: #dddddd;
  border-top-width: 1;
}

.toolbar-btn {
  width: 56;
  height: 44;
  font-size: 18;
  background-color: transparent;
  color: #333333;
  margin: 0 2;
}
</style>
