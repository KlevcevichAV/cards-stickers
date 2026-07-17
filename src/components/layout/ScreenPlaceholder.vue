<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="placeholder">
    <h1>{{ title }}</h1>
    <p>{{ $t('common.comingSoon') }}</p>
  </div>
</template>

<style scoped>
.placeholder {
  padding: var(--space-5);
}

h1 {
  margin: 0 0 var(--space-2);
  font-size: 22px;
}

p {
  color: var(--color-text-secondary);
}
</style>
