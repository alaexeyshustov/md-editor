<template>
  <AbsoluteLayout>
    <!-- Paste mini-button (shown when expanded) -->
    <Button
      v-if="isExpanded"
      text="📋"
      class="fab-mini"
      horizontal-alignment="right"
      vertical-alignment="bottom"
      :margin-bottom="miniBtnOffset"
      :opacity="miniOpacity"
      @tap="emit('paste')"
    />

    <!-- Backdrop tap target to collapse FAB -->
    <ContentView
      v-if="isExpanded"
      width="100%"
      height="100%"
      @tap="emit('collapse')"
    />

    <!-- Main FAB -->
    <Button
      ref="fabRef"
      :text="isExpanded ? '×' : '+'"
      class="fab"
      horizontal-alignment="right"
      vertical-alignment="bottom"
      @tap="emit('toggle')"
    />
  </AbsoluteLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Button as NsButton } from '@nativescript/core'

const props = defineProps<{ isExpanded: boolean }>()

const emit = defineEmits<{
  toggle: []
  paste: []
  collapse: []
}>()

const fabRef = ref<{ nativeView: NsButton } | null>(null)
const miniOpacity = ref(0)
const miniBtnOffset = ref(68)

watch(
  () => props.isExpanded,
  (expanded) => {
    if (!fabRef.value?.nativeView) return
    const view = fabRef.value.nativeView

    if (expanded) {
      miniOpacity.value = 0
      miniBtnOffset.value = 68
      view.animate({ rotate: 45, duration: 200, curve: 'spring' }).catch(() => {})
      view
        .animate({ rotate: 45, duration: 200, curve: 'spring' })
        .then(() => {
          miniOpacity.value = 1
          miniBtnOffset.value = 84
        })
        .catch(() => {})
    }
    else {
      miniOpacity.value = 0
      view.animate({ rotate: 0, duration: 150 }).catch(() => {})
    }
  },
)
</script>

<style scoped>
.fab {
  width: 56;
  height: 56;
  border-radius: 28;
  font-size: 24;
  background-color: #007aff;
  color: #ffffff;
  margin: 16;
  elevation: 6;
}

.fab-mini {
  width: 44;
  height: 44;
  border-radius: 22;
  font-size: 18;
  background-color: #34c759;
  color: #ffffff;
  margin-right: 22;
  elevation: 4;
}
</style>
