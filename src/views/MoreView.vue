<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { moreItems } from '@/config/navigation'
</script>

<template>
  <div class="more-view">
    <h1>{{ $t('nav.more') }}</h1>
    <ul>
      <li v-for="item in moreItems" :key="item.key">
        <RouterLink :to="item.path" class="row">
          <span class="icon">
            <component :is="item.icon" :size="18" />
          </span>
          <span class="text">
            <span class="title">{{ $t(item.titleKey) }}</span>
            <span v-if="item.subtitleKey" class="subtitle">{{ $t(item.subtitleKey) }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.more-view {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
}

h1 {
  font-size: 28px;
  margin: var(--space-2) 0 var(--space-4);
}

ul {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

li + li {
  border-top: 1px solid var(--color-border);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  flex-shrink: 0;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.title {
  font-size: 15px;
  font-weight: 500;
}

.subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
