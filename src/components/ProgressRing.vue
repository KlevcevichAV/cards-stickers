<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percent: number // 0..1
    size?: number
    strokeWidth?: number
    /** When true, colors gray→orange→green by progress; otherwise uses --color-accent. */
    auto?: boolean
  }>(),
  { size: 44, strokeWidth: 4, auto: true },
)

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const clamped = computed(() => Math.min(1, Math.max(0, props.percent)))
const dashOffset = computed(() => circumference.value * (1 - clamped.value))

const color = computed(() => {
  if (!props.auto) return 'var(--color-accent)'
  if (clamped.value <= 0) return 'var(--color-text-tertiary)'
  if (clamped.value >= 1) return 'var(--color-success)'
  return 'var(--color-warning)'
})
</script>

<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="ring">
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      stroke="var(--color-border)"
      :stroke-width="strokeWidth"
    />
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
      class="progress"
    />
  </svg>
</template>

<style scoped>
.ring {
  transform: rotate(-90deg);
}

.progress {
  transition: stroke-dashoffset 0.4s ease;
}
</style>
